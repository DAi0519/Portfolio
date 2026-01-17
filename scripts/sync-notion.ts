
import { Client } from '@notionhq/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const NOTION_KEY = process.env.NOTION_API_KEY; // User needs to add this
const DATA_SOURCE_ID = process.env.NOTION_DATA_SOURCE_ID;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!NOTION_KEY || !DATA_SOURCE_ID || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables.');
  console.log('Required: NOTION_API_KEY, NOTION_DATA_SOURCE_ID, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TYPE_TO_TABLE: Record<string, string> = {
  'CODING': 'projects_coding',
  'VIDEO': 'projects_video',
  'PHOTO': 'projects_photo',
  'WRITING': 'projects_writing'
};

// --- Helper: Convert Notion Blocks to Markdown ---
async function fetchPageContent(pageId: string): Promise<string> {
  try {
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
    });
    
    // Convert blocks to markdown string (with async support for tables)
    const markdownParts: string[] = [];
    for (const block of blocks.results) {
        if ((block as any).type === 'table') {
            const tableMarkdown = await tableToMarkdown(block);
            markdownParts.push(tableMarkdown);
        } else {
            markdownParts.push(blockToMarkdown(block));
        }
    }
    return markdownParts.join('\n\n');
  } catch (error) {
    console.error(`Error fetching blocks for ${pageId}`, error);
    return "";
  }
}

// --- Helper: Convert a single Notion block to Markdown ---
function blockToMarkdown(block: any): string {
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
    case 'image':
      const url = block.image.type === 'external' ? block.image.external.url : block.image.file?.url;
      const caption = block.image.caption?.[0]?.plain_text || "Image";
      return `![${caption}](${url})`;
    case 'video':
       // Debugging video block structure
       // console.log('Found Video Block:', JSON.stringify(block.video, null, 2));
       
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
       
       return `![VIDEO](${videoUrl})`;
    case 'divider':
      return `---`;
    // Tables are handled separately in fetchPageContent
    case 'table':
      return `[TABLE_PLACEHOLDER:${block.id}]`; // Will be replaced
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
            
            // Add separator after header row
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

async function syncNotionToSupabase() {
  console.log('🚀 Starting Notion Sync...');
  console.log('Target Data Source ID:', DATA_SOURCE_ID);

  if (!DATA_SOURCE_ID) {
      throw new Error("Missing NOTION_DATA_SOURCE_ID");
  }

  try {
    // Use dataSources.query with the correct Data Source ID
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

    for (const page of response.results) {
      if (!('properties' in page)) continue;
      // Skip archived (deleted) pages
      if ((page as any).archived) continue;
      
      const props = page.properties as any;
      const id = page.id;  

      // Extract Properties
      // CAUTION: This depends heavily on the User's Notion Schema names.
      // Expected: Name (Title), Date (Date/Text), Description (Text), Tags (Multi-select), Type (Select), Image (Files/URL), Link (URL)

      // 1. Type -> Table
      const typeSelect = props.Type?.select?.name?.toUpperCase();
      const targetTable = TYPE_TO_TABLE[typeSelect];
      
      if (!targetTable) {
        console.warn(`⚠️ Item "${id}" has unknown or missing Type: ${typeSelect || 'None'}. Skipping.`);
        continue;
      }

      // 2. Title
      const title = props.Name?.title?.[0]?.plain_text || 'Untitled';

      // 3. Date
      // Date property in Notion is complex. Could be a date object or text.
      // We start assuming it's a Date property, but fallback to text if user made it text.
      let date = props.Date?.date?.start || props.Date?.rich_text?.[0]?.plain_text || new Date().toISOString(); 

      // 4. Description
      const description = props.Description?.rich_text?.[0]?.plain_text || '';

      // 5. Tags
      const tags = props.Tags?.multi_select?.map((t: any) => t.name) || [];

      // 6. Image
      // Could be a File (expiry link) or External URL.
      let imageUrl = null;
      if (props.Image?.files?.length > 0) {
          const fileObj = props.Image.files[0];
          imageUrl = fileObj.file?.url || fileObj.external?.url;
      }

      // 7. Link
      const link = props.Link?.url || null;

      // 8. Fetch Content (Blocks) -> Markdown
      console.log(`   📄 Fetching content for "${title}"...`);
      const markdownContent = await fetchPageContent(id);

      console.log(`✨ Syncing "${title}" to [${targetTable}]...`);

      // Upsert to Supabase
      const { error } = await supabase
        .from(targetTable)
        .upsert({
          id: id, // Use Notion Page ID as primary key to avoid duplicates
          album_id: typeSelect, // Ensure consistency
          title,
          date,
          description,
          tags,
          image_url: imageUrl,
          link,
          content: markdownContent // New Field
        });

      if (error) {
        console.error(`❌ Failed to sync "${title}":`, error);
      } else {
        console.log(`✅ Synced "${title}"`);
      }
    }

    console.log('🎉 Upsert Complete!');

    // --- DELETION LOGIC (Pruning) ---
    console.log('🧹 Starting Prune (Deleting items removed from Notion)...');
    
    // 1. Get List of all Active IDs from Notion
    // Only include non-archived pages. Archived pages will be missing from this set, triggering deletion.
    const activeIds = new Set(response.results.filter((page: any) => !page.archived).map((page: any) => page.id));
    
    // 2. Check each table for orphans
    const tables = Object.values(TYPE_TO_TABLE);
    
    for (const table of tables) {
        // Fetch all IDs currently in this Supabase table
        const { data: currentRows, error } = await supabase
            .from(table)
            .select('id');
        
        if (error) {
            console.error(`Error fetching IDs from ${table}:`, error);
            continue;
        }

        const idsToDelete: string[] = [];
        for (const row of currentRows || []) {
            if (!activeIds.has(row.id)) {
                idsToDelete.push(row.id);
            }
        }

        if (idsToDelete.length > 0) {
            console.log(`   🗑️ Deleting ${idsToDelete.length} orphans from [${table}]...`);
            const { error: deleteError } = await supabase
                .from(table)
                .delete()
                .in('id', idsToDelete);
            
            if (deleteError) {
                 console.error(`   ❌ Failed to delete from ${table}:`, deleteError);
            } else {
                 console.log(`   ✅ Deleted: ${idsToDelete.join(', ')}`);
            }
        } else {
            // console.log(`   ✨ No orphans in ${table}.`);
        }
    }
    
    console.log('🏁 Sync & Prune Finished!');

  } catch (error) {
    console.error('🔥 Fatal Error:', error);
    process.exit(1);
  }
}

syncNotionToSupabase();
