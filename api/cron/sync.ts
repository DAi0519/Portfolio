import { runNotionSync } from '../../lib/notion-sync';

export const config = {
  maxDuration: 300,
};

export default async function handler(request: any, response: any) {
  const authHeader = request.headers?.authorization;

  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return response.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    const result = await runNotionSync();
    return response.status(200).json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Cron sync failed:', error);
    return response.status(500).json({ ok: false, error: message });
  }
}
