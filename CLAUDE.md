# DAI.DESIGN - 黑胶唱片概念的沉浸式个人作品集
React 18 + TypeScript 5.8 + Vite 6 + Supabase + Notion + Vercel

<directory>
.github/ - GitHub Actions 自动化 (1子目录: workflows)
api/ - Vercel 服务端接口 (1子目录: cron)
components/ - 页面与交互组件 (1子目录: UI)
data/ - 本地项目数据
hooks/ - React 复用 hooks
lib/ - Supabase 读取与 Notion 同步运行时
public/ - 字体、图片、音乐等静态资产
scripts/ - 内容同步、迁移与媒体处理脚本
supabase/ - 数据库迁移
utils/ - 通用前端工具
</directory>

<config>
package.json - 依赖与 Vite、本地同步命令入口
vite.config.ts - Vite 开发服务器、环境注入与构建分包
vercel.json - Vercel 项目配置，不再承载内容同步调度
tsconfig.json - TypeScript 编译与路径别名
</config>
