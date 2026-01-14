import { supabase } from './supabase';
import { Album, ProjectItem, AlbumType } from '../types';

// Types representing the raw database response (snake_case)
interface DBAlbum {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  background_color: string;
  text_color: string;
  cover_image: string;
  intro_content: string | null;
}

interface DBProject {
  id: string;
  album_id: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  image_url: string | null;
  link: string | null;
}

const ALBUM_TABLE_MAP: Record<string, string> = {
  [AlbumType.CODING]: 'projects_coding',
  [AlbumType.VIDEO]: 'projects_video',
  [AlbumType.PHOTO]: 'projects_photo',
  [AlbumType.WRITING]: 'projects_writing',
};

/**
 * Fetch a single album by ID, including its projects (tracks).
 * Maps database columns to the existing frontend interfaces.
 */
export const getAlbumWithProjects = async (albumId: string): Promise<Album | null> => {
  // 1. Fetch Album Metadata
  const { data: albumData, error: albumError } = await supabase
    .from('albums')
    .select('*')
    .eq('id', albumId)
    .single();

  if (albumError || !albumData) {
    console.warn(`Error fetching album metadata for ${albumId}:`, albumError);
    return null;
  }

  const dbAlbum = albumData as DBAlbum;
  let tracks: ProjectItem[] = [];

  // 2. Fetch Projects from specific table
  const tableName = ALBUM_TABLE_MAP[albumId];
  if (tableName) {
    const { data: projectsData, error: projectsError } = await supabase
      .from(tableName as any) 
      .select('*')
      .order('date', { ascending: false });

    if (projectsError) {
      console.error(`Error fetching projects from ${tableName}:`, projectsError);
    } else {
      tracks = (projectsData || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        date: p.date,
        description: p.description,
        tags: p.tags,
        link: p.link || undefined,
        imageUrl: p.image_url || undefined,
      }));
    }
  }

  // 3. Construct Result
  return {
    id: dbAlbum.id as any,
    title: dbAlbum.title,
    subtitle: dbAlbum.subtitle,
    color: dbAlbum.color,
    backgroundColor: dbAlbum.background_color,
    textColor: dbAlbum.text_color,
    coverImage: dbAlbum.cover_image,
    introContent: dbAlbum.intro_content || undefined,
    tracks: tracks
  };
};

/**
 * Fetch all albums without projects (lightweight).
 */
export const getAllAlbums = async (): Promise<Album[]> => {
  const { data, error } = await supabase
    .from('albums')
    .select('*')
    .order('created_at', { ascending: true }); // Or order by a specific 'order' column if added later

  if (error) {
    console.error('Error fetching albums:', error);
    return [];
  }

  return (data || []).map((dbAlbum: DBAlbum) => ({
    id: dbAlbum.id as any,
    title: dbAlbum.title,
    subtitle: dbAlbum.subtitle,
    color: dbAlbum.color,
    backgroundColor: dbAlbum.background_color,
    textColor: dbAlbum.text_color,
    coverImage: dbAlbum.cover_image,
    introContent: dbAlbum.intro_content || undefined,
    tracks: [] // Empty tracks for list view
  }));
};
