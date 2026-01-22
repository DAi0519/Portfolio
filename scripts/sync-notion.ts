
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

const MEDIA_DIR = path.resolve(process.cwd(), 'public/media');
const DATA_FILE = path.resolve(process.cwd(), 'data/projects.json');

// Ensure directories exist
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// --- Helper: Download a file to local media folder ---
async function downloadAsset(url: string, extension?: string): Promise<string | null> {
  if (!url) return null;
  
  // Generate a unique filename based on URL hash
  const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
  const ext = extension || getExtensionFromUrl(url) || 'bin';
  const filename = `${hash}.${ext}`;
  const filepath = path.join(MEDIA_DIR, filename);
  const publicPath = `/media/${filename}`;
  
  // Skip if already exists (Incremental Sync)
  if (fs.existsSync(filepath)) {
    console.log(`   ⏭️ Skipping (exists): ${filename}`);
    return publicPath;
  }
  
  console.log(`   ⬇️ Downloading: ${filename}`);
  
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const request = protocol.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 60000 
    }, (response) => {
      // Handle redirects
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadAsset(response.headers.location, extension).then(resolve);
        return;
      }
      
      if (response.statusCode !== 200) {
        console.warn(`   ⚠️ Failed to download (HTTP ${response.statusCode}): ${url}`);
        resolve(null);
        return;
      }
      
      const file = fs.createWriteStream(filepath);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`   ✅ Downloaded: ${filename}`);
        resolve(publicPath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Clean up partial file
        console.error(`   ❌ Write error: ${err.message}`);
        resolve(null);
      });
    });
    
    request.on('error', (err) => {
      console.error(`   ❌ Download error: ${err.message}`);
      resolve(null);
    });
    
    request.on('timeout', () => {
      request.destroy();
      console.error(`   ❌ Download timeout`);
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
    
    // Fallback for common patterns
    if (url.includes('.mp4')) return 'mp4';
    if (url.includes('.mov')) return 'mov';
    if (url.includes('.webm')) return 'webm';
    if (url.includes('.jpg') || url.includes('.jpeg')) return 'jpg';
    if (url.includes('.png')) return 'png';
    if (url.includes('.gif')) return 'gif';
    if (url.includes('.webp')) return 'webp';
    
    return null;
  } catch {
    return null;
  }
}

// --- Helper: Convert Notion Blocks to Markdown (with asset downloading) ---
async function fetchPageContent(pageId: string): Promise<string> {
  try {
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });
    
    const markdownParts: string[] = [];
    for (const block of blocks.results) {
        if ((block as any).type === 'table') {
            const tableMarkdown = await tableToMarkdown(block);
            markdownParts.push(tableMarkdown);
        } else {
            const content = await blockToMarkdown(block);
            markdownParts.push(content);
        }
    }
    return markdownParts.join('\n\n');
  } catch (error) {
    console.error(`Error fetching blocks for ${pageId}`, error);
    return "";
  }
}

// --- Helper: Convert a single Notion block to Markdown ---
async function blockToMarkdown(block: any): Promise<string> {
  const type = block.type;
  if (!block[type]) return "";

  const textContent = block[type].rich_text ? 
      block[type].rich_text.map((t: any) => t.plain_text + (t.href ? `(${t.href})` : '')).join("") 
      : "";

  switch (type) {
    case 'paragraph':
      return textContent;
    case 'heading_1':
      return `# ${textContent}`;
    case 'heading_2':
      return `## ${textContent}`;
    case 'heading_3':
      return `### ${textContent}`;
    case 'bulleted_list_item':
      return `- ${textContent}`;
    case 'numbered_list_item':
      return `1. ${textContent}`;
    case 'quote':
      return `> ${textContent}`;
    case 'code':
      return `\`\`\`${block.code.language}\n${textContent}\n\`\`\``;
    case 'image': {
      const imgUrl = block.image.type === 'external' ? block.image.external.url : block.image.file?.url;
      const caption = block.image.caption?.[0]?.plain_text || "Image";
      
      if (!imgUrl) return "";
      
      // Download and get local path
      const localPath = await downloadAsset(imgUrl);
      return localPath ? `![${caption}](${localPath})` : `![${caption}](${imgUrl})`;
    }
    case 'video': {
       const videoObj = block.video;
       let videoUrl = "";
       
       if (videoObj.type === 'external') {
           videoUrl = videoObj.external?.url || "";
       } else if (videoObj.type === 'file') {
           videoUrl = videoObj.file?.url || "";
       }
       
       if (!videoUrl) {
           console.warn(`⚠️ Video block ${block.id} has no URL.`);
           return "";
       }
       
       // Download and get local path
       const localPath = await downloadAsset(videoUrl, 'mp4');
       return localPath ? `![VIDEO](${localPath})` : `![VIDEO](${videoUrl})`;
    }
    case 'divider':
      return `---`;
    case 'table':
      return `[TABLE_PLACEHOLDER:${block.id}]`;
    default:
      return "";
  }
}

