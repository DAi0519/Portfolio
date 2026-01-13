
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
    tracks: []
  },
  {
    id: AlbumType.CODING,
    title: "Vibe.Code",
    subtitle: "开发项目",
    color: COLORS.KLEIN_BLUE,
    backgroundColor: "#F0F4FC", // Very Pale Blue Tint
    textColor: "#0A1629", // Deep Blue-Black
    // Solid International Klein Blue
    coverImage: "/covers/cover-coding.png", 
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
    backgroundColor: "#FAF2EF", // Warm Paper
    textColor: "#2B140E", // Warm Black
    // Solid Safety Orange
    coverImage: "/covers/cover-video.png", 
    tracks: [
      {
        id: "v1",
        title: "城市节奏",
        date: "2023.10",
        description: "16:9 • 一部捕捉东京夜景心搏的短片。",
        tags: ["导演", "剪辑"],
        imageUrl: "https://picsum.photos/800/450" // 16:9 Aspect Ratio
      },
      {
        id: "v2",
        title: "产品发布",
        date: "2023.08",
        description: "21:9 Video • 本地极简家具品牌的商业广告。",
        tags: ["商业", "调色"],
        imageUrl: "https://picsum.photos/1050/450" // 21:9 Aspect Ratio (Wide)
      },
      {
        id: "v3",
        title: "竖屏叙事",
        date: "2023.06",
        description: "9:16 Short • 专为移动端设计的短视频叙事实验。",
        tags: ["短视频", "实验"],
        imageUrl: "https://picsum.photos/450/800" // 9:16 Aspect Ratio (Vertical)
      },
      {
        id: "v4",
        title: "复古记录",
        date: "2023.05",
        description: "4:3 Classic • 使用 16mm 胶片风格拍摄的记录片。",
        tags: ["胶片", "复古"],
        imageUrl: "https://picsum.photos/800/600" // 4:3 Aspect Ratio
      },
      {
        id: "v5",
        title: "正方形构图",
        date: "2023.01",
        description: "1:1 Square • 艺术影像实验。",
        tags: ["实验", "构图"],
        imageUrl: "https://picsum.photos/600/600" // 1:1 Aspect Ratio (Square)
      }
    ]
  },
  {
    id: AlbumType.PHOTO,
    title: "Exposures",
    subtitle: "摄影画廊",
    color: COLORS.DEVELOPING_CYAN,
    backgroundColor: "#F0F7F7", // Pale Cyan Tint
    textColor: "#0E2424", // Deep Green-Black
    // Solid Cyan
    coverImage: "/covers/cover-photo.png", 
    tracks: [
      {
        id: "p1",
        title: "建筑研究",
        date: "2023.07",
        description: "4:5 Portrait • 东欧的野兽派建筑结构。",
        tags: ["黑白", "建筑"],
        imageUrl: "https://picsum.photos/800/1000" // 4:5
      },
      {
        id: "p2",
        title: "雨中人像",
        date: "2023.04",
        description: "2:3 Portrait • 季风季节光线与纹理的研究。",
        tags: ["人像", "自然"],
        imageUrl: "https://picsum.photos/600/900" // 2:3
      },
      {
        id: "p3",
        title: "微距抽象",
        date: "2023.02",
        description: "3:2 Landscape • 近距离观察日常物品。",
        tags: ["微距", "抽象"],
        imageUrl: "https://picsum.photos/900/600" // 3:2
      },
      {
        id: "p4",
        title: "极简构图",
        date: "2023.01",
        description: "1:1 Square • 负空间的运用。",
        tags: ["极简"],
        imageUrl: "https://picsum.photos/800/800" // 1:1
      },
      {
        id: "p5",
        title: "街头瞬间",
        date: "2022.12",
        description: "16:9 Landscape • 决定性瞬间。",
        tags: ["街头"],
        imageUrl: "https://picsum.photos/1600/900" // 16:9
      },
      {
        id: "p6",
        title: "光影游戏",
        date: "2022.11",
        description: "9:16 Vertical • 高对比度光影。",
        tags: ["光影"],
        imageUrl: "https://picsum.photos/450/800" // 9:16
      },
      {
        id: "p7",
        title: "工业遗迹",
        date: "2022.10",
        description: "21:9 Panorama • 废弃工厂的记录。",
        tags: ["纪实"],
        imageUrl: "https://picsum.photos/1050/450" // 21:9
      },
      {
        id: "p8",
        title: "城市几何",
        date: "2022.09",
        description: "3:4 Portrait • 线条与形状。",
        tags: ["建筑"],
        imageUrl: "https://picsum.photos/600/800" // 3:4
      },
      {
        id: "p9",
        title: "自然肌理",
        date: "2022.08",
        description: "1:1 Square • 树皮与岩石。",
        tags: ["自然"],
        imageUrl: "https://picsum.photos/700/700" // 1:1
      },
      {
        id: "p10",
        title: "夜间色调",
        date: "2022.07",
        description: "4:3 Landscape • 霓虹灯下的街道。",
        tags: ["夜景"],
        imageUrl: "https://picsum.photos/800/600" // 4:3
      },
      {
        id: "p11",
        title: "人物特写",
        date: "2022.06",
        description: "2:3 Portrait • 情绪表达。",
        tags: ["人像"],
        imageUrl: "https://picsum.photos/500/750" // 2:3
      },
      {
        id: "p12",
        title: "极简主义",
        date: "2022.05",
        description: "16:9 Landscape • 白色的层次。",
        tags: ["极简"],
        imageUrl: "https://picsum.photos/960/540" // 16:9
      }
    ]
  },
  {
    id: AlbumType.WRITING,
    title: "Think Piece_01",
    subtitle: "随笔与文章",
    color: COLORS.INK_CHARCOAL,
    backgroundColor: "#F2F2F2", // Neutral Grey
    textColor: "#111111", // Deep Black
    // Solid Matte Charcoal
    coverImage: "/covers/cover-writing.png", 
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
  }
];
