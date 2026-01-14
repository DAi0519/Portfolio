
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const INTERVAL_MS = 60 * 1000; // 60 seconds

async function runSync() {
    console.log(`\n[${new Date().toLocaleTimeString()}] ⏳ Checking Notion for updates...`);
    try {
        const { stdout, stderr } = await execPromise('npx tsx scripts/sync-notion.ts');
        if (stdout) process.stdout.write(stdout);
        if (stderr) process.stderr.write(stderr);
    } catch (error: any) {
        console.error('❌ Sync Failed:', error.message);
    }
}

console.log(`👀 Watching Notion for changes (Interval: ${INTERVAL_MS / 1000}s)...`);
runSync(); // Run immediately
setInterval(runSync, INTERVAL_MS);
