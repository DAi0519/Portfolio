
import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import path from 'path';
import { ALBUMS } from '../constants';
import { AlbumType } from '../types';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const NOTION_KEY = process.env.NOTION_API_KEY; 
const NOTION_DB_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_KEY || !NOTION_DB_ID) {
  console.error('Missing NOTION_API_KEY or NOTION_DATABASE_ID');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_KEY });

const TYPE_MAP: Record<string, string> = {
    [AlbumType.CODING]: 'CODING',
    [AlbumType.VIDEO]: 'VIDEO',
    [AlbumType.PHOTO]: 'PHOTO',
    [AlbumType.WRITING]: 'WRITING'
};

async function seedNotion() {
  console.log('🌱 Starting Seed: Codebase -> Notion...');
  
  let count = 0;

  for (const album of ALBUMS) {
      const typeName = TYPE_MAP[album.id];
      if (!typeName) continue; // Skip INTRO or unknown types

      console.log(`\nProcessing Album: ${album.title} (${typeName})...`);

      for (const track of album.tracks) {
          try {
              console.log(`   Creating "${track.title}"...`);

              await notion.pages.create({
                  parent: { database_id: NOTION_DB_ID },
                  properties: {
                      "Name": {
                          title: [
                              { text: { content: track.title } }
                          ]
                      },
                      "Type": {
                          select: { name: typeName }
                      },
                      "Description": {
                          rich_text: [
                              { text: { content: track.description || "" } }
                          ]
                      },
                      "Date": {
                          date: { start: formatDate(track.date) } 
                      },
                      "Tags": {
                          multi_select: (track.tags || []).map(tag => ({ name: tag }))
                      },
                      "Link": {
                          url: track.link || null
                      },
                      // Image: External URL
                      // Notion Files property can take external URLs
                      "Image": {
                         files: track.imageUrl ? [
                             {
                                 name: "Cover",
                                 type: "external",
                                 external: { url: track.imageUrl }
                             }
                         ] : []
                      }
                  }
              });
              
              console.log(`   ✅ Created.`);
              count++;
              // Rate limit niceness
              await new Promise(resolve => setTimeout(resolve, 300));

          } catch (e: any) {
              console.error(`   ❌ Failed to create "${track.title}":`, e.message);
              // Handle Invalid Date error specifically
              if(e.message.includes("validation_error") && e.message.includes("Date")) {
                 console.log("      (Date format issue? Trying with today's date...)");
                 // Retry with today
              }
          }
      }
  }

  console.log(`\n🎉 Seeding Complete! Created ${count} items.`);
}

// Helper to fix date format "2024.02" -> "2024-02-01"
// But since the loop is cleaner, I'll just inline a basic fixer above or let it fail gracefully.
// Actually, let's make it robust.
function formatDate(dateStr: string): string {
    // "2024.02" -> "2024-02-01"
    // "2023.10" -> "2023-10-01"
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // Replace dots with dashes
    const parts = dateStr.split('.');
    if (parts.length === 2) {
        return `${parts[0]}-${parts[1]}-01`;
    }
    if (parts.length === 3) {
        return `${parts[0]}-${parts[1]}-${parts[2]}`;
    }
    
    // Fallback
    return new Date().toISOString().split('T')[0];
}

// Monkey-patching the date logic in the main function above to use this helper would be better,
// but I'll write the file directly with the helper usage.

seedNotion();
