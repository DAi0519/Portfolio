
import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import crypto from 'crypto';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const NOTION_KEY = process.env.NOTION_API_KEY; 
const DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID;

if (!NOTION_KEY || !DATA_SOURCE_ID) {
  console.error('Missing required environment variables.');
  console.log('Required: NOTION_API_KEY, NOTION_DATA_SOURCE_ID');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_KEY });
const MEDIA_ROOT = path.resolve(process.cwd(), 'public/media');
const DATA_FILE = path.resolve(process.cwd(), 'data/projects.json');

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Global context to track current processing item (for folder organization)
let currentContext = {
  albumId: 'MISC',
  projectSlug: 'general'
};

// --- Helper: Slugify string (supports Chinese) ---
function slugify(text: string): string {
  if (!text) return 'untitled';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w\-\u4e00-\u9fa5]/g, '') // remove chars that are not word, hyphen, or Chinese
    .replace(/\-\-+/g, '-') // replace multiple - with single -
    .replace(/^-+/, '') // trim - from start
    .replace(/-+$/, ''); // trim - from end
}

// --- Helper: Download a file to structured local folder ---
async function downloadAsset(url: string, extension?: string): Promise<string | null> {
  if (!url) return null;
  
  // Create folder structure: public/media/[Album]/[Project]/
  const folderPath = path.join(
    MEDIA_ROOT, 
    currentContext.albumId.toLowerCase(), 
    currentContext.projectSlug
  );
  
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Generate filename
  // Try to use original filename from URL if it looks clean, otherwise use hash
  let filename = '';
  const originalNameMatch = url.match(/\/([^\/?#]+)[^\/]*$/);
  
  if (originalNameMatch && originalNameMatch[1] && originalNameMatch[1].length < 50 && /^[a-zA-Z0-9._-]+$/.test(originalNameMatch[1])) {
    filename = originalNameMatch[1];
  } else {
    // Fallback to hash
    const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 8);
    const ext = extension || getExtensionFromUrl(url) || 'bin';
    filename = `${hash}.${ext}`;
  }

  // Handle Douyin/cleaner filenames if manual mapping needed (optional)
  
  const filepath = path.join(folderPath, filename);
  const publicPath = `/media/${currentContext.albumId.toLowerCase()}/${currentContext.projectSlug}/${filename}`;
  
  // Skip if already exists
  if (fs.existsSync(filepath)) {
    // console.log(`   ⏭️ Skipping: ${filename}`);
    return publicPath;
  }
  
  console.log(`   ⬇️ Downloading: ${publicPath}`);
  
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 60000 
    }, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadAsset(response.headers.location, extension).then(resolve);
        return;
      }
      
      if (response.statusCode !== 200) {
        console.warn(`   ⚠️ Failed (HTTP ${response.statusCode}): ${url}`);
        resolve(null);
        return;
      }
      
      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(publicPath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {});
        console.error(`   ❌ Write error: ${err.message}`);
        resolve(null);
      });
    });
    
    request.on('error', (err) => {
      console.error(`   ❌ Download error: ${err.message}`);
      resolve(null);
    });
  });
}

function getExtensionFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (match) return match[1].toLowerCase();
    
    // Common mappings
    if (url.includes('.mp4')) return 'mp4';
    if (url.includes('.jpg') || url.includes('.jpeg')) return 'jpg';
    if (url.includes('.png')) return 'png';
    return null;
  } catch { return null; }
}

// --- Block Processing ---
async function fetchPageContent(pageId: string): Promise<string> {
  try {
    const blocks = await notion.blocks.children.list({ block_id: pageId });
    const parts: string[] = [];
    
    for (const block of blocks.results) {
        if ((block as any).type === 'table') {
            parts.push(await tableToMarkdown(block));
        } else {
            parts.push(await blockToMarkdown(block));
        }
    }
    return parts.join('\n\n');
  } catch (error) {
    console.error(`Error fetching blocks for ${pageId}`, error);
    return "";
  }
}