// --- Helper: Convert Notion Table block to Markdown ---
async function tableToMarkdown(tableBlock: any): Promise<string> {
    try {
        const rows = await notion.blocks.children.list({
            block_id: tableBlock.id,
        });
        
        if (!rows.results || rows.results.length === 0) return "";
        
        const markdownRows: string[] = [];
        
        rows.results.forEach((row: any, index: number) => {
            if (row.type !== 'table_row') return;
            
            const cells = row.table_row.cells.map((cell: any[]) => 
                cell.map((c: any) => c.plain_text || "").join("")
            );
            
            markdownRows.push(`| ${cells.join(' | ')} |`);
            
            if (index === 0) {
                markdownRows.push(`| ${cells.map(() => '---').join(' | ')} |`);
            }
        });
        
        return markdownRows.join('\n');
    } catch (error) {
        console.error(`Error fetching table rows for ${tableBlock.id}`, error);
        return "";
    }
}

// --- Main Sync Function ---
async function syncNotionToLocal() {
  console.log('🚀 Starting Notion Sync (Local Mode)...');
  console.log('Target Data Source ID:', DATA_SOURCE_ID);

  if (!DATA_SOURCE_ID) {
      throw new Error("Missing NOTION_DATA_SOURCE_ID");
  }

  try {
    // @ts-ignore
    const response = await notion.dataSources.query({
      data_source_id: DATA_SOURCE_ID,
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
    });

    console.log(`📦 Found ${response.results.length} items in Notion.`);

    const projects: Record<string, any[]> = {
      CODING: [],
      VIDEO: [],
      PHOTO: [],
      WRITING: []
    };

    for (const page of response.results) {
      if (!('properties' in page)) continue;
      if ((page as any).archived) continue;
      
      const props = page.properties as any;
      const id = page.id;  

      const typeSelect = props.Type?.select?.name?.toUpperCase();
      
      if (!projects[typeSelect]) {
        console.warn(`⚠️ Item "${id}" has unknown type: ${typeSelect || 'None'}.`);
        continue;
      }

      const title = props.Name?.title?.[0]?.plain_text || 'Untitled';
      let date = props.Date?.date?.start || props.Date?.rich_text?.[0]?.plain_text || new Date().toISOString(); 
      const description = props.Description?.rich_text?.[0]?.plain_text || '';
      const tags = props.Tags?.multi_select?.map((t: any) => t.name) || [];
      const link = props.Link?.url || null;

      // Cover Image
      let imageUrl = null;
      if (props.Image?.files?.length > 0) {
          const fileObj = props.Image.files[0];
          const originalUrl = fileObj.file?.url || fileObj.external?.url || null;
          if (originalUrl) {
            imageUrl = await downloadAsset(originalUrl);
          }
      }

      console.log(`   📄 Processing "${title}"...`);
      const markdownContent = await fetchPageContent(id);

      projects[typeSelect].push({
        id,
        albumId: typeSelect,
        title,
        date,
        description,
        tags,
        imageUrl,
        link,
        content: markdownContent
      });
    }

    // Write to local JSON file
    const outputData = {
      syncedAt: new Date().toISOString(),
      projects
    };
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(outputData, null, 2));
    console.log(`\n💾 Data saved to: ${DATA_FILE}`);
    console.log('🎉 Sync Complete!');

  } catch (error) {
    console.error('🔥 Fatal Error:', error);
    process.exit(1);
  }
}

syncNotionToLocal();
