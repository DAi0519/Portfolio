import { AlbumType, ProjectItem } from '../types';

export const INITIAL_TRACKS_BY_ALBUM: Record<string, ProjectItem[]> = {
  [AlbumType.CODING]: [
    {
      id: "coding-01",
      title: "Gemini 界面重构",
      description: "A comprehensive redesign of the Gemini chat interface, focusing on information hierarchy and fluid motion.",
      date: "2024",
      tags: ["React", "Motion", "UX"],
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop",
      link: "https://gemini.google.com"
    },
    {
      id: "coding-02",
      title: "音频可视化引擎",
      description: "Real-time WebGL audio visualization system reacting to frequency analysis data.",
      date: "2023",
      tags: ["WebGL", "Three.js", "Audio API"],
      imageUrl: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2670&auto=format&fit=crop",
      link: "https://threejs.org"
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
  [AlbumType.INTRO]: [],
  [AlbumType.VIDEO]: [],
  [AlbumType.PHOTO]: [],
  [AlbumType.WRITING]: []
};
