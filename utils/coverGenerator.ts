import { ProjectItem } from '../types';

// Dieter Rams inspired palette - Muted, Industrial, Clean.
const RAMS_PALETTE = [
  'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)', // Braun White
  'linear-gradient(135deg, #2b2b2b 0%, #1a1a1a 100%)', // Matte Black
  'linear-gradient(135deg, #ff4400 0%, #ff6633 100%)', // Orange Detail
  'linear-gradient(135deg, #888888 0%, #aaaaaa 100%)', // Aluminum
  'linear-gradient(135deg, #003366 0%, #004488 100%)', // Deep Blue
  'linear-gradient(135deg, #005f6b 0%, #008c9e 100%)', // Petrol
];

/**
 * Generates a deterministic fallback style or image URL for a project.
 * Uses a string hash of the ID/Title to ensure consistency (same project = same cover).
 */
export function getFallbackCover(project: ProjectItem): { type: 'color' | 'image', value: string } {
  // Simple hash function
  let hash = 0;
  const str = project.id + project.title;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // 1. Try to find an image in the content first (Smart Fallback)
  // Look for ![alt](url) pattern
  if (project.content) {
      const imageMatch = project.content.match(/!\[.*?\]\((https?:\/\/.*?)\)/);
      if (imageMatch && imageMatch[1]) {
          return { type: 'image', value: imageMatch[1] };
      }
  }

  // 2. Fallback to Rams Palette
  const index = Math.abs(hash) % RAMS_PALETTE.length;
  return { type: 'color', value: RAMS_PALETTE[index] };
}

/**
 * Returns a CSS style object for the component
 */
export function getCoverStyle(project: ProjectItem) {
    const fallback = getFallbackCover(project);
    if (fallback.type === 'color') {
        return { background: fallback.value };
    }
    return { backgroundImage: `url(${fallback.value})`, backgroundSize: 'cover', backgroundPosition: 'center' };
}
