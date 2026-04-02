
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

export const ROOT_CANVAS = "#FBFBF9";

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
    title: "自序",
    subtitle: "我在他人的目光与自己的选择之间，雕刻出我",
    color: COLORS.PURE_WHITE,
    backgroundColor: ROOT_CANVAS,
    textColor: COLORS.INK_CHARCOAL,
    // Solid Pure White
    coverImage: "/covers/cover-intro.png",
    tracks: [],
    musicFile: "/musics/1.mp3"
  },
  {
    id: AlbumType.CODING,
    title: "VIBE 造物",
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
    title: "流影",
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
    title: "浮光",
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
    title: "闲言",
    subtitle: "我们生活在一个充满奇迹的时代，\n习以为常却使我们盲目",
    color: COLORS.INK_CHARCOAL,
    backgroundColor: "#F2F2F2", // Neutral Grey
    textColor: "#111111", // Deep Black
    // Solid Matte Charcoal
    coverImage: "/covers/cover-writing.png", 
    tracks: [],
    musicFile: "/musics/5.mp3"
  }
];
