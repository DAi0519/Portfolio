import { Album, ProjectItem, AlbumType } from '../types';
import { ALBUMS } from '../constants';
import { supabase } from './supabase';

// Map AlbumType to Supabase Table Names
const TABLE_MAP: Record<string, string> = {
  [AlbumType.INTRO]: 'projects_intro',
  [AlbumType.CODING]: 'projects_coding',
  [AlbumType.VIDEO]: 'projects_video',
  [AlbumType.PHOTO]: 'projects_photo',
  [AlbumType.WRITING]: 'projects_writing',
};

/**
 * Fetch a single album by ID, including its projects (tracks) from Supabase.
 */
export const getAlbumWithProjects = async (albumId: string): Promise<Album | null> => {
  // 1. Get Static Metadata
  const albumMeta = ALBUMS.find(a => a.id === albumId);
  if (!albumMeta) {
    console.warn(`Album with id ${albumId} not found in constants.`);
    return null;
  }

  // 2. Identify Table
  const tableName = TABLE_MAP[albumId];
  if (!tableName) {
    return albumMeta;
  }

  // 3. Fetch from Supabase
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error(`Error fetching ${albumId} from ${tableName}:`, error);
    // Fallback to empty tracks if DB fails, but return metadata
    return albumMeta;
  }

  // 4. Transform to ProjectItem
  // Note: Supabase columns use snake_case, frontend uses camelCase
  const tracks: ProjectItem[] = (data || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    date: p.date,
    description: p.description || '',
    tags: p.tags || [],
    link: p.link || undefined,
    imageUrl: p.image_url || undefined, // Map snake_case DB column to camelCase
    content: p.content || undefined,
  }));

  if (albumId === AlbumType.INTRO) {
    const introSource = tracks[0];

    return {
      ...albumMeta,
      introContent: introSource?.content || introSource?.description || albumMeta.introContent,
      tracks,
    };
  }

  return {
    ...albumMeta,
    tracks
  };
};

/**
 * Fetch all albums.
 * Currently returns lightweight list (constants only).
 * If we need counts or previews on home screen, we might need to fetch here too.
 */
export const getAllAlbums = async (): Promise<Album[]> => {
  // For now, homepage only needs metadata defined in constants
  return ALBUMS;
};

/**
 * Get the last sync time.
 * Logic: We might query a 'sync_logs' table or just return null as it's less relevant now.
 * Or we can return the latest 'synced_at' from one of the tables if there's a column.
 * For now, returning null to disable that UI or keep it static.
 */
export const getLastSyncTime = (): string | null => {
  return null; 
};
