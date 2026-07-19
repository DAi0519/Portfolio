/**
 * [INPUT]: 依赖 lib/notion-sync-runtime 的同步能力，依赖 CRON_SECRET 校验 Vercel Cron 请求
 * [OUTPUT]: 对外提供 Vercel 函数配置与受保护的默认 HTTP handler
 * [POS]: api/cron 的每日同步入口，连接 Vercel 调度与 Notion-Supabase 同步运行时
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { runNotionSyncRuntime } from '../../lib/notion-sync-runtime.js';

export const config = {
  maxDuration: 300,
};

export default async function handler(request: any, response: any) {
  const authHeader = request.headers?.authorization;

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    const result = await runNotionSyncRuntime();
    return response.status(200).json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cron sync failed:', error);
    return response.status(500).json({ ok: false, error: message });
  }
}
