
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
    subtitle: "个人介绍",
    color: COLORS.PURE_WHITE,
    // Solid Pure White
    coverImage: solidColor(COLORS.PURE_WHITE),
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
    tracks: []
  },
  {
    id: AlbumType.WRITING,
    title: "Think Piece_01",
    subtitle: "随笔与文章",
    color: COLORS.INK_CHARCOAL,
    // Solid Matte Charcoal
    coverImage: solidColor(COLORS.INK_CHARCOAL), 
    tracks: [
      {
        id: "w1",
        title: "少即是多的哲学",
        date: "2023.11",
        description: "探索数字界面设计中的极简主义，以及它为何比以往任何时候都重要。",
        tags: ["设计", "哲学"]
      },
      {
        id: "w2",
        title: "系统化思维",
        date: "2023.09",
        description: "如何通过将复杂问题分解为原子组件来解决它们。",
        tags: ["系统", "逻辑"]
      },
      {
        id: "w3",
        title: "数字花园",
        date: "2023.05",
        description: "为什么我不再写博客，而是开始耕耘我的笔记。",
        tags: ["个人", "成长"]
      }
    ]
  },
  {
    id: AlbumType.CODING,
    title: "Vibe.Code",
    subtitle: "开发项目",
    color: COLORS.KLEIN_BLUE,
    // Solid International Klein Blue
    coverImage: solidColor(COLORS.KLEIN_BLUE), 
    tracks: [
      {
        id: "c1",
        title: "Gemini 界面",
        date: "2024.02",
        description: "基于 React 的聊天界面，利用了最新的 Gemini 1.5 Pro 多模态能力。",
        tags: ["React", "AI", "TypeScript"],
        imageUrl: "https://picsum.photos/id/0/600/400"
      },
      {
        id: "c2",
        title: "音频可视化",
        date: "2024.01",
        description: "使用 Web Audio API 进行音频频率数据的实时 Canvas 渲染。",
        tags: ["Canvas", "音频", "Web API"],
        imageUrl: "https://picsum.photos/id/1/600/400"
      },
      {
        id: "c3",
        title: "心流计时器",
        date: "2023.12",
        description: "专为深度工作设计的番茄钟，集成了环境音效。",
        tags: ["生产力", "工具"],
        imageUrl: "https://picsum.photos/id/3/600/400"
      }
    ]
  },
  {
    id: AlbumType.VIDEO,
    title: "Cinematics",
    subtitle: "动态与影像",
    color: COLORS.FILM_ORANGE,
    // Solid Safety Orange
    coverImage: solidColor(COLORS.FILM_ORANGE), 
    tracks: [
      {
        id: "v1",
        title: "城市节奏",
        date: "2023.10",
        description: "一部捕捉东京夜景心搏的短片。",
        tags: ["导演", "剪辑"],
        imageUrl: "https://picsum.photos/id/49/600/400"
      },
      {
        id: "v2",
        title: "产品发布",
        date: "2023.08",
        description: "本地极简家具品牌的商业广告。",
        tags: ["商业", "调色"],
        imageUrl: "https://picsum.photos/id/50/600/400"
      }
    ]
  },
  {
    id: AlbumType.PHOTO,
    title: "Exposures",
    subtitle: "摄影画廊",
    color: COLORS.DEVELOPING_CYAN,
    // Solid Cyan
    coverImage: solidColor(COLORS.DEVELOPING_CYAN), 
    tracks: [
      {
        id: "p1",
        title: "建筑研究",
        date: "2023.07",
        description: "东欧的野兽派建筑结构。",
        tags: ["黑白", "建筑"],
        imageUrl: "https://picsum.photos/id/61/600/400"
      },
      {
        id: "p2",
        title: "雨中人像",
        date: "2023.04",
        description: "季风季节光线与纹理的研究。",
        tags: ["人像", "自然"],
        imageUrl: "https://picsum.photos/id/62/600/400"
      },
      {
        id: "p3",
        title: "微距抽象",
        date: "2023.02",
        description: "近距离观察日常物品。",
        tags: ["微距", "抽象"],
        imageUrl: "https://picsum.photos/id/63/600/400"
      }
    ]
  }
];