async function blockToMarkdown(block: any): Promise<string> {
  const type = block.type;
  if (!block[type]) return "";

  const textContent = block[type].rich_text ? 
      block[type].rich_text.map((t: any) => t.plain_text + (t.href ? `(${t.href})` : '')).join("") 
      : "";

  switch (type) {
    case 'paragraph': return textContent;
    case 'heading_1': return `# ${textContent}`;
    case 'heading_2': return `## ${textContent}`;
    case 'heading_3': return `### ${textContent}`;
    case 'bulleted_list_item': return `- ${textContent}`;
    case 'numbered_list_item': return `1. ${textContent}`;
    case 'quote': return `> ${textContent}`;
    case 'code': return `\`\`\`${block.code.language}\n${textContent}\n\`\`\``;
    case 'divider': return `---`;
    
    case 'image': {
      const imgUrl = block.image.type === 'external' ? block.image.external.url : block.image.file?.url;
      const caption = block.image.caption?.[0]?.plain_text || "Image";
      if (!imgUrl) return "";
      const localPath = await downloadAsset(imgUrl);
      return localPath ? `![${caption}](${localPath})` : `![${caption}](${imgUrl})`;
    }
    case 'video': {
       const videoObj = block.video;
       let videoUrl = videoObj.type === 'external' ? videoObj.external?.url : videoObj.file?.url;
       if (!videoUrl) return "";
       const localPath = await downloadAsset(videoUrl, 'mp4');
       return localPath ? `![VIDEO](${localPath})` : `![VIDEO](${videoUrl})`;
    }
    case 'table': return `[TABLE_PLACEHOLDER:${block.id}]`;
    default: return "";
  }
}

async function tableToMarkdown(tableBlock: any): Promise<string> {
    try {
        const rows = await notion.blocks.children.list({ block_id: tableBlock.id });
        if (!rows.results || rows.results.length === 0) return "";
        
        const markdownRows: string[] = [];
        rows.results.forEach((row: any, index: number) => {
            if (row.type !== 'table_row') return;
            const cells = row.table_row.cells.map((cell: any[]) => 
                cell.map((c: any) => c.plain_text || "").join("")
            );
            markdownRows.push(`| ${cells.join(' | ')} |`);
            if (index === 0) markdownRows.push(`| ${cells.map(() => '---').join(' | ')} |`);
        });
        return markdownRows.join('\n');
    } catch { return ""; }
}

// --- Main Sync ---
async function syncNotionToLocal() {
  console.log('🚀 Starting Structured Notion Sync...');
  
  // @ts-ignore
  const response = await notion.dataSources.query({
    data_source_id: DATA_SOURCE_ID,
    sorts: [{ property: 'Date', direction: 'descending' }],
  });

  console.log(`📦 Found ${response.results.length} items.`);

  const projects: Record<string, any[]> = { CODING: [], VIDEO: [], PHOTO: [], WRITING: [] };

  for (const page of response.results) {
    if (!('properties' in page)) continue;
    if ((page as any).archived) continue;

    const props = page.properties as any;
    const itemTitle = props.Name?.title?.[0]?.plain_text || 'Untitled';
    const typeSelect = props.Type?.select?.name?.toUpperCase();

    if (!projects[typeSelect]) continue;

    // Set Context for Download
    currentContext = {
      albumId: typeSelect,
      projectSlug: slugify(itemTitle) || 'untitled-project'
    };

    console.log(`\n📂 [${typeSelect}] ${itemTitle}`);
    
    // Cover Image
    let imageUrl = null;
    if (props.Image?.files?.length > 0) {
        const fileObj = props.Image.files[0];
        const originalUrl = fileObj.file?.url || fileObj.external?.url;
        if (originalUrl) imageUrl = await downloadAsset(originalUrl);
    }

    // Content
    const markdownContent = await fetchPageContent(page.id);

    projects[typeSelect].push({
      id: page.id,
      albumId: typeSelect,
      title: itemTitle,
      date: props.Date?.date?.start || props.Date?.rich_text?.[0]?.plain_text || new Date().toISOString(),
      description: props.Description?.rich_text?.[0]?.plain_text || '',
      tags: props.Tags?.multi_select?.map((t: any) => t.name) || [],
      imageUrl,
      link: props.Link?.url || null,
      content: markdownContent
    });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify({ syncedAt: new Date().toISOString(), projects }, null, 2));
  console.log('\n🎉 Sync Complete!');
}

syncNotionToLocal();
