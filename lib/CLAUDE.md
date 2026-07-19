# lib/
> L2 | 父级: ../CLAUDE.md

成员清单

api.ts: 前端内容查询层，从 Supabase 读取唱片及项目并规范化外部链接
initial-data.ts: 本地初始项目数据，为各唱片类型提供开发期占位内容
notion-sync-runtime.ts: 统一内容同步器，以原生 fetch 读取 Notion、渲染 Markdown 并写入 Supabase
notion-sync.ts: 本地同步器，基于 Notion SDK 与 Supabase SDK 执行内容同步
supabase.ts: 浏览器端 Supabase 客户端，读取 Vite 环境变量并导出单例

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
