
import { createClient } from '@supabase/supabase-js';
import { list, del } from '@vercel/blob';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !BLOB_READ_WRITE_TOKEN) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const TABLES = [
  'projects_coding',
  'projects_video',
  'projects_photo',
  'projects_writing'
];

async function pruneBlobs() {
  console.log('🧹 Starting Vercel Blob Prune...');

  // 1. Gather all Active URLs from Supabase
  const activeUrls = new Set<string>();
  
  for (const table of TABLES) {
      const { data, error } = await supabase.from(table).select('image_url, content');
      if (error) {
          console.error(`Error fetching ${table}:`, error);
          continue;
      }
      
      for (const row of data || []) {
          // Cover Image
          if (row.image_url) activeUrls.add(row.image_url);
          
          // Content (Markdown parsing)
          // Look for: ](https://...blob.vercel-storage.com...)
          const content = row.content || '';
          const urlRegex = /https:\/\/[a-zA-Z0-9.-]+\.public\.blob\.vercel-storage\.com\/[a-zA-Z0-9._/-]+/g;
          const matches = content.match(urlRegex);
          if (matches) {
              matches.forEach(url => activeUrls.add(url));
          }
      }
  }
  
  console.log(`✅ Found ${activeUrls.size} active assets in Database.`);

  // 2. List all Blobs in storage
  let cursor;
  let hasMore = true;
  const orphans: string[] = [];

  while (hasMore) {
      const { blobs, hasMore: more, cursor: nextCursor } = await list({ 
          token: BLOB_READ_WRITE_TOKEN,
          cursor
      });
      
      hasMore = more;
      cursor = nextCursor;

      for (const blob of blobs) {
          // Only check our "notion-assets" folder or similar if we wanted to be strict,
          // but for now we assume this bucket is dedicated to this portfolio.
          // Check if the blob URL is in our active set
          if (!activeUrls.has(blob.url)) {
              console.log(`   👻 Orphan found: ${blob.url}`);
              orphans.push(blob.url);
          }
      }
  }

  // 3. Delete Orphans
  if (orphans.length === 0) {
      console.log('✨ No orphans found. Storage is clean.');
  } else {
      console.log(`🗑️ Deleting ${orphans.length} orphans...`);
      // Vercel Blob del accepts array of URLs
      await del(orphans, { token: BLOB_READ_WRITE_TOKEN });
      console.log('✅ Cleanup complete.');
  }
}

pruneBlobs();
