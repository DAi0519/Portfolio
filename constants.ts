import { Album, AlbumType } from './types';

export const ALBUMS: Album[] = [
  {
    id: AlbumType.WRITING,
    title: "Think Piece_01",
    subtitle: "Essays & Articles",
    color: "#ea580c", // Orange (Rams accent)
    coverImage: "https://picsum.photos/id/24/800/800",
    tracks: [
      {
        id: "w1",
        title: "The Philosophy of Less",
        date: "2023-11-15",
        description: "Exploring minimalism in digital interface design and why it matters more than ever.",
        tags: ["Design", "Philosophy"]
      },
      {
        id: "w2",
        title: "Systemic Thinking",
        date: "2023-09-02",
        description: "How to approach complex problems by breaking them down into atomic components.",
        tags: ["Systems", "Logic"]
      },
      {
        id: "w3",
        title: "Digital Garden",
        date: "2023-05-20",
        description: "Why I stopped blogging and started gardening my notes.",
        tags: ["Personal", "Growth"]
      }
    ]
  },
  {
    id: AlbumType.CODING,
    title: "Vibe.Code",
    subtitle: "Development Projects",
    color: "#4f46e5", // Indigo
    coverImage: "https://picsum.photos/id/119/800/800",
    tracks: [
      {
        id: "c1",
        title: "Gemini Interface",
        date: "2024-02-10",
        description: "A React-based chat interface utilizing the latest Gemini 1.5 Pro multimodal capabilities.",
        tags: ["React", "AI", "TypeScript"],
        imageUrl: "https://picsum.photos/id/0/600/400"
      },
      {
        id: "c2",
        title: "Audio Visualizer",
        date: "2024-01-05",
        description: "Real-time canvas rendering of audio frequency data using Web Audio API.",
        tags: ["Canvas", "Audio", "Web API"],
        imageUrl: "https://picsum.photos/id/1/600/400"
      },
      {
        id: "c3",
        title: "Flow State Timer",
        date: "2023-12-12",
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
    color: "#dc2626", // Red
    coverImage: "https://picsum.photos/id/48/800/800",
    tracks: [
      {
        id: "v1",
        title: "City Rhythm",
        date: "2023-10-30",
        description: "A short film capturing the heartbeat of Tokyo at night.",
        tags: ["Direction", "Editing"],
        imageUrl: "https://picsum.photos/id/49/600/400"
      },
      {
        id: "v2",
        title: "Product Launch",
        date: "2023-08-15",
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
    color: "#059669", // Emerald
    coverImage: "https://picsum.photos/id/60/800/800",
    tracks: [
      {
        id: "p1",
        title: "Architecture Study",
        date: "2023-07-20",
        description: "Brutalist structures in Eastern Europe.",
        tags: ["B&W", "Architecture"],
        imageUrl: "https://picsum.photos/id/61/600/400"
      },
      {
        id: "p2",
        title: "Portraits in Rain",
        date: "2023-04-10",
        description: "A study of light and texture during monsoon season.",
        tags: ["Portrait", "Nature"],
        imageUrl: "https://picsum.photos/id/62/600/400"
      },
      {
        id: "p3",
        title: "Abstract Macros",
        date: "2023-02-01",
        description: "Looking closely at everyday objects.",
        tags: ["Macro", "Abstract"],
        imageUrl: "https://picsum.photos/id/63/600/400"
      }
    ]
  }
];