
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { ALBUMS } from '../constants'; // Import the source of truth

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function updateAlbums() {
  console.log('🚀 Starting Albums Update...');

  for (const album of ALBUMS) {
    console.log(`Processing "${album.title}" (${album.id})...`);

    const { error } = await supabase
      .from('albums')
      .upsert({
        id: album.id,
        title: album.title,
        subtitle: album.subtitle,
        color: album.color,
        background_color: album.backgroundColor,
        text_color: album.textColor,
        cover_image: album.coverImage,
        intro_content: album.introContent || null
      });

    if (error) {
      console.error(`❌ Failed to update ${album.id}:`, error);
    } else {
      console.log(`✅ Updated ${album.id}`);
    }
  }

  console.log('🎉 Albums Update Complete!');
}

updateAlbums().catch(e => {
  console.error(e);
  process.exit(1);
});
