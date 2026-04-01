import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { createClient } from '@supabase/supabase-js';

type SyncSummary = {
  syncedCount: number;
  deletedCount: number;
  skippedCount: number;
};

const preserveNotionInlineStyles = (text: string, annotations: any) => {
  if (text.match(/^\s*$/)) return text;

  const leadingSpaceMatch = text.match(/^(\s*)/);
  const trailingSpaceMatch = text.match(/(\s*)$/);
  const leadingSpace = leadingSpaceMatch ? leadingSpaceMatch[0] : '';
  const trailingSpace = trailingSpaceMatch ? trailingSpaceMatch[0] : '';

  let styled = text.trim();

  if (styled !== '') {
    if (annotations.code) styled = `\`${styled}\``;
    if (annotations.bold) styled = `**${styled}**`;
    if (annotations.italic) styled = `*${styled}*`;
    if (annotations.strikethrough) styled = `~~${styled}~~`;
    if (annotations.underline) styled = `<u>${styled}</u>`;

    if (annotations.color && annotations.color !== 'default') {
      if (annotations.color.endsWith('_background')) {
        styled = `<mark data-notion-color="${annotations.color}">${styled}</mark>`;
      } else {
        styled = `<span data-notion-color="${annotations.color}">${styled}</span>`;
      }
    }
  }

  return leadingSpace + styled + trailingSpace;
};

const preserveToggleBlocks = (blocks: any[]): any[] => {
  return blocks.map((block) => {
    if (block.children?.length) {
      block.children = preserveToggleBlocks(block.children);
    }

    if (block.type === 'toggle' && (!block.children || block.children.length === 0)) {
      const summary = (block.parent || '').trim();
      block.type = 'paragraph';
      block.parent = summary
        ? `<details>\n<summary>${summary}</summary>\n</details>`
        : '';
    }

    return block;
  });
};

const ALBUM_TABLE_MAP: Record<string, string> = {
  INTRO: 'projects_intro',
  CODING: 'projects_coding',
  VIDEO: 'projects_video',
  PHOTO: 'projects_photo',
  WRITING: 'projects_writing',
};

function getSyncContext() {
  const notionApiKey = process.env.NOTION_API_KEY;
  const notionDbId = process.env.NOTION_DATA_SOURCE_ID;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  const vars = {
    NOTION_API_KEY: notionApiKey,
    NOTION_DATA_SOURCE_ID: notionDbId,
    VITE_SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_KEY: supabaseServiceKey,
  };

  const missingVars = Object.entries(vars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  const notion = new Client({ auth: notionApiKey });
  const n2m = new NotionToMarkdown({ notionClient: notion });
  (n2m as any).annotatePlainText = preserveNotionInlineStyles;

  return {
    notionApiKey,
    notionDbId,
    n2m,
    supabase: createClient(supabaseUrl, supabaseServiceKey),
  };
}

export async function runNotionSync(): Promise<SyncSummary> {
  const { notionApiKey, notionDbId, n2m, supabase } = getSyncContext();

  console.log('🔄 Starting Notion Sync...');
  console.log(`Querying Database ID: ${notionDbId}`);

  const summary: SyncSummary = {
    syncedCount: 0,
    deletedCount: 0,
    skippedCount: 0,
  };

  let response = await fetch(`https://api.notion.com/v1/databases/${notionDbId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${notionApiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sorts: [{ property: 'Date', direction: 'descending' }],
    }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      console.warn('⚠️  Database not found (404). Listing accessible databases for debugging...');
      const searchRes = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter: { value: 'database', property: 'object' },
        }),
      });
      const searchData = (await searchRes.json()) as any;
      console.log('--- AVAILABLE DATABASES ---');
      searchData.results?.forEach((db: any) => {
        const title = db.title?.[0]?.plain_text || 'Untitled';
        console.log(`ID: ${db.id} | Title: ${title}`);
      });
      console.log('---------------------------');
    }

    throw new Error(`Notion API Error: ${response.status} ${response.statusText} - ${await response.text()}`);
  }

  const allPages = (await response.json()) as any;
  console.log(`📦 Found ${allPages.results.length} pages in Notion.`);

  const activeDetails = new Set<string>();

  for (const page of allPages.results) {
    if (!('properties' in page)) continue;

    const props = page.properties as any;
    if (allPages.results.indexOf(page) === 0) {
      console.log('🔍 First Page Keys:', Object.keys(props));
    }

    const pageId = page.id;
    const title = props.Name?.title?.[0]?.plain_text || props.Title?.title?.[0]?.plain_text || 'Untitled';
    const album = props.Type?.select?.name || props.Album?.select?.name || props.Category?.select?.name;

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

    const mdBlocks = preserveToggleBlocks(await n2m.pageToMarkdown(pageId));
    const mdString = n2m.toMarkdownString(mdBlocks);

    let processedContent = mdString.parent || '';
    processedContent = processedContent.replace(
      /\[([^\]]+\.(mp4|mov|webm))\]\(([^)]+)\)/gi,
      (_, _filename, _ext, url) => `![VIDEO](${url})`,
    );

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

    const { error } = await supabase.from(tableName).upsert(finalPayload, { onConflict: 'id' });

    if (error) {
      console.error(`❌ Failed to sync "${title}" to ${tableName}:`, error.message);
    } else {
      summary.syncedCount += 1;
      console.log(`✅ Synced: ${title} -> ${tableName}`);
    }
  }

  if (allPages.results.length > 0) {
    console.log('🧹 Starting Cleanup Check...');
    const tableNames = Object.values(ALBUM_TABLE_MAP);

    for (const table of tableNames) {
      const { data: remoteData, error: fetchError } = await supabase.from(table).select('id');

      if (fetchError) {
        console.error(`❌ Could not fetch IDs from ${table} for cleanup:`, fetchError.message);
        continue;
      }

      if (!remoteData) continue;

      const idsToDelete = remoteData.map((row) => row.id).filter((id) => !activeDetails.has(id));

      if (idsToDelete.length === 0) continue;

      console.log(`🗑️  Found ${idsToDelete.length} orphaned records in ${table}. Deleting...`);
      const { error: deleteError } = await supabase.from(table).delete().in('id', idsToDelete);

      if (deleteError) {
        console.error(`❌ Failed to delete records from ${table}:`, deleteError.message);
      } else {
        summary.deletedCount += idsToDelete.length;
        console.log(`✅ Deleted ${idsToDelete.length} records from ${table}`);
      }
    }
  }

  console.log('🎉 Sync Complete!');
  return summary;
}
