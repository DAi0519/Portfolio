
import { Album, AlbumType } from './types';

export const Z = {
  BG:        0,
  CONTENT:  10,
  CARDS:    20,
  HEADER:   30,
  IMMERSIVE: 50,
  MODAL:    60,
  ARTICLE:  70,
  NOISE:  9999,
} as const;

// Refined Palette
const COLORS = {
  KLEIN_BLUE: "#002FA7",
  FILM_ORANGE: "#F05A28",
  INK_CHARCOAL: "#1A1A1A", // Deep Matte Black
  DEVELOPING_CYAN: "#00C2CB", // Chemical Cyan
  PURE_WHITE: "#FFFFFF" // Pure White
};

/**
 * Helper to generate a pure solid color SVG as a Data URI.
 * This creates a perfect, lightweight "image" of the exact color.
 */
const solidColor = (hex: string) => {
  const encodedHex = encodeURIComponent(hex);
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='${encodedHex}'/%3E%3C/svg%3E`;
};

export const ALBUMS: Album[] = [
  {
    id: AlbumType.INTRO,
    title: "WHO AM I",
    subtitle: "我在他人的目光与自己的选择之间，雕刻出我",
    color: COLORS.PURE_WHITE,
    backgroundColor: "#F3F3F1", // Root Canvas Token
    textColor: COLORS.INK_CHARCOAL,
    // Solid Pure White
    coverImage: "/covers/cover-intro.png",
    introContent: `
# HELLO, WORLD.
我随机漫步在设计与技术的交界，连接我所知的一切，然后创造。
曾经在景观与建筑的世界里，我学会用秩序、尺度与光去组织体验：哪里该被看见、哪里该被忽略、哪里需要引导。我相信好的体验像光：不喧哗，却让人自然看见该看见的东西。
如今转向数字世界，我发现实质并没有变——只是换成了信息架构、交互节奏与工作流程。
# 近期在做
专注于 AI 视觉领域，把素材变成资产、把灵感变成模板、把不稳定的产出变成可控的流程。
同时做一些关于「内容、工具与体验」的探索：用设计表达观点，用实践验证想法。
# 偏好
"Less but Better"
把每一次表达收敛到必要，把每一个细节做到有理由。
"Form follows function"
形式从目的里长出来，而不仅仅是贴上去。
"Order out of chaos—taste follows"
把混乱规整成秩序，品味由此而生。
# 合作
如果对我的项目感兴趣，或者聊聊：
[daiziyu8@gmail.com](https://mail.google.com/mail/?view=cm&fs=1&to=daiziyu8@gmail.com)
已合作过品牌：
The North Face / Timberland / 李宁 / 安踏

    `,
    tracks: [],
    musicFile: "/musics/1.mp3"
  },
  {
    id: AlbumType.CODING,
    title: "Vibe coding",
    subtitle: "机杼万端，唯约束成章",
    color: COLORS.KLEIN_BLUE,
    backgroundColor: "#F0F4FC", // Very Pale Blue Tint
    textColor: "#0A1629", // Deep Blue-Black
    // Solid International Klein Blue
    coverImage: "/covers/cover-coding.png", 
    tracks: [],
    musicFile: "/musics/2.mp3"
  },
  {
    id: AlbumType.VIDEO,
    title: "MOVING IMAGES",
    subtitle: "江流天地外，山色有无中",
    color: COLORS.FILM_ORANGE,
    backgroundColor: "#FAF2EF", // Warm Paper
    textColor: "#2B140E", // Warm Black
    // Solid Safety Orange
    coverImage: "/covers/cover-video.png", 
    tracks: [],
    musicFile: "/musics/3.mp3"
  },
  {
    id: AlbumType.PHOTO,
    title: "VISUALS",
    subtitle: "浮光跃金，静影沉璧",
    color: COLORS.DEVELOPING_CYAN,
    backgroundColor: "#F0F7F7", // Pale Cyan Tint
    textColor: "#0E2424", // Deep Green-Black
    // Solid Cyan
    coverImage: "/covers/cover-photo.png", 
    tracks: [],
    musicFile: "/musics/4.mp3"
  },
  {
    id: AlbumType.WRITING,
    title: "THINK PIECES",
    subtitle: "我们生活在一个充满奇迹的时代，习以为常却使我们盲目",
    color: COLORS.INK_CHARCOAL,
    backgroundColor: "#F2F2F2", // Neutral Grey
    textColor: "#111111", // Deep Black
    // Solid Matte Charcoal
    coverImage: "/covers/cover-writing.png", 
    tracks: [],
    musicFile: "/musics/5.mp3"
  }
];
