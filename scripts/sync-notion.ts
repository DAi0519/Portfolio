/**
 * [INPUT]: 依赖 dotenv、进程环境变量与 lib/notion-sync-runtime 的统一同步能力
 * [OUTPUT]: 对外提供本地 CLI 与 GitHub Actions 可执行的 Notion 同步进程
 * [POS]: scripts 的内容同步入口，负责环境装载、结果输出与失败退出码
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  try {
    const { runNotionSyncRuntime } = await import('../lib/notion-sync-runtime.js');
    const result = await runNotionSyncRuntime();
    console.log('📊 Sync summary:', result);
  } catch (error) {
    console.error('🔥 Sync crashed:', error);
    process.exit(1);
  }
}

void main();
