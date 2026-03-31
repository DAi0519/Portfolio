
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

console.log('🔍 Checking Environment Variables...');
const vars = {
  NOTION_API_KEY,
  NOTION_DATA_SOURCE_ID: NOTION_DB_ID,
  VITE_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_KEY
};

let missing = false;
for (const [key, value] of Object.entries(vars)) {
  if (!value) {
    console.error(`❌ Missing Environment Variable: ${key}`);
    missing = true;
  } else {
    console.log(`✅ ${key}: Present (Length: ${value.length})`);
  }
}

if (missing) {
  console.error('❌ One or more required environment variables are missing.');
  console.error('   If running locally, check .env.local');
  console.error('   If running in GitHub Actions, check Repository Secrets');
  process.exit(1);
}

// Initialize Clients
const notion = new Client({ auth: NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

(n2m as any).annotatePlainText = preserveNotionInlineStyles;

const preserveToggleBlocks = (blocks: any[]): any[] => {
  return blocks.map((block) => {
    if (block.children?.length) {
      block.children = preserveToggleBlocks(block.children);
    }

    // notion-to-md drops toggle blocks that have no children when converting to string.
    // Convert them into explicit details markup so they survive the markdown pipeline.
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
    const activeDetails = new Set<string>(); // IDs of pages processed in this run

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
      
      // Skip if invalid album, BUT DO NOT add to activeDetails (so it effectively gets treated as deleted from Supabase side if it exists there)
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
      
      // Cover Image
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

      // Content (Markdown)
      const mdBlocks = preserveToggleBlocks(await n2m.pageToMarkdown(pageId));
      const mdString = n2m.toMarkdownString(mdBlocks);
      
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
         image_url: record.imageUrl,
         content: record.content,
       };

      // 3. Upsert to Supabase
      // Mark as active BEFORE upsert
      activeDetails.add(pageId); 

      const { error } = await supabase
        .from(tableName)
        .upsert(finalPayload, { onConflict: 'id' });

      if (error) {
          console.error(`❌ Failed to sync "${title}" to ${tableName}:`, error.message);
      } else {
        console.log(`✅ Synced: ${title} -> ${tableName}`);
      }
    }

    // 4. Cleanup Logic (Delete Sync)
    // Only proceed if we actually fetched pages to prevent accidental wipe on API errors
    if (allPages.results.length > 0) {
        console.log('🧹 Starting Cleanup Check...');
        const tableNames = Object.values(ALBUM_TABLE_MAP);
        
        for (const table of tableNames) {
            // Get all IDs from Supabase table
            const { data: remoteData, error: fetchError } = await supabase
                .from(table)
                .select('id');
            
            if (fetchError) {
                console.error(`❌ Could not fetch IDs from ${table} for cleanup:`, fetchError.message);
                continue;
            }

            if (remoteData) {
                const idsToDelete = remoteData
                    .map(r => r.id)
                    .filter(id => !activeDetails.has(id));
                
                if (idsToDelete.length > 0) {
                    console.log(`🗑️  Found ${idsToDelete.length} orphaned records in ${table}. Deleting...`);
                    const { error: deleteError } = await supabase
                        .from(table)
                        .delete()
                        .in('id', idsToDelete);
                    
                    if (deleteError) {
                        console.error(`❌ Failed to delete records from ${table}:`, deleteError.message);
                    } else {
                        console.log(`✅ Deleted ${idsToDelete.length} records from ${table}`);
                    }
                }
            }
        }
    }
    
    console.log('🎉 Sync Complete!');
    
  } catch (error) {
    console.error('🔥 Sync crashed:', error);
    process.exit(1);
  }
}

sync();
