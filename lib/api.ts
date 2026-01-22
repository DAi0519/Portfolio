import { Album, ProjectItem, AlbumType } from '../types';
import { ALBUMS } from '../constants';
import projectsData from '../data/projects.json';

// Type for the JSON data structure
interface ProjectsData {
  syncedAt: string;
  projects: Record<string, RawProjectItem[]>;
}

interface RawProjectItem {
  id: string;
  albumId: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  imageUrl: string | null;
  link: string | null;
  content: string | null;
}

/**
 * Fetch a single album by ID, including its projects (tracks).
 * Now reads from local JSON instead of Supabase.
 */
export const getAlbumWithProjects = async (albumId: string): Promise<Album | null> => {
  // Find the album from constants (contains metadata like colors, title, etc.)
  const albumMeta = ALBUMS.find(a => a.id === albumId);
  if (!albumMeta) {
    console.warn(`Album with id ${albumId} not found in constants.`);
    return null;
  }

  // Get projects from local JSON
  const data = projectsData as ProjectsData;
  const rawProjects = data.projects[albumId] || [];

  const tracks: ProjectItem[] = rawProjects.map((p: RawProjectItem) => ({
    id: p.id,
    title: p.title,
    date: p.date,
    description: p.description,
    tags: p.tags,
    link: p.link || undefined,
    imageUrl: p.imageUrl || undefined,
    content: p.content || undefined,
  }));

  return {
    ...albumMeta,
    tracks
  };
};

/**
 * Fetch all albums. 
 * Now simply returns the constants with empty tracks (for list view).
 */
export const getAllAlbums = async (): Promise<Album[]> => {
  return ALBUMS.map(album => ({
    ...album,
    tracks: [] // Empty tracks for list view
  }));
};

/**
 * Get the last sync time from the local data.
 */
export const getLastSyncTime = (): string | null => {
  const data = projectsData as ProjectsData;
  return data.syncedAt || null;
};
