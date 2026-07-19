
/**
 * [INPUT]: 依赖 @supabase/supabase-js 与 Vite 注入的公开 Supabase 环境变量
 * [OUTPUT]: 对外提供浏览器端 supabase 客户端单例
 * [POS]: lib 的数据连接基础设施，被前端内容访问层复用
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
