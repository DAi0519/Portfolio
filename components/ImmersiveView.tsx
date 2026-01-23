import React, { useEffect, useState, useRef } from 'react';
import { Album, ProjectItem, AlbumType } from '../types';
import { ArrowLeft, X, ExternalLink, Play } from 'lucide-react';
import RecordVinyl from './RecordVinyl';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { getFallbackCover } from '../utils/coverGenerator';
import { Carousel } from './Carousel';
import { ImageWithLoader } from './UI/ImageWithLoader';

interface ImmersiveViewProps {
  album: Album;
  onClose: () => void;
  isMusicPlaying: boolean;
  onMusicToggle: () => void;
  onVideoPlay: () => void;  // Called when a project video starts
  onVideoEnd: () => void;   // Called when a project video ends/pauses
}

// Update Props Interface
const SimpleMarkdown: React.FC<{ 
    content: string; 
    color: string; 
    albumId: string;
    onImageClick?: (url: string) => void;
}> = ({ content, color, albumId, onImageClick }) => {
  const safeColor = color === '#FFFFFF' ? '#1A1A1A' : color;
  
  // --- Tokenize content into segments (lines, tables, or galleries) ---
  const lines = content.split('\n');
  const segments: { type: 'line' | 'table' | 'gallery'; lines: string[] }[] = [];
  
  let currentTableLines: string[] = [];
  let currentGalleryLines: string[] = [];

  // Helper to flush buffers
  const flushBuffers = () => {
     if (currentTableLines.length > 0) {
         segments.push({ type: 'table', lines: [...currentTableLines] });
         currentTableLines = [];
     }
     if (currentGalleryLines.length > 0) {
         segments.push({ type: 'gallery', lines: [...currentGalleryLines] });
         currentGalleryLines = [];
     }
  };

  lines.forEach(line => {
      const trimmed = line.trim();
      // Logic: Only treat as "Image Gallery Candidate" if it's an image AND NOT the Writing album.
      // Writing album (Album 5) wants standard vertical layout for everything.
      const isWriting = albumId === AlbumType.WRITING; 
      const isImage = !isWriting && /^!\[.*?\]\(.*?\)$/.test(trimmed) && !trimmed.includes('![VIDEO]'); 

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          // It's a table
          if (currentGalleryLines.length > 0) flushBuffers(); // Flush gallery if any
          currentTableLines.push(trimmed);
      } else if (isImage) {
          // It's an image AND we are allowing galleries
          if (currentTableLines.length > 0) flushBuffers(); // Flush table if any
          currentGalleryLines.push(trimmed);
      } else {
          // Normal line (Text, Headers, or Images in WRITING mode)
          flushBuffers(); // Flush any pending block
          segments.push({ type: 'line', lines: [line] });
      }
  });
  flushBuffers(); // Final flush

  // --- Render segment helpers ---

  const renderGallery = (imageLines: string[], key: number) => {
      const images = imageLines.map(line => {
          const match = line.match(/^!\[(.*?)\]\((.*?)\)$/);
          return match ? { alt: match[1], url: match[2] } : null;
      }).filter(Boolean) as { alt: string, url: string }[];

      if (images.length === 0) return null;

      // Smart Grid Logic
      // 1 image -> Full Width (Standard) - Actually should just fall through to standard render if only 1? 
      // User asked for "Group Pictures", implying 2+.
      // But for consistency let's handle 1 here too or return to normal flow.
      // If we handle 1 here, we lose the specific "my-8" styling of the single image render relying on renderLine.
      // Let's use a grid for 2+, and if 1 just render as single block (but our tokenizer grouped it).
      
      const gridCols = images.length === 1 ? 'grid-cols-1' : 
                       images.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                       images.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                       'grid-cols-2 md:grid-cols-2 lg:grid-cols-3'; // 4+

      return (
          <div key={key} className={`grid ${gridCols} gap-4 my-8`}>
              {images.map((img, idx) => (
                  <div key={idx} className="relative group overflow-hidden rounded-sm bg-neutral-100 cursor-zoom-in" onClick={() => onImageClick?.(img.url)}>
                      <ImageWithLoader
                          src={img.url} 
                          alt={img.alt}
                          className="w-full h-full object-cover"
                      />
                  </div>
              ))}
          </div>
      );
  };

  const renderLine = (line: string, i: number) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-4" />;

      // Video Parser: ![VIDEO](url)
      const videoMatch = trimmed.match(/^!\[VIDEO\]\((.*?)\)$/);
      if (videoMatch) {
           return (
              <div key={i} className="w-full my-8">
                <video 
                    src={videoMatch[1]} 
                    controls 
                    playsInline
                    className="w-full rounded-sm shadow-sm bg-black/5"
                />
              </div>
          );
      }

      // Single Image Parser (Fallback if regex in tokenizer missed it or strict single line mode)
      // Note: Our tokenizer catches all ![]() as gallery lines. 
      // If a single image is passed to gallery render, it handles it.
      // But if 'renderLine' is called, it might not be an image anymore effectively.
      // However, we strictly separated them. So this part might be redundant for images but good for safety.
      // UPDATE: In WRITING mode, images fall here.
      const imageMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imageMatch) {
           return (
              <div key={i} className="w-full my-8 cursor-zoom-in" onClick={() => onImageClick?.(imageMatch[2])}>
                <ImageWithLoader
                    src={imageMatch[2]} 
                    alt={imageMatch[1]} 
                    className="w-full h-auto rounded-sm shadow-sm"
                />
              </div>
          );
      }


      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={i} className="text-sm font-bold uppercase tracking-[0.2em] mt-12 mb-6 text-neutral-900 font-sans border-b border-neutral-100 pb-2">
            {trimmed.replace('### ', '')}
          </h3>
        );
      }

      if (trimmed.startsWith('## ')) {
           return (
             <h2 key={i} className="text-xl md:text-2xl font-bold mt-16 mb-8 text-neutral-900 tracking-tight">
               {trimmed.replace('## ', '')}
             </h2>
           );
      }
      
      if (trimmed.startsWith('---')) {
           return <hr key={i} className="my-12 border-neutral-200" />;
      }

      if (trimmed.startsWith('> ')) {
           return (
               <blockquote key={i} className="pl-6 border-l-2 border-neutral-200 my-8 italic text-neutral-500 text-lg">
                   {trimmed.replace('> ', '')}
               </blockquote>
           );
      }

      if (trimmed.startsWith('```')) {
          return null; 
      }

      if (trimmed.startsWith('- ')) {
         const parts = trimmed.replace('- ', '').split('**');
         return (
           <div key={i} className="flex items-baseline gap-3 my-3 pl-2">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 translate-y-[-1px] opacity-60" style={{ backgroundColor: safeColor }} />
              <p className="flex-1 text-neutral-800 leading-relaxed m-0 text-base font-normal">
                 {parts.map((part, idx) => 
                    idx % 2 === 1 ? <strong key={idx} className="font-semibold text-black">{part}</strong> : part
                 )}
              </p>
           </div>
         );
      }

      const parts = trimmed.split('**');
      return (
        <p key={i} className="text-neutral-600 leading-8 mb-6 font-normal text-lg">
           {parts.map((part, idx) => 
              idx % 2 === 1 ? <strong key={idx} className="font-semibold text-neutral-900">{part}</strong> : part
           )}
        </p>
      );
  };

  const renderTable = (tableLines: string[], key: number) => {
      // Filter out separator row (contains only |, -, and spaces)
      const dataRows = tableLines.filter(line => !/^\|[\s\-|]+\|$/.test(line));
      if (dataRows.length === 0) return null;

      const parseRow = (row: string) => 
          row.split('|').slice(1, -1).map(cell => cell.trim());

      const headerCells = parseRow(dataRows[0]);
      const bodyRows = dataRows.slice(1);

      return (
          <div key={key} className="my-8 overflow-x-auto rounded-sm border border-neutral-200">
              <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-neutral-50">
                      <tr>
                          {headerCells.map((cell, i) => (
                              <th key={i} className="px-4 py-3 font-semibold text-neutral-800 border-b border-neutral-200">
                                  {cell}
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody>
                      {bodyRows.map((row, rowIdx) => (
                          <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}>
                              {parseRow(row).map((cell, cellIdx) => (
                                  <td key={cellIdx} className="px-4 py-3 text-neutral-600 border-b border-neutral-100">
                                      {cell}
                                  </td>
                              ))}
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      );
  };

  return (
    <div className="prose prose-neutral max-w-none pl-0 md:pl-0">
      {segments.map((segment, segIdx) => {
          if (segment.type === 'table') {
              return renderTable(segment.lines, segIdx);
          }
          if (segment.type === 'gallery') {
              return renderGallery(segment.lines, segIdx);
          }
          return segment.lines.map((line, lineIdx) => renderLine(line, segIdx * 1000 + lineIdx));
      })}
    </div>
  );
};

const TrackItem: React.FC<{
    track: ProjectItem;
    index: number;
    color: string;
    isHovered: boolean;
    onHover: (id: string | null) => void;
    onClick: () => void;
    delay: number;
}> = ({ track, index, color, isHovered, onHover, onClick, delay }) => {
    const safeColor = color === '#FFFFFF' ? '#1A1A1A' : color;
    return (
        <motion.div 
          onClick={onClick}
          onMouseEnter={() => onHover(track.id)}
          onMouseLeave={() => onHover(null)}
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
              opacity: 1, 
              y: 0,
              x: isHovered ? 6 : 0 // Magnetic pull
          }}
          transition={{ 
            opacity: { delay: delay / 1000, duration: 0.5 },
            y: { delay: delay / 1000, type: "spring", stiffness: 400, damping: 30 },
            x: { type: "spring", stiffness: 400, damping: 25 } // snappy but smooth
          }}
          className="group flex items-stretch w-full cursor-pointer"
        >
            {/* INDEX COLUMN */}
            <div className="w-8 md:w-10 shrink-0 flex items-center justify-start border-b border-transparent">
                <span 
                    className={`
                       text-[10px] font-mono transition-colors duration-300 tabular-nums
                       ${!isHovered ? 'text-neutral-400' : 'font-bold'}
                    `}
                    style={{ color: isHovered ? safeColor : undefined }}
                >
                    {String(index + 1).padStart(2, '0')}
                </span>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex items-center justify-between py-5 border-b border-neutral-200 transition-colors duration-500 group-hover:border-neutral-300">
                <h3 
                    className="text-lg md:text-xl font-bold tracking-tight text-neutral-900 transition-colors pr-8 leading-tight flex-1"
                    style={{ color: isHovered ? safeColor : undefined }}
                >
                     {track.title}
                </h3>
                <span className="hidden md:block text-[10px] font-mono text-neutral-400 group-hover:text-neutral-500 transition-colors uppercase tracking-wider text-right w-[80px] tabular-nums shrink-0">
                    {track.date}
                </span>
            </div>
        </motion.div>
    )
}

const VideoGridItem: React.FC<{
    track: ProjectItem;
    index: number;
    color: string;
    onClick?: () => void;
    delay: number;
    onVideoPlay?: () => void;
    onVideoEnd?: () => void;
}> = ({ track, color, onClick, delay, onVideoPlay, onVideoEnd }) => {
    const safeColor = color === '#FFFFFF' ? '#1A1A1A' : color;
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isLandscape, setIsLandscape] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true); // Default to loading
    
    // Extract video URL if available in content
    const videoMatch = track.content?.match(/!\[VIDEO\]\((.*?)\)/);
    const videoUrl = videoMatch ? videoMatch[1] : null;

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.play();
            setIsPlaying(true);
            onVideoPlay?.(); // Notify parent
        }
    };

    const handleVideoEnd = () => {
        setIsPlaying(false);
        onVideoEnd?.(); // Notify parent
    };

    const handleLoadedMetadata = () => {
        setIsLoading(false); // Video metadata loaded (size known)
        if (videoRef.current) {
            const { videoWidth, videoHeight } = videoRef.current;
            setIsLandscape(videoWidth > videoHeight);
        }
    };

    return (
        <motion.div
            onClick={onClick}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay / 1000, duration: 0.8, type: "spring", bounce: 0.2 }}
            className={`group mb-5 w-full col-span-2 md:col-span-1 ${isLandscape ? 'md:col-span-2' : ''} ${onClick ? 'cursor-pointer' : ''}`} // Mobile: Always full width (col-span-2 in a 1-col grid acts as 1, but safer). Actually, grid is cols-1.
        >
            <div className="relative w-full overflow-hidden rounded-sm bg-neutral-900 mb-3">
                {videoUrl ? (
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="w-full relative"
                    >
                        <video 
                            ref={videoRef}
                            src={videoUrl + (track.imageUrl ? "" : "#t=0.001")} // Only use hack if no poster
                            poster={track.imageUrl || undefined}
                            controls={isPlaying}
                            playsInline
                            webkit-playsinline="true"
                            muted // Required for autoplay/preview on mobile
                            preload="metadata" // Metadata is safer with muted
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={handleVideoEnd}
                            onPause={handleVideoEnd}
                            className={`w-full h-auto object-cover rounded-sm bg-black transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        />
                        
                        {/* Loading Spinner Overlay */}
                        {isLoading && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[2px] gap-3">
                                <div className="w-6 h-6 border-2 border-neutral-400/30 border-t-neutral-400 rounded-full animate-spin"></div>
                            </div>
                        )}

                        {/* Custom Play Overlay */}
                        {!isPlaying && !isLoading && (
                            <div 
                                onClick={handlePlay}
                                className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors cursor-pointer group/play"
                            >
                                {/* Dieter Rams Style: Minimal, Geometric, Functional */}
                                <div className="w-12 h-12 rounded-full border-[1px] border-white/70 bg-black/5 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300 group-hover/play:bg-white group-hover/play:border-white group-hover/play:scale-105">
                                    <Play 
                                        size={16} 
                                        className="ml-0.5 text-white transition-colors duration-300 group-hover/play:text-black" 
                                        fill="currentColor" 
                                        strokeWidth={0} // Solid fill style
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        {(() => {
                            const fallback = track.imageUrl ? { type: 'image', value: track.imageUrl } : getFallbackCover(track);
                            
                            if (fallback.type === 'image') {
                                return (
                                     <ImageWithLoader 
                                        src={fallback.value} 
                                        alt={track.title}
                                        data-hint="true"
                                        containerClassName="w-full h-auto"
                                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                );
                            } else {
                                return (
                                    <div 
                                        className="w-full aspect-video transition-transform duration-700 group-hover:scale-105"
                                        style={{ background: fallback.value }}
                                    />
                                );
                            }
                        })()}
                        
                        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300 group/overlay">
                             <div className="w-12 h-12 rounded-full border-[1px] border-white/70 bg-black/5 backdrop-blur-[2px] flex items-center justify-center transition-all duration-300 group-hover/overlay:bg-white group-hover/overlay:border-white group-hover/overlay:scale-105">
                                 <Play 
                                    size={16} 
                                    className="ml-0.5 text-white transition-colors duration-300 group-hover/overlay:text-black" 
                                    fill="currentColor" 
                                    strokeWidth={0}
                                />
                             </div>
                        </div>
                    </>
                )}
            </div>
            
            <div>
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wide group-hover:text-black transition-colors">
                    {track.title}
                </h3>
                <p className="text-[10px] font-mono text-neutral-400 mt-1 line-clamp-1">
                    {track.description}
                </p>
            </div>
        </motion.div>
    );
};

const PhotoGridItem: React.FC<{
    track: ProjectItem;
    index: number;
    color: string;
    onClick: () => void;
    delay: number;
}> = ({ track, onClick, delay }) => {
    const fallback = track.imageUrl ? { type: 'image', value: track.imageUrl } : getFallbackCover(track);

    return (
        <motion.div
            onClick={onClick}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay / 1000, duration: 0.8, type: "spring", bounce: 0.15 }}
            className="group cursor-pointer relative overflow-hidden rounded-sm bg-neutral-100"
        >
            {fallback.type === 'image' ? (
                <ImageWithLoader 
                    src={fallback.value} 
                    alt={track.title}
                    containerClassName="w-full h-auto"
                    data-hint="true"
                    className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-105"
                />
            ) : (
                <div 
                    className="w-full aspect-square transition-transform duration-1000 group-hover:scale-105"
                    style={{ background: fallback.value }}
                />
            )}
        </motion.div>
    );
};

// MASONRY LAYOUT HELPER
const MasonryLayout: React.FC<{
    tracks: ProjectItem[];
    renderItem: (track: ProjectItem, index: number) => React.ReactNode;
}> = ({ tracks, renderItem }) => {
    const [columns, setColumns] = React.useState(2);

    React.useEffect(() => {
        const updateColumns = () => {
            setColumns(window.innerWidth >= 768 ? 3 : 2);
        };
        
        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    const cols = React.useMemo(() => {
        const buckets = Array.from({ length: columns }, () => [] as { track: ProjectItem, index: number }[]);
        tracks.forEach((track, i) => {
            buckets[i % columns].push({ track, index: i });
        });
        return buckets;
    }, [tracks, columns]);

    return (
        <div className="flex gap-3 items-start pb-20">
            {cols.map((colItems, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-3 flex-1">
                    {colItems.map(({ track, index }) => (
                         <div key={track.id} className="w-full">
                             {renderItem(track, index)}
                         </div>
                    ))}
                </div>
            ))}
        </div>
    );
};


const CodingGridItem: React.FC<{
    track: ProjectItem;
    index: number;
    color: string;
    onClick: () => void; // Kept for consistency, but not used for direct links
    delay: number;
}> = ({ track, color, onClick, delay }) => {
    const safeColor = color === '#FFFFFF' ? '#1A1A1A' : color;

    // Generate screenshot URL from link if no imageUrl provided
    // Uses microlink.io's free screenshot API
    const getPreviewUrl = () => {
        if (track.imageUrl) return track.imageUrl;
        if (track.link) {
            // Microlink screenshot API - free tier
            return `https://api.microlink.io/?url=${encodeURIComponent(track.link)}&screenshot=true&meta=false&embed=screenshot.url`;
        }
        return null;
    };

    const [previewUrl, setPreviewUrl] = React.useState<string | null>(track.imageUrl || null);
    const [loadingPreview, setLoadingPreview] = React.useState(!track.imageUrl && !!track.link);

    React.useEffect(() => {
        // If we have an imageUrl, use it directly
        if (track.imageUrl) {
            setPreviewUrl(track.imageUrl);
            setLoadingPreview(false);
            return;
        }
        
        // If we have a link but no imageUrl, fetch a screenshot
        if (track.link) {
            setLoadingPreview(true);
            fetch(`https://api.microlink.io/?url=${encodeURIComponent(track.link)}&screenshot=true&meta=false&viewport.width=1920&viewport.height=1080&waitForTimeout=3000`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success' && data.data?.screenshot?.url) {
                        setPreviewUrl(data.data.screenshot.url);
                    }
                })
                .catch(() => {
                    // Fail silently, show "No Preview"
                })
                .finally(() => setLoadingPreview(false));
        }
    }, [track.imageUrl, track.link]);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (track.link) {
            window.open(track.link, '_blank', 'noopener,noreferrer');
        } else {
            // Fallback to modal if no link
            onClick();
        }
    };

    return (
        <motion.a
            href={track.link || '#'}
            onClick={handleClick}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay / 1000, duration: 0.8, type: "spring", bounce: 0.2 }}
            className="group cursor-pointer mb-6 w-full block"
        >
            {/* Card Container - Dieter Rams Style: Clean, precise, subtle shadows */}
            <div className="relative w-full aspect-[16/9] overflow-hidden rounded-sm bg-neutral-100 mb-4 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1">
                
                {loadingPreview ? (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-50 text-neutral-300">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-neutral-300 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs font-mono uppercase tracking-widest">Loading Preview...</span>
                        </div>
                    </div>
                ) : previewUrl ? (
                     <ImageWithLoader 
                        src={previewUrl} 
                        alt={track.title}
                        data-hint="true"
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                     />
                ) : (
                     // Fallback for Coding Items
                     <div 
                        className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                        style={{ background: getFallbackCover(track).value.toString().includes('gradient') ? getFallbackCover(track).value : '#f5f5f5' }}
                     >
                        <div className="w-full h-full flex items-center justify-center opacity-20">
                            <span className="text-xs font-mono uppercase tracking-widest text-black">Code</span>
                        </div>
                     </div>
                )}

                {/* Hover Overlay with Action */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                     <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <ExternalLink size={16} className="text-black" />
                     </div>
                </div>
            </div>

            {/* Info Section */}
            <div className="w-full">
                {/* Title Row with Date */}
                <div className="flex justify-between items-baseline mb-2">
                    <h3 className="text-base font-bold text-neutral-900 leading-tight group-hover:text-blue-600 transition-colors">
                        {track.title}
                    </h3>
                    <span className="text-[10px] font-mono text-neutral-400 text-right tabular-nums shrink-0 ml-4">
                        {track.date}
                    </span>
                </div>
                {/* Description - Full Width */}
                <p className="text-sm text-neutral-500 font-normal line-clamp-2 leading-relaxed">
                    {track.description}
                </p>
            </div>
        </motion.a>
    )
}

