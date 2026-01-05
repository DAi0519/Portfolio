
import { Album, AlbumType } from './types';

// Refined Palette
const COLORS = {
  KLEIN_BLUE: "#002FA7",
  FILM_ORANGE: "#F05A28", // Vibrant Kodak/Film Orange
  INK_CHARCOAL: "#1A1A1A", // Deep Matte Black
  DEVELOPING_CYAN: "#00C2CB" // Chemical Cyan
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
    id: AlbumType.WRITING,
    title: "Think Piece_01",
    subtitle: "Essays & Articles",
    color: COLORS.INK_CHARCOAL,
    // Solid Matte Charcoal
    coverImage: solidColor(COLORS.INK_CHARCOAL), 
    tracks: [
      {
        id: "w1",
        title: "The Philosophy of Less",
        date: "2023.11",
        description: "Exploring minimalism in digital interface design and why it matters more than ever.",
        tags: ["Design", "Philosophy"]
      },
      {
        id: "w2",
        title: "Systemic Thinking",
        date: "2023.09",
        description: "How to approach complex problems by breaking them down into atomic components.",
        tags: ["Systems", "Logic"]
      },
      {
        id: "w3",
        title: "Digital Garden",
        date: "2023.05",
        description: "Why I stopped blogging and started gardening my notes.",
        tags: ["Personal", "Growth"]
      }
    ]
  },
  {
    id: AlbumType.CODING,
    title: "Vibe.Code",
    subtitle: "Development Projects",
    color: COLORS.KLEIN_BLUE,
    // Solid International Klein Blue
    coverImage: solidColor(COLORS.KLEIN_BLUE), 
    tracks: [
      {
        id: "c1",
        title: "Gemini Interface",
        date: "2024.02",
        description: "A React-based chat interface utilizing the latest Gemini 1.5 Pro multimodal capabilities.",
        tags: ["React", "AI", "TypeScript"],
        imageUrl: "https://picsum.photos/id/0/600/400"
      },
      {
        id: "c2",
        title: "Audio Visualizer",
        date: "2024.01",
        description: "Real-time canvas rendering of audio frequency data using Web Audio API.",
        tags: ["Canvas", "Audio", "Web API"],
        imageUrl: "https://picsum.photos/id/1/600/400"
      },
      {
        id: "c3",
        title: "Flow State Timer",
        date: "2023.12",
        description: "A Pomodoro timer designed for deep work with ambient sound integration.",
        tags: ["Productivity", "Tool"],
        imageUrl: "https://picsum.photos/id/3/600/400"
      }
    ]
  },
  {
    id: AlbumType.VIDEO,
    title: "Cinematics",
    subtitle: "Motion & Film",
    color: COLORS.FILM_ORANGE,
    // Solid Safety Orange
    coverImage: solidColor(COLORS.FILM_ORANGE), 
    tracks: [
      {
        id: "v1",
        title: "City Rhythm",
        date: "2023.10",
        description: "A short film capturing the heartbeat of Tokyo at night.",
        tags: ["Direction", "Editing"],
        imageUrl: "https://picsum.photos/id/49/600/400"
      },
      {
        id: "v2",
        title: "Product Launch",
        date: "2023.08",
        description: "Commercial spot for a local minimalist furniture brand.",
        tags: ["Commercial", "Color Grade"],
        imageUrl: "https://picsum.photos/id/50/600/400"
      }
    ]
  },
  {
    id: AlbumType.PHOTO,
    title: "Exposures",
    subtitle: "Photography Gallery",
    color: COLORS.DEVELOPING_CYAN,
    // Solid Cyan
    coverImage: solidColor(COLORS.DEVELOPING_CYAN), 
    tracks: [
      {
        id: "p1",
        title: "Architecture Study",
        date: "2023.07",
        description: "Brutalist structures in Eastern Europe.",
        tags: ["B&W", "Architecture"],
        imageUrl: "https://picsum.photos/id/61/600/400"
      },
      {
        id: "p2",
        title: "Portraits in Rain",
        date: "2023.04",
        description: "A study of light and texture during monsoon season.",
        tags: ["Portrait", "Nature"],
        imageUrl: "https://picsum.photos/id/62/600/400"
      },
      {
        id: "p3",
        title: "Abstract Macros",
        date: "2023.02",
        description: "Looking closely at everyday objects.",
        tags: ["Macro", "Abstract"],
        imageUrl: "https://picsum.photos/id/63/600/400"
      }
    ]
  }
];
