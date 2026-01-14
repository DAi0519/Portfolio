
import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

console.log('Notion Client Keys:', Object.keys(notion));

// Test 1: List Users
try {
  const users = await notion.users.list({});
  console.log('✅ Users List Success:', users.results.length);
} catch (e: any) {
  console.error('❌ Users List Failed:', e.message);
}

// Test 2: Search (should find the database)
try {
    const search = await notion.search({});
    console.log('✅ Search Success. Found items:', search.results.length);
    if (search.results.length > 0) {
        console.log('Sample item:', JSON.stringify(search.results[0], null, 2));
    }
} catch (e: any) {
    console.error('❌ Search Failed:', e.message);
}