const Lightbox: React.FC<{
  url: string;
  type: 'video' | 'image';
  onClose: () => void;
}> = ({ url, type, onClose }) => {
  return (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-xl"
        onClick={onClose}
    >
        {/* Close Button - Minimalist */}
        <button 
            className="absolute top-8 right-8 p-4 flex items-center justify-center text-white/70 hover:text-white transition-colors z-50 focus:outline-none"
        >
            <X size={32} strokeWidth={1.5} />
        </button>

        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full h-full flex items-center justify-center p-4 md:p-10 pointer-events-none"
        >
            {type === 'video' ? (
                <video 
                    src={url} 
                    controls 
                    autoPlay 
                    playsInline
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-full max-h-full rounded-sm shadow-2xl pointer-events-auto"
                />
            ) : (
                <img 
                    src={url} 
                    alt="Full View" 
                    onClick={(e) => e.stopPropagation()}
                    className="max-w-full max-h-full object-contain rounded-sm shadow-2xl pointer-events-auto" 
                />
            )}
        </motion.div>
    </motion.div>
  );
};

// --- Image Extraction Helper ---
const extractImages = (content: string, coverImage?: string | null): { images: { url: string; alt?: string; type?: 'image' | 'video' }[]; cleanContent: string } => {
    let images: { url: string; alt?: string; type?: 'image' | 'video' }[] = [];
    
    // Add cover image first if it exists
    if (coverImage) {
        images.push({ url: coverImage, alt: 'Cover', type: 'image' });
    }

    // Regex to find ![]()
    const imageRegex = /!\[(.*?)\]\((.*?)\)/g;
    let match;
    const foundUrls = new Set<string>();
    if (coverImage) foundUrls.add(coverImage);

    while ((match = imageRegex.exec(content)) !== null) {
        const alt = match[1];
        const url = match[2];
        
        if (!foundUrls.has(url)) {
            // Check if video
            if (alt === 'VIDEO' || url.match(/\.(mp4|mov|webm)$/i)) {
                images.push({ url, alt, type: 'video' });
            } else {
                images.push({ url, alt, type: 'image' });
            }
            foundUrls.add(url);
        }
    }

    // We do NOT remove images from content for now, based on user preference to just "support group picture switching".
    // Wait, the plan said "Hide extracted images from Markdown content".
    // User request: "要以图片内容为主，标题与简介放下方" (Content focused on images, title/desc below).
    // Re-reading plan: "If an image is shown in the Carousel, it will be hidden from the text body to avoid seeing it twice."
    // OK, implementing hiding logic.

    const cleanContent = content.replace(/!\[(.*?)\]\((.*?)\)/g, ''); // Naive removal. Can be smarter (remove surrounding newlines).

    return { images, cleanContent: cleanContent.replace(/\n{3,}/g, '\n\n').trim() };
};

