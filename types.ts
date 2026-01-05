export enum AlbumType {
  WRITING = 'WRITING',
  CODING = 'CODING',
  VIDEO = 'VIDEO',
  PHOTO = 'PHOTO'
}

export interface ProjectItem {
  id: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  link?: string;
  imageUrl?: string;
}

export interface Album {
  id: AlbumType;
  title: string;
  subtitle: string;
  color: string; // Hex code for accent
  coverImage: string;
  tracks: ProjectItem[];
}