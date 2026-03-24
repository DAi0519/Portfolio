<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DAI.DESIGN — Vinyl Portfolio

> *"Without music, life would be a mistake."*

一个以黑胶唱片为灵感的沉浸式个人作品集。内容被组织成不同的"唱片专辑"，每张专辑代表一个创作维度：代码、影像、摄影、文字。

---

## 专辑结构

| 专辑 | 主题色 | 内容领域 |
|------|--------|----------|
| **WHO AM I** | Pure White `#FFFFFF` | 自我介绍 |
| **Vibe.Code** | Klein Blue `#002FA7` | 编程与开发 |
| **Cinematics** | Kodak Orange `#F05A28` | 影像与视频 |
| **Exposures** | Chemical Cyan `#00C2CB` | 摄影 |
| **Think Piece** | Matte Charcoal `#1A1A1A` | 文章与思考 |

---

## 技术栈

- **框架:** React 18 + TypeScript
- **构建:** Vite 6
- **样式:** Tailwind CSS 4
- **动效:** Framer Motion
- **数据源:** Notion API + Supabase
- **部署:** Vercel

---

## 本地运行

**前置条件:** Node.js

```bash
# 安装依赖
npm install

# 配置环境变量（复制 .env.local.example 并填写）
cp .env.local.example .env.local

# 启动开发服务器
npm run dev
```

---

## 环境变量

在项目根目录创建 `.env.local` 文件并配置以下变量：

```env
VITE_SUPABASE_URL=       # Supabase 项目 URL
VITE_SUPABASE_ANON_KEY=  # Supabase 匿名密钥
```

> [!NOTE]
> 缺少 Supabase 配置时，应用将以**静态模式**运行，展示本地数据。

---

## Notion 内容同步

项目支持从 Notion 数据库同步内容：

```bash
# 单次同步
npm run sync

# 监听变化并自动同步
npm run sync:watch
```

---

## 部署 (Vercel)

1. **Framework Preset:** Vite
2. **环境变量:** 在 Vercel 项目设置中添加上述变量

---

## 设计理念

**"Object Permanence meets Editorial Rigor"**

将黑胶唱片的物理质感（重量感、惯性、光照）与高端杂志的严格网格排版（Monocle、Kinfolk 风格）结合。

- 内容字体（ChillDuanHeiSong）传递温度与故事
- 系统字体（Helvetica Neue）提供精准与功能
- 所有间距遵循 4px 网格
- 动效模拟机械阻力，而非简单的淡入淡出