// -----------------------------------------------------------------------------
// MINI VINYL CONTROL COMPONENT
// -----------------------------------------------------------------------------
const MiniControl: React.FC<{
  album: Album;
  isPlaying: boolean;
  onClick: () => void;
}> = ({ album, isPlaying, onClick }) => {
  return (
    <motion.button
       onClick={onClick}
       initial={{ opacity: 0, scale: 0.8, y: 20 }}
       animate={{ opacity: 1, scale: 1, y: 0 }}
       exit={{ opacity: 0, scale: 0.8, y: 20 }}
       whileHover={{ scale: 1.1 }}
       whileTap={{ scale: 0.9 }}
       transition={{ type: "spring", stiffness: 400, damping: 25 }}
       className="fixed bottom-6 right-6 z-[60] w-12 h-12 rounded-full cursor-pointer shadow-lg active:shadow-sm"
       style={{ backgroundColor: album.color, WebkitTapHighlightColor: 'transparent' }}
    >
       {/* Vinyl Grooves - Mini */}
       <div className={`absolute inset-[10%] rounded-full border border-black/10 opacity-50`}></div>
       
       {/* Spinning Container */}
       <div 
          className="w-full h-full rounded-full flex items-center justify-center animate-[spin_4s_linear_infinite]"
          style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
       >
           {/* Center Label */}
           <div className="w-[45%] h-[45%] rounded-full bg-[#111] flex items-center justify-center relative shadow-sm">
               {/* Signature */}
               <img 
                 src="/signature.png" 
                 alt="Signature" 
                 className="w-[80%] opacity-80 invert"
               />
               {/* Tiny Spindle */}
               <div className="absolute w-1 h-1 bg-neutral-200 rounded-full"></div>
           </div>
           
           {/* Shine - Mini */}
           <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-40"></div>
           </div>
       </div>
    </motion.button>
  );
};

