export enum AlbumType {
  WRITING = 'WRITING',
  CODING = 'CODING',
  VIDEO = 'VIDEO',
  PHOTO = 'PHOTO',
  INTRO = 'INTRO'
}

export interface ProjectItem {
  id: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  link?: string;
  imageUrl?: string;
  videoUrl?: string;
  content?: string;
}

export interface Album {
  id: AlbumType;
  title: string;
  subtitle: string;
  color: string; // Hex code for accent
  backgroundColor: string; // Hex for full-screen background
  textColor: string; // Hex for UI text (Header/Footer)
  coverImage: string;
  introContent?: string; // Optional full-text content for INTRO albums
  tracks: ProjectItem[];
}