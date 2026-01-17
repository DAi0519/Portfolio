
import { Album, AlbumType } from './types';

// Refined Palette
const COLORS = {
  KLEIN_BLUE: "#002FA7",
  FILM_ORANGE: "#F05A28", // Vibrant Kodak/Film Orange
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
    backgroundColor: "#EFF0F1", // Cool Grey Paper
    textColor: COLORS.INK_CHARCOAL,
    // Solid Pure White
    coverImage: "/covers/cover-intro.png",
    introContent: `
### HELLO, WORLD.

我是一名游走在 **设计与代码** 边界的创造者。
我相信最好的数字产品不仅好用，更要动人。

---

### TECH STACK

- **Frontend:** React, TypeScript, Next.js, Framer Motion
- **Creative:** Three.js, WebGL, Shader Programming
- **Design:** Figma, Blender, Adobe Suite

---

### PHILOSOPHY

**"Less but Better"**
这是 Dieter Rams 的设计十诫中我最以此为然的一条。
在信息过载的时代，我致力于通过做减法来还原事物的本质。
我的代码追求语义化的清晰，我的设计追求功能的纯粹。

### CONTACT

如果你对我的项目感兴趣，或者想聊聊设计与技术：
hello@dai.design / @daidesign
    `,
    tracks: [],
    musicFile: "/musics/1.wav"
  },
  {
    id: AlbumType.CODING,
    title: "SIDE PROJECTS",
    subtitle: "机杼万端，唯约束成章",
    color: COLORS.KLEIN_BLUE,
    backgroundColor: "#F0F4FC", // Very Pale Blue Tint
    textColor: "#0A1629", // Deep Blue-Black
    // Solid International Klein Blue
    coverImage: "/covers/cover-coding.png", 
    tracks: [
      {
        id: "coding-01",
        title: "Gemini 界面重构",
        description: "A comprehensive redesign of the Gemini chat interface, focusing on information hierarchy and fluid motion.",
        date: "2024",
        tags: ["React", "Motion", "UX"],
        imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
        link: "https://gemini.google.com" // Mock link
      },
      {
        id: "coding-02",
        title: "音频可视化引擎",
        description: "Real-time WebGL audio visualization system reacting to frequency analysis data.",
        date: "2023",
        tags: ["WebGL", "Three.js", "Audio API"],
        imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop",
        link: "https://threejs.org" // Mock link
      },
       {
        id: "coding-03",
        title: "Design System",
        description: "A unified design token system for enterprise applications, ensuring consistency across 50+ projects.",
        date: "2023",
        tags: ["System", "Tokens", "Figma"],
        imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=2564&auto=format&fit=crop"
      }
    ],
    musicFile: "/musics/2.wav"
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
    musicFile: "/musics/3.wav"
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
    musicFile: "/musics/4.wav"
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
    musicFile: "/musics/5.wav"
  }
];