// -----------------------------------------------------------------------------
// PROJECT MODAL COMPONENT (PHOTO-FIRST)
// -----------------------------------------------------------------------------
const ProjectModal: React.FC<{
  project: ProjectItem;
  color: string;
  albumId: string;
  onClose: () => void;
}> = ({ project, color, albumId, onClose }) => {
  const safeColor = color === '#FFFFFF' ? '#1A1A1A' : color;
  const dragControls = useDragControls();
  const isWriting = albumId === AlbumType.WRITING;
  const [visibleImage, setVisibleImage] = React.useState<{ url: string; type: 'image' | 'video' } | null>(null);

  // Extract images for Carousel (SKIP for Writing)
  const { images, cleanContent } = React.useMemo(() => {
      if (isWriting) {
          // For Writing, we keep content intact and layout inline
          return { images: [], cleanContent: project.content || '' };
      }
      return extractImages(project.content || '', project.imageUrl);
  }, [project.content, project.imageUrl, isWriting]);

  const hasDidacticContent = cleanContent.length > 5;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-end md:justify-center p-0 md:p-6 lg:p-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-100/95 backdrop-blur-xl"
      />

      <motion.div 
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0.05, bottom: 1 }}
        onDragEnd={(e, info: PanInfo) => {
           if (info.offset.y > 100 || info.velocity.y > 300) {
               onClose();
           }
        }}
        initial={{ y: "100%", opacity: 0.5, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: "40%", opacity: 0, scale: 0.96 }}
        transition={{ 
            type: "spring", 
            damping: 32, 
            stiffness: 300, 
            mass: 1.2 
        }}
        className="relative w-full md:w-[90vw] md:max-w-[1400px] bg-white shadow-2xl rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col h-[92dvh] md:h-[90vh]"
      >
         
         {/* Mobile Pull Handle */}
         <div 
            onPointerDown={(e) => dragControls.start(e)} 
            className="md:hidden w-full flex justify-center py-6 absolute top-0 z-30 cursor-grab active:cursor-grabbing touch-none"
         >
             <div className="w-12 h-1.5 bg-neutral-300/50 rounded-full backdrop-blur-md shadow-sm"></div>
         </div>

         {/* Close Button */}
         <button 
           onClick={onClose}
           className="hidden md:flex absolute top-6 right-6 z-20 w-10 h-10 items-center justify-center transition-all group focus:outline-none mix-blend-difference"
         >
           <X size={24} className="text-white transition-opacity hover:opacity-70" />
         </button>

         {/* LAYOUT SWITCHER */}
         {isWriting ? (
             /* WRITING LAYOUT: Single Scrollable Column */
             <div className="w-full h-full overflow-y-auto overscroll-contain bg-white relative">
                 <div className="max-w-3xl mx-auto px-6 py-20 md:py-24">
                     
                     {/* Article Title */}
                     {project.title && (
                         <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-8 tracking-tight leading-[1.1]">
                             {project.title}
                         </h1>
                     )}

                     {/* Metadata */}
                     <div className="flex flex-wrap gap-4 mb-12 items-center text-sm md:text-base text-neutral-500 font-mono border-b border-neutral-100 pb-8">
                         <span>{project.date}</span>
                         {project.tags.length > 0 && (
                            <>
                                <span className="text-neutral-300">/</span>
                                {project.tags.map(tag => (
                                    <span key={tag} className="uppercase tracking-widest text-xs">
                                        #{tag}
                                    </span>
                                ))}
                            </>
                         )}
                     </div>

                     {/* Main Cover (From Notion Image property) */}
                     {project.imageUrl && (
                         <div className="w-full mb-16 rounded-sm overflow-hidden bg-neutral-50 shadow-sm">
                             <ImageWithLoader 
                                 src={project.imageUrl} 
                                 alt={project.title} 
                                 className="w-full h-auto"
                             />
                         </div>
                     )}

                     {/* Article Body */}
                     <div className="prose prose-neutral prose-lg max-w-none text-neutral-800 leading-relaxed mb-20">
                         <SimpleMarkdown 
                            content={cleanContent} 
                            color={safeColor} 
                            albumId={albumId}
                            onImageClick={(url) => setVisibleImage({ url, type: 'image' })}
                         />
                     </div>

                     {/* Link */}
                     {project.link && (
                        <div className="pt-8 border-t border-neutral-100">
                             <a 
                               href={project.link}
                               target="_blank"
                               rel="noopener noreferrer"
                               className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
                               style={{ color: safeColor }}
                             >
                               Visit Project/Article <ExternalLink size={14} />
                             </a>
                        </div>
                     )}
                 </div>
             </div>
         ) : (
             /* STANDARD LAYOUT (Photo/Coding) */
             <div className="flex flex-col h-full">
                 
                 {/* 1. CAROUSEL AREA */}
                 <div 
                    className="w-full flex-1 min-h-[50vh] bg-neutral-100 relative group touch-none"
                    onPointerDown={(e) => dragControls.start(e)}
                 >
                    {images.length > 0 ? (
                        <Carousel 
                           images={images} 
                           onImageClick={(url, type) => setVisibleImage({ url, type })}
                        />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-neutral-300 bg-neutral-50">
                           <span className="text-xs font-mono uppercase tracking-widest">No Visuals</span>
                       </div>
                    )}
                 </div>

                 {/* 2. CONTENT AREA */}
                 <div className="w-full max-h-[40vh] bg-white border-t border-neutral-100 overflow-y-auto overscroll-contain">
                    <div className="max-w-4xl mx-auto px-6 py-8 md:px-10 md:py-10">
                        {/* Tags */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {project.tags.map(tag => (
                                <span key={tag} className="text-[10px] uppercase font-bold tracking-[0.15em] text-neutral-400 border border-neutral-200 px-2 py-1 rounded-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Title */}
                        {project.title && project.title.toLowerCase() !== 'untitled' && (
                            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4 tracking-tight leading-tight">
                                {project.title}
                            </h2>
                        )}

                        {/* Divider */}
                        <div className="w-12 h-0.5 mb-8 opacity-20" style={{ backgroundColor: safeColor }}></div>
                        
                        {/* Description */}
                        <div className="prose prose-neutral prose-sm md:prose-base max-w-none text-neutral-600">
                            {hasDidacticContent ? (
                                <SimpleMarkdown 
                                    content={cleanContent} 
                                    color={safeColor} 
                                    albumId={albumId} 
                                    onImageClick={(url) => setVisibleImage({ url, type: 'image' })}
                                />
                            ) : (
                                 <p className="leading-relaxed font-normal">
                                    {project.description}
                                </p>
                            )}
                        </div>

                        {/* Link */}
                        {project.link && (
                            <div className="mt-10 pt-6 border-t border-neutral-100">
                                 <a 
                                   href={project.link}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
                                   style={{ color: safeColor }}
                                 >
                                   Visit Project <ExternalLink size={12} />
                                 </a>
                            </div>
                        )}
                    </div>
                 </div>
             </div>
         )}
      </motion.div>
      
      {/* FULL SCREEN LIGHTBOX */}
      <AnimatePresence>
        {visibleImage && (
            <Lightbox 
                url={visibleImage.url} 
                type={visibleImage.type} 
                onClose={() => setVisibleImage(null)} 
            />
        )}
      </AnimatePresence>
    </div>
  );
};

import { getAlbumWithProjects } from '../lib/api';
import { Loader2 } from 'lucide-react';

/* ... previous imports ... */

export const ImmersiveView: React.FC<ImmersiveViewProps> = ({ album: initialAlbum, onClose, isMusicPlaying, onMusicToggle, onVideoPlay, onVideoEnd }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const vinylRef = useRef<HTMLDivElement>(null); // Ref for main vinyl visibility
  const [showVinyl, setShowVinyl] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [backHovered, setBackHovered] = useState(false);
  const [showMiniControl, setShowMiniControl] = useState(false); // Mini Vinyl State

  // Dynamic Data State
  const [albumData, setAlbumData] = useState<Album>(initialAlbum);
  const [loading, setLoading] = useState(true);

  // Scroll Detection for Mini Vinyl
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If main vinyl is NOT intersection (scrolled out), show mini control
        setShowMiniControl(!entry.isIntersecting);
      },
      { threshold: 0.2 } // Trigger when 20% visible or less? Or just 0
    );

    if (vinylRef.current) {
      observer.observe(vinylRef.current);
    }

    return () => observer.disconnect();
  }, [showVinyl]); // Re-run when vinyl appears

  // Data Fetching Logic (Reusable)
  const fetchAlbumData = async () => {
      // Don't set global loading here to avoid full screen flickering on refresh
      try {
        const data = await getAlbumWithProjects(initialAlbum.id);
        if (data) {
          setAlbumData({
            ...initialAlbum,
            tracks: data.tracks
          });
        }
      } catch (error) {
        console.error("Failed to load album data", error);
      }
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    
    fetchAlbumData().finally(() => {
        if (isMounted) setLoading(false);
    });

    // Delay the slide-out of the record
    const timer = setTimeout(() => setShowVinyl(true), 600);
    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [initialAlbum.id]);


  // --- PULL TO REFRESH LOGIC ---
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef(0);

  const THRESHOLD = 100;

  const handleTouchStart = (e: React.TouchEvent) => {
      if (scrollContainerRef.current && scrollContainerRef.current.scrollTop <= 0) {
          touchStartRef.current = e.touches[0].clientY;
          setIsDragging(true);
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      // Must be dragging and at top
      if (!isDragging || isRefreshing || !scrollContainerRef.current) return;
      
      const scrollTop = scrollContainerRef.current.scrollTop;
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartRef.current;

      if (scrollTop <= 0 && diff > 0) {
          // Asymptotic Damping (Rubber Band Effect)
          // formula: limit * (1 - exp(-diff / factor))
          const limit = 220; 
          const factor = 250;
          const damped = limit * (1 - Math.exp(-diff / factor));
          
          setPullY(damped);
      } else {
          // If we scroll back up or weren't at top
          // Allow native scroll if negative diff (scrolling down), but if positive keep tracking?
          // Simplification: just reset if not valid pull
           if (scrollContainerRef.current.scrollTop > 0) {
               setPullY(0);
               setIsDragging(false);
           }
      }
  };

  const handleTouchEnd = async () => {
      setIsDragging(false); // Enable spring transition
      
      if (isRefreshing) return;
      
      if (pullY > THRESHOLD) {
          setIsRefreshing(true);
          setPullY(THRESHOLD); // Snap to threshold
          
          // Perform Refresh with Minimum Duration (2s) for UX
          // This ensures user sees the spinner actually spin and reads the text
          const minWait = new Promise(resolve => setTimeout(resolve, 2000));
          await Promise.all([fetchAlbumData(), minWait]);
          
          setIsRefreshing(false);
          setPullY(0);
      } else {
          setPullY(0);
      }
  };


  return (
    <>
      <motion.div 
        ref={containerRef}
        className="fixed inset-0 z-50 text-[#111] overflow-hidden flex flex-col"
        initial={{ opacity: 0, scale: 1.1, filter: 'blur(20px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
        transition={{ 
            duration: 0.7, 
            ease: [0.2, 0.8, 0.2, 1] 
        }}
      >
        
        {/* Mobile Back Button - Pinned */}
        <button 
          onClick={onClose}
          className="md:hidden absolute top-6 left-6 z-50 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm border border-neutral-100 active:scale-95 transition-transform text-neutral-900"
        >
          <ArrowLeft size={18} />
        </button>

        {/* PULL TO REFRESH INDICATOR */}
        <div 
            className="absolute top-6 left-0 right-0 flex flex-col items-center justify-center pointer-events-none z-50 gap-3"
            style={{ 
                 opacity: Math.min(pullY / 40, 1),
            }}
        >
            <div 
                className={`w-6 h-6 border-2 border-neutral-400/30 border-t-neutral-500 rounded-full ${isRefreshing ? 'animate-spin' : ''}`}
                style={{ 
                    transform: isRefreshing ? undefined : `rotate(${pullY * 3}deg)`
                }}
            ></div>
            
            {/* Hint Text - Only separate opacity logic if needed, but sharing parent opacity is fine for simultaneous fade in */}
            <span 
                className="text-[10px] text-neutral-400 font-mono tracking-wide text-center"
                style={{ opacity: 0.8 }} // Base opacity
            >
                如遇加载卡顿/失败，请搭载梯子刷新～
            </span>
        </div>

        {/* SCROLL CONTAINER WRAPPER */}
        <div 
            ref={scrollContainerRef}
            className={`w-full h-full flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative transition-transform ease-[cubic-bezier(0.25,1,0.5,1)] ${isDragging ? 'duration-0' : 'duration-500'}`}
            style={{ transform: `translateY(${pullY}px)` }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >         
            
            {/* LEFT COLUMN: VISUALS */}
            <div 
                className="relative w-full md:w-[42%] lg:w-[38%] h-[40vh] md:h-full flex items-center justify-start overflow-hidden shrink-0 z-0 border-r border-black/5"

            >
              
              {/* Vinyl Container */}
              <motion.div 
                 initial={{ opacity: 0, y: 50, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 transition={{ type: "spring", duration: 0.8, bounce: 0.2 }}
                 className="relative w-full h-full flex items-center overflow-hidden"
              >
                 {/* Adjusted positioning */}
                 <div ref={vinylRef} className="w-[60vw] h-[60vw] md:w-[32vw] md:h-[32vw] max-w-[550px] max-h-[550px] relative -translate-x-[20%] md:-translate-x-[40%]">
                    <RecordVinyl 
                        album={albumData} 
                        isActive={showVinyl} 
                        isSpinning={isMusicPlaying} 
                        showSleeve={true}
                        layout="FLAT" 
                        onClick={onMusicToggle}
                    />
                 </div>
                 
                 {/* Reflection/Shadow */}
                 <div 
                     className={`
                         absolute -bottom-16 left-0 w-full h-8 bg-black/5 blur-2xl rounded-[100%]
                         transition-all duration-1000 delay-500
                         ${showVinyl ? 'opacity-100 translate-x-[25%] md:translate-x-[50%] scale-x-125' : 'opacity-0 translate-x-0 scale-x-75'}
                     `}
                 />
              </motion.div>

              {/* Desktop Back Button */}
              <button 
                onClick={onClose}
                onMouseEnter={() => setBackHovered(true)}
                onMouseLeave={() => setBackHovered(false)}
                className="hidden md:flex absolute top-10 left-10 items-center gap-3 px-0 py-2 transition-all group z-20"
              >
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${backHovered ? `border-transparent ${albumData.color.toLowerCase() === '#ffffff' ? 'text-neutral-900' : 'text-white'}` : 'border-neutral-300 text-neutral-400'}`} style={{ backgroundColor: backHovered ? albumData.color : 'transparent' }}>
                    <ArrowLeft size={14} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${backHovered ? 'text-neutral-900' : 'text-neutral-400'}`}>返回</span>
              </button>
            </div>

            {/* RIGHT COLUMN: Content */}
            <div 
                className="relative z-10 flex-1 w-full min-h-[100dvh] md:min-h-0 md:h-full md:overflow-y-auto no-scrollbar"
                style={{ marginBottom: 0 }}
            >
              <div className="min-h-full py-8 pl-8 pr-16 md:p-16 lg:p-24 xl:pr-32 max-w-7xl mx-auto flex flex-col justify-start md:justify-center">
                  
                  {/* Header */}
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
                    className="flex flex-col items-start"
                  >
                      <div className="flex w-full">
                          {/* SPACER FOR ALIGNMENT */}
                          <div className="w-8 md:w-10 shrink-0"></div>
                          
                          {/* HEADER CONTENT */}
                          <div className="flex-1">
                              {/* 
                                  FLUID TYPOGRAPHY: 
                                  Using clamp() to ensure the title scales with the viewport width.
                              */}
                              <h1 className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-black tracking-tighter leading-[0.9] text-neutral-900 mb-8 uppercase text-left font-sans">
                                  {albumData.title}
                              </h1>

                              <div className="mb-10 flex items-center">
                                <div className="flex items-center gap-3 select-none group">
                                   <div 
                                      className="w-2 h-2 shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-110" 
                                      style={{ backgroundColor: albumData.color }}
                                   ></div>
                                   <div className="w-px h-3 bg-neutral-300"></div>
                                   <span className="text-[10px] font-mono font-medium uppercase tracking-[0.25em] text-neutral-500">
                                      {albumData.id} COLLECTION
                                   </span>
                                </div>
                              </div>
                          </div>
                      </div>
                  </motion.div>

                  {/* List or Intro Content */}
                  <div className="space-y-0 pb-24">
                     {loading ? (
                       <div className="pl-8 md:pl-10 flex items-center gap-3 text-neutral-400">
                          <Loader2 className="animate-spin" size={16} />
                          <span className="text-xs font-mono uppercase tracking-widest">Loading Content...</span>
                       </div>
                     ) : (
                       <>
                         {/* Conditional Header for Tracks */}
                         {!albumData.introContent && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                transition={{ delay: 0.4 }}
                                className="flex w-full mb-0"
                            >
                                <div className="w-8 md:w-10 shrink-0"></div>
                                <div className="flex-1 flex items-end justify-between border-b border-black pb-2 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-black">TRACKLIST</span>
                                    <span className="text-[10px] font-mono text-neutral-400 text-right w-[80px]">{albumData.tracks.length} ITEMS</span>
                                </div>
                            </motion.div>
                         )}
    
                         {albumData.introContent ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                            >
                                {/* Elegant Divider Line */}
                                <div className="pl-8 md:pl-10 w-full mb-8">
                                    <div className="w-full h-px bg-neutral-200" />
                                </div>
                                <div className="pl-8 md:pl-10 w-full">
                                    <SimpleMarkdown content={albumData.introContent} color={albumData.color} albumId={albumData.id} />
                                </div>
                            </motion.div>
                         ) : (
                             <div className="pl-0">
                                {albumData.id === AlbumType.VIDEO ? (
                                    // VIDEO GRID - MASONRY
                                    // columns-1 md:columns-2
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 pl-8 md:pl-10">
                                        {[...albumData.tracks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((track, index) => (
                                            <VideoGridItem
                                                key={track.id}
                                                track={track}
                                                index={index}
                                                color={albumData.color}
                                                // No onClick -> No Detail Modal
                                                delay={400 + (index * 80)}
                                                onVideoPlay={onVideoPlay}
                                                onVideoEnd={onVideoEnd}
                                            />
                                        ))}
                                    </div>
                                ) : albumData.id === AlbumType.PHOTO ? (
                                    // PHOTO GRID - MASONRY LAYOUT
                                    <div className="pt-4 pl-8 md:pl-10 pr-0 md:pr-0">
                                        <MasonryLayout 
                                            tracks={albumData.tracks}
                                            renderItem={(track, index) => (
                                                <PhotoGridItem
                                                    key={track.id}
                                                    track={track}
                                                    index={index}
                                                    color={albumData.color}
                                                    onClick={() => setSelectedProject(track)}
                                                    delay={400 + (index * 80)}
                                                />
                                            )}
                                        />
                                    </div>
                                ) : albumData.id === AlbumType.CODING ? (
                                    // CODING GRID - SINGLE COLUMN
                                    <div className="grid grid-cols-1 gap-y-6 pt-4 pl-8 md:pl-10">
                                         {[...albumData.tracks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((track, index) => (
                                            <CodingGridItem
                                                key={track.id}
                                                track={track}
                                                index={index}
                                                color={albumData.color}
                                                onClick={() => setSelectedProject(track)}
                                                delay={400 + (index * 80)}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    // DEFAULT LIST (WRITING, CODING)
                                    albumData.tracks.map((track, index) => (
                                        <TrackItem 
                                            key={track.id} 
                                            track={track} 
                                            index={index} 
                                            color={albumData.color}
                                            isHovered={hoveredTrack === track.id}
                                            onHover={setHoveredTrack}
                                            onClick={() => setSelectedProject(track)}
                                            delay={400 + (index * 80)}
                                        />
                                    ))
                                )}
                             </div>
                         )}
                       </>
                     )}
                  </div>
              </div>
            </div>
        </div>
      </motion.div>

      {/* PROJECT MODAL */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal 
            project={selectedProject} 
            color={albumData.color} 
            albumId={albumData.id}
            onClose={() => setSelectedProject(null)} 
            key="modal"
          />
        )}
      </AnimatePresence>
      
      {/* Mini Control Floater */}
      <AnimatePresence>
         {showMiniControl && (
            <MiniControl 
               album={albumData} 
               isPlaying={isMusicPlaying} 
               onClick={onMusicToggle} 
            />
         )}
      </AnimatePresence>
    </>
  );
};
