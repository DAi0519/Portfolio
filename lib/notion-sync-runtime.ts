/**
 * [INPUT]: 依赖 Notion HTTP API、Supabase REST API 与服务端环境变量
 * [OUTPUT]: 对外提供 runNotionSyncRuntime，将 Notion 内容同步为 Supabase 项目行
 * [POS]: lib 的统一同步核心，由 GitHub Actions 主调度与 Vercel 备用接口共同调用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
type SyncSummary = {
  syncedCount: number;
  deletedCount: number;
  skippedCount: number;
};

type NotionRichText = {
  plain_text?: string;
  href?: string | null;
  annotations?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    code?: boolean;
    color?: string;
  };
  text?: {
    content?: string;
    link?: {
      url?: string;
    } | null;
  };
};

const NOTION_VERSION = '2022-06-28';
const NOTION_MAX_ATTEMPTS = 3;
const NOTION_RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const NOTION_MAX_RETRY_DELAY_MS = 30_000;

const ALBUM_TABLE_MAP: Record<string, string> = {
  INTRO: 'projects_intro',
  CODING: 'projects_coding',
  VIDEO: 'projects_video',
  PHOTO: 'projects_photo',
  WRITING: 'projects_writing',
};

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function styleInlineText(text: string, annotations: NotionRichText['annotations'], href?: string | null) {
  if (text.match(/^\s*$/)) return text;

  const leadingSpace = text.match(/^(\s*)/)?.[0] ?? '';
  const trailingSpace = text.match(/(\s*)$/)?.[0] ?? '';

  let styled = text.trim();

  if (styled !== '') {
    if (annotations?.code) styled = `\`${styled}\``;
    if (annotations?.bold) styled = `**${styled}**`;
    if (annotations?.italic) styled = `*${styled}*`;
    if (annotations?.strikethrough) styled = `~~${styled}~~`;
    if (annotations?.underline) styled = `<u>${styled}</u>`;

    if (annotations?.color && annotations.color !== 'default') {
      if (annotations.color.endsWith('_background')) {
        styled = `<mark data-notion-color="${annotations.color}">${styled}</mark>`;
      } else {
        styled = `<span data-notion-color="${annotations.color}">${styled}</span>`;
      }
    }

    if (href) {
      styled = `[${styled}](${href})`;
    }
  }

  return leadingSpace + styled + trailingSpace;
}

function renderRichText(richText: NotionRichText[] = []) {
  return richText
    .map((token) => {
      const text = token.plain_text ?? token.text?.content ?? '';
      const href = token.href ?? token.text?.link?.url ?? null;
      return styleInlineText(text, token.annotations, href);
    })
    .join('');
}

function getFileUrl(fileField: any) {
  if (!fileField) return null;
  if (fileField.type === 'external') return fileField.external?.url ?? null;
  if (fileField.type === 'file') return fileField.file?.url ?? null;
  return null;
}

function getMediaName(url: string | null, fallback: string) {
  if (!url) return fallback;

  try {
    const parsed = new URL(url);
    const lastSegment = parsed.pathname.split('/').filter(Boolean).pop();
    return lastSegment ? decodeURIComponent(lastSegment) : fallback;
  } catch {
    return fallback;
  }
}

function indentLines(text: string, depth: number) {
  if (!text) return '';
  const indent = '  '.repeat(depth);
  return text
    .split('\n')
    .map((line) => (line ? `${indent}${line}` : line))
    .join('\n');
}

function isVideoAsset(url: string | null, filename = '') {
  const candidate = `${url ?? ''} ${filename}`;
  return /\.(mp4|mov|webm)(\?|$|\s)/i.test(candidate);
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function getNotionRetryDelay(response: Response, attempt: number) {
  const retryAfter = response.headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
      return Math.min(seconds * 1000, NOTION_MAX_RETRY_DELAY_MS);
    }

    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) {
      return Math.min(Math.max(retryAt - Date.now(), 0), NOTION_MAX_RETRY_DELAY_MS);
    }
  }

  return 1000 * 2 ** (attempt - 1);
}

async function notionRequest<T>(path: string, init: RequestInit = {}) {
  const notionApiKey = getEnv('NOTION_API_KEY');
  const url = `https://api.notion.com/v1${path}`;

  for (let attempt = 1; attempt <= NOTION_MAX_ATTEMPTS; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(url, {
        ...init,
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
          ...(init.headers ?? {}),
        },
      });
    } catch (error) {
      if (attempt === NOTION_MAX_ATTEMPTS) throw error;

      const delay = 1000 * 2 ** (attempt - 1);
      console.warn(`Notion request failed (${attempt}/${NOTION_MAX_ATTEMPTS}); retrying in ${delay}ms`, error);
      await wait(delay);
      continue;
    }

    if (response.ok) {
      return (await response.json()) as T;
    }

    const responseBody = await response.text();
    const canRetry =
      NOTION_RETRYABLE_STATUS.has(response.status) &&
      attempt < NOTION_MAX_ATTEMPTS;

    if (!canRetry) {
      throw new Error(`Notion API Error: ${response.status} ${response.statusText} - ${responseBody}`);
    }

    const delay = getNotionRetryDelay(response, attempt);
    console.warn(
      `Notion API ${response.status} (${attempt}/${NOTION_MAX_ATTEMPTS}); retrying in ${delay}ms`
    );
    await wait(delay);
  }

  throw new Error('Notion request exhausted retry attempts');
}

async function listAccessibleDatabases() {
  const searchData = await notionRequest<any>('/search', {
    method: 'POST',
    body: JSON.stringify({
      filter: { value: 'database', property: 'object' },
    }),
  });

  console.log('--- AVAILABLE DATABASES ---');
  searchData.results?.forEach((db: any) => {
    const title = db.title?.[0]?.plain_text || 'Untitled';
    console.log(`ID: ${db.id} | Title: ${title}`);
  });
  console.log('---------------------------');
}

async function listBlockChildren(blockId: string) {
  const results: any[] = [];
  let cursor: string | undefined;

  do {
    const params = new URLSearchParams({ page_size: '100' });
    if (cursor) params.set('start_cursor', cursor);

    const response = await notionRequest<any>(`/blocks/${blockId}/children?${params.toString()}`, {
      method: 'GET',
    });

    results.push(...(response.results ?? []));
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return results;
}

async function renderBlockChildren(blockId: string, depth = 0) {
  const children = await listBlockChildren(blockId);
  let numberedCounter = 0;
  const rendered = await Promise.all(
    children.map((block) => {
      if (block.type === 'numbered_list_item') {
        numberedCounter++;
        return renderBlock(block, depth, numberedCounter);
      }
      numberedCounter = 0;
      return renderBlock(block, depth);
    })
  );
  return rendered.filter(Boolean).join('\n\n');
}

async function renderBlock(block: any, depth = 0, listIndex?: number): Promise<string> {
  const type = block.type;
  const value = block[type] ?? {};
  const text = renderRichText(value.rich_text ?? []);
  const children = block.has_children ? await renderBlockChildren(block.id, depth + 1) : '';
  const nested = children ? `\n${children}` : '';
  const indent = '  '.repeat(depth);

  switch (type) {
    case 'paragraph':
      if (!text && !children) return '';
      return text ? `${indent}${text}${nested}` : children;
    case 'heading_1':
      return `# ${text}`;
    case 'heading_2':
      return `## ${text}`;
    case 'heading_3':
      return `### ${text}`;
    case 'bulleted_list_item':
      return `${indent}- ${text}${nested}`;
    case 'numbered_list_item':
      return `${indent}${listIndex ?? 1}. ${text}${nested}`;
    case 'to_do':
      return `${indent}- [${value.checked ? 'x' : ' '}] ${text}${nested}`;
    case 'quote':
      return `${indent}> ${text}${nested ? `\n${indentLines(children, 0)}` : ''}`;
    case 'callout':
      return `${indent}> ${text}${nested ? `\n${indentLines(children, 0)}` : ''}`;
    case 'divider':
      return '---';
    case 'code': {
      const language = value.language || '';
      return `\`\`\`${language}\n${text}\n\`\`\``;
    }
    case 'equation':
      return `$$${value.expression ?? ''}$$`;
    case 'toggle': {
      const summary = text.trim();
      if (!children) {
        return summary ? `<details>\n<summary>${summary}</summary>\n</details>` : '';
      }

      return `<details>\n<summary>${summary}</summary>\n\n${children}\n</details>`;
    }
    case 'bookmark':
    case 'embed': {
      const url = value.url ?? '';
      return url ? `[${url}](${url})` : '';
    }
    case 'image': {
      const url = getFileUrl(value);
      const caption = renderRichText(value.caption ?? []).trim() || 'Image';
      return url ? `![${caption}](${url})` : '';
    }
    case 'video': {
      const url = getFileUrl(value);
      return url ? `![VIDEO](${url})` : '';
    }
    case 'file':
    case 'pdf':
    case 'audio': {
      const url = getFileUrl(value);
      const caption = renderRichText(value.caption ?? []).trim();
      const filename = caption || getMediaName(url, type);
      if (!url) return '';
      return isVideoAsset(url, filename) ? `![VIDEO](${url})` : `[${filename}](${url})`;
    }
    case 'child_page':
      return `## ${value.title ?? ''}`;
    default:
      return '';
  }
}

async function upsertSupabaseRow(tableName: string, payload: Record<string, unknown>) {
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseServiceKey = getEnv('SUPABASE_SERVICE_KEY');
  const url = new URL(`/rest/v1/${tableName}`, supabaseUrl);
  url.searchParams.set('on_conflict', 'id');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Supabase upsert failed: ${response.status} ${response.statusText} - ${await response.text()}`);
  }
}

async function listSupabaseIds(tableName: string) {
  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseServiceKey = getEnv('SUPABASE_SERVICE_KEY');
  const url = new URL(`/rest/v1/${tableName}`, supabaseUrl);
  url.searchParams.set('select', 'id');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase select failed: ${response.status} ${response.statusText} - ${await response.text()}`);
  }

  return (await response.json()) as Array<{ id: string }>;
}

async function deleteSupabaseIds(tableName: string, ids: string[]) {
  if (ids.length === 0) return;

  const supabaseUrl = getEnv('VITE_SUPABASE_URL');
  const supabaseServiceKey = getEnv('SUPABASE_SERVICE_KEY');
  const url = new URL(`/rest/v1/${tableName}`, supabaseUrl);
  url.searchParams.set('id', `in.(${ids.join(',')})`);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      Prefer: 'return=minimal',
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase delete failed: ${response.status} ${response.statusText} - ${await response.text()}`);
  }
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export async function runNotionSyncRuntime(): Promise<SyncSummary> {
  const notionDbId = getEnv('NOTION_DATA_SOURCE_ID');

  console.log('🔄 Starting Notion Sync...');
  console.log(`Querying Database ID: ${notionDbId}`);

  const summary: SyncSummary = {
    syncedCount: 0,
    deletedCount: 0,
    skippedCount: 0,
  };

  let allPages: any;

  try {
    allPages = await notionRequest<any>(`/databases/${notionDbId}/query`, {
      method: 'POST',
      body: JSON.stringify({
        page_size: 100,
        sorts: [{ property: 'Date', direction: 'descending' }],
      }),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      console.warn('⚠️  Database not found (404). Listing accessible databases for debugging...');
      await listAccessibleDatabases();
    }
    throw error;
  }

  console.log(`📦 Found ${allPages.results.length} pages in Notion.`);

  const activeDetails = new Set<string>();

  for (const page of allPages.results) {
    if (!('properties' in page)) continue;

    const props = page.properties as any;
    if (allPages.results.indexOf(page) === 0) {
      console.log('🔍 First Page Keys:', Object.keys(props));
    }

    const pageId = page.id;
    const title =
      props.Name?.title?.[0]?.plain_text ||
      props.Title?.title?.[0]?.plain_text ||
      'Untitled';
    const album =
      props.Type?.select?.name ||
      props.Album?.select?.name ||
      props.Category?.select?.name;

    if (!album || !ALBUM_TABLE_MAP[album.toUpperCase()]) {
      console.warn(`⚠️  Skipping "${title}" (${pageId}): Unknown Album/Category "${album}"`);
      summary.skippedCount += 1;
      continue;
    }

    const tableName = ALBUM_TABLE_MAP[album.toUpperCase()];
    const date = props.Date?.date?.start || new Date().toISOString().split('T')[0];
    const tags = props.Tags?.multi_select?.map((tag: any) => tag.name) || [];
    const description = props.Description?.rich_text?.[0]?.plain_text || '';
    const link = props.Link?.url || null;

    let imageUrl = null;
    const imageProperty = props.Image?.files?.[0];
    if (imageProperty) {
      if (imageProperty.type === 'external') {
        imageUrl = imageProperty.external?.url;
      } else if (imageProperty.type === 'file') {
        imageUrl = imageProperty.file?.url;
        console.warn(`⚠️  "${title}" uses Notion-hosted image (will expire)`);
      }
    }

    if (!imageUrl && page.cover) {
      if (page.cover.type === 'external') {
        imageUrl = page.cover.external.url;
      } else if (page.cover.type === 'file') {
        imageUrl = page.cover.file.url;
        console.warn(`⚠️  "${title}" uses Notion-hosted cover (will expire)`);
      }
    }

    const processedContent = await renderBlockChildren(pageId);
    const finalPayload = {
      id: pageId,
      title,
      date,
      description,
      tags,
      link,
      image_url: imageUrl,
      content: processedContent,
    };

    activeDetails.add(pageId);

    try {
      await upsertSupabaseRow(tableName, finalPayload);
      summary.syncedCount += 1;
      console.log(`✅ Synced: ${title} -> ${tableName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to sync "${title}" to ${tableName}:`, message);
    }
  }

  if (allPages.results.length > 0) {
    console.log('🧹 Starting Cleanup Check...');

    for (const tableName of Object.values(ALBUM_TABLE_MAP)) {
      try {
        const remoteData = await listSupabaseIds(tableName);
        const idsToDelete = remoteData
          .map((row) => row.id)
          .filter((id) => !activeDetails.has(id));

        if (idsToDelete.length === 0) continue;

        console.log(`🗑️  Found ${idsToDelete.length} orphaned records in ${tableName}. Deleting...`);

        for (const batch of chunk(idsToDelete, 50)) {
          await deleteSupabaseIds(tableName, batch);
        }

        summary.deletedCount += idsToDelete.length;
        console.log(`✅ Deleted ${idsToDelete.length} records from ${tableName}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`❌ Cleanup failed for ${tableName}:`, message);
      }
    }
  }

  console.log('🎉 Sync Complete!');
  return summary;
}
