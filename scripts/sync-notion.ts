import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  try {
    const { runNotionSync } = await import('../lib/notion-sync.ts');
    const result = await runNotionSync();
    console.log('📊 Sync summary:', result);
  } catch (error) {
    console.error('🔥 Sync crashed:', error);
    process.exit(1);
  }
}

void main();
