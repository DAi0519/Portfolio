
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_DB_ID = process.env.NOTION_DATA_SOURCE_ID;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Must use Service Key for RLS bypass/writing

if (!NOTION_API_KEY || !NOTION_DB_ID || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables. Please check .env.local');
  process.exit(1);
}

// Initialize Clients
const notion = new Client({ auth: NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Album/Category Mapping
// Maps Notion "Album" select option -> Supabase Table Name
const ALBUM_TABLE_MAP: Record<string, string> = {
  'CODING': 'projects_coding',
  'VIDEO': 'projects_video',
  'PHOTO': 'projects_photo',
  'WRITING': 'projects_writing'
};

async function sync() {
  console.log('🔄 Starting Notion Sync...');
  
  try {
    // 1. Fetch all pages from Notion Database
    console.log(`Querying Database ID: ${NOTION_DB_ID}`);
    let r = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sorts: [{ property: 'Date', direction: 'descending' }],
      })
    });

    if (!r.ok) {
        if (r.status === 404) {
            console.warn(`⚠️  Database not found (404). Attempting to list ALL accessible databases to debug...`);
            const searchRes = await fetch('https://api.notion.com/v1/search', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${NOTION_API_KEY}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filter: { value: 'database', property: 'object' }
                })
            });
            const searchData = await searchRes.json() as any;
            console.log('--- AVAILABLE DATABASES ---');
            searchData.results?.forEach((db: any) => {
                const title = db.title?.[0]?.plain_text || 'Untitled';
                console.log(`ID: ${db.id} | Title: ${title}`);
            });
            console.log('---------------------------');
            console.log('Please verify NOTION_DATA_SOURCE_ID in .env.local matches one of the above.');
        }
        throw new Error(`Notion API Error: ${r.status} ${r.statusText} - ${await r.text()}`);
    }

    const allPages = await r.json() as any;

    console.log(`📦 Found ${allPages.results.length} pages in Notion.`);

    // 2. Process each page
    for (const page of allPages.results) {
      if (!('properties' in page)) continue;
      
      const props = page.properties as any;
      // DEBUG: Log property keys to find the correct "Album" field name
      if (allPages.results.indexOf(page) === 0) {
          console.log('🔍 First Page Keys:', Object.keys(props));
      }
      const pageId = page.id;
      
      // Extract Properties
      const title = props.Name?.title?.[0]?.plain_text || props.Title?.title?.[0]?.plain_text || 'Untitled';
      
      // Album/Category (Critical for mapping)
      // Found keys: ['Link', 'Type', 'Tags', 'Description', 'Image', 'Date', 'Name']
      const album = props.Type?.select?.name || props.Album?.select?.name || props.Category?.select?.name;
      
      if (!album || !ALBUM_TABLE_MAP[album.toUpperCase()]) {
        console.warn(`⚠️  Skipping "${title}" (${pageId}): Unknown Album/Category "${album}"`);
        continue;
      }
      
      const tableName = ALBUM_TABLE_MAP[album.toUpperCase()];

      // Date
      const date = props.Date?.date?.start || new Date().toISOString().split('T')[0];
      
      // Tags
      const tags = props.Tags?.multi_select?.map((t: any) => t.name) || [];
      
      // Description
      const description = props.Description?.rich_text?.[0]?.plain_text || '';
      
      // Link
      const link = props.Link?.url || null;
      
      // Cover Image - Priority: 1) Image property (external URL), 2) Page Cover
      // NOTE: Notion internal file URLs are SIGNED and EXPIRE after ~1 hour!
      // External URLs (from Image property or external cover) don't expire.
      let imageUrl = null;
      
      // First, try the Image property from the database (preferred for external URLs)
      const imageProperty = props.Image?.files?.[0];
      if (imageProperty) {
        if (imageProperty.type === 'external') {
          imageUrl = imageProperty.external?.url;
        } else if (imageProperty.type === 'file') {
          // Internal file - will expire, but use as fallback
          imageUrl = imageProperty.file?.url;
          console.warn(`⚠️  "${title}" uses Notion-hosted image (will expire)`);
        }
      }
      
      // Fallback to page cover if no Image property
      if (!imageUrl && page.cover) {
        if (page.cover.type === 'external') {
          imageUrl = page.cover.external.url; // External = permanent
        } else if (page.cover.type === 'file') {
          imageUrl = page.cover.file.url; // Signed = temporary
          console.warn(`⚠️  "${title}" uses Notion-hosted cover (will expire)`);
        }
      }

      // Content (Markdown)
      const mdBlocks = await n2m.pageToMarkdown(pageId);
      const mdString = n2m.toMarkdownString(mdBlocks);
      
      // Transform video file links to expected format
      // Notion exports: [filename.mp4](url) 
      // Frontend expects: ![VIDEO](url)
      let processedContent = mdString.parent || '';
      processedContent = processedContent.replace(
        /\[([^\]]+\.(mp4|mov|webm))\]\(([^)]+)\)/gi,
        (_, filename, ext, url) => `![VIDEO](${url})`
      );
      
      const record = {
        id: pageId, 
        title,
        date,
        tags,
        description,
        link,
        imageUrl, 
        content: processedContent,
        albumId: album.toUpperCase()
      };
      
      const finalPayload = {
         id: record.id,
         title: record.title,
         date: record.date,
         description: record.description,
         tags: record.tags,
         link: record.link,
         image_url: record.imageUrl, // Force snake_case based on error
         content: record.content,
       };

      // 3. Upsert to Supabase
      const { error } = await supabase
        .from(tableName)
        .upsert(finalPayload, { onConflict: 'id' });

      if (error) {
          console.error(`❌ Failed to sync "${title}" to ${tableName}:`, error.message);
      } else {
        console.log(`✅ Synced: ${title} -> ${tableName}`);
      }
    }
    
    console.log('🎉 Sync Complete!');
    
  } catch (error) {
    console.error('🔥 Sync crashed:', error);
    process.exit(1);
  }
}

sync();
