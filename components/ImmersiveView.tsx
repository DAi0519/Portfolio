import React, { useEffect, useState, useRef } from 'react';
import { Album, ProjectItem, AlbumType } from '../types';
import { ArrowLeft, X, ExternalLink, Play } from 'lucide-react';
import RecordVinyl from './RecordVinyl';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';

interface ImmersiveViewProps {
  album: Album;
  onClose: () => void;
}

const SimpleMarkdown: React.FC<{ content: string; color: string }> = ({ content, color }) => {
  const safeColor = color === '#FFFFFF' ? '#1A1A1A' : color;
  
  // --- Tokenize content into segments (lines or tables) ---
  const lines = content.split('\n');
  const segments: { type: 'line' | 'table'; lines: string[] }[] = [];
  let currentTableLines: string[] = [];

  lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          currentTableLines.push(trimmed);
      } else {
          if (currentTableLines.length > 0) {
              segments.push({ type: 'table', lines: currentTableLines });
              currentTableLines = [];
          }
          segments.push({ type: 'line', lines: [line] });
      }
  });
  if (currentTableLines.length > 0) {
      segments.push({ type: 'table', lines: currentTableLines });
  }

  // --- Render segment helper ---
  const renderLine = (line: string, i: number) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={i} className="h-4" />;

      // Image / Video Parser: ![alt](url)
      const mediaMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (mediaMatch) {
          const alt = mediaMatch[1];
          const url = mediaMatch[2];
          if (alt === 'VIDEO') {
              return (
                  <video 
                      key={i}
                      src={url} 
                      controls 
                      playsInline
                      className="w-full rounded-sm my-8 shadow-sm bg-black/5"
                  />
              );
          }
          return (
              <img 
                  key={i}
                  src={url} 
                  alt={alt} 
                  className="w-full h-auto rounded-sm my-8 shadow-sm"
              />
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
                       ${!isHovered ? 'text-neutral-300' : 'font-bold'}
                    `}
                    style={{ color: isHovered ? safeColor : undefined }}
                >
                    {String(index + 1).padStart(2, '0')}
                </span>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex items-center justify-between py-5 border-b border-neutral-200 transition-colors duration-500 group-hover:border-neutral-300">
                <h3 
                    className="text-lg md:text-xl font-bold tracking-tight text-neutral-900 transition-colors truncate pr-4"
                    style={{ color: isHovered ? safeColor : undefined }}
                >
                     {track.title}
                </h3>
                <span className="hidden md:block text-[10px] font-mono text-neutral-300 group-hover:text-neutral-500 transition-colors uppercase tracking-wider text-right w-[80px] tabular-nums">
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
    onClick: () => void;
    delay: number;
}> = ({ track, color, onClick, delay }) => {
    const safeColor = color === '#FFFFFF' ? '#1A1A1A' : color;
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [isLandscape, setIsLandscape] = React.useState(false);
    
    // Extract video URL if available in content
    const videoMatch = track.content?.match(/!\[VIDEO\]\((.*?)\)/);
    const videoUrl = videoMatch ? videoMatch[1] : null;

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleLoadedMetadata = () => {
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
            className={`group cursor-pointer mb-8 ${isLandscape ? 'col-span-2' : ''}`}
        >
            <div className="relative w-full overflow-hidden rounded-sm bg-neutral-900 mb-3">
                {videoUrl ? (
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="w-full relative"
                    >
                        <video 
                            ref={videoRef}
                            src={videoUrl}
                            controls={isPlaying}
                            playsInline
                            webkit-playsinline="true"
                            preload="metadata"
                            onLoadedMetadata={handleLoadedMetadata}
                            onEnded={() => setIsPlaying(false)}
                            className="w-full h-auto object-cover rounded-sm bg-black"
                        />
                        {/* Custom Play Overlay */}
                        {!isPlaying && (
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
                        {track.imageUrl && (
                            <img 
                                src={track.imageUrl} 
                                alt={track.title} 
                                className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        )}
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
    return (
        <motion.div
            onClick={onClick}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay / 1000, duration: 0.6, type: "spring" }}
            className="group cursor-pointer relative w-full mb-4 break-inside-avoid overflow-hidden rounded-sm bg-neutral-100"
        >
             {/* 
                MASONRY ITEM
                No forced aspect ratio. Just w-full.
            */}
            {track.imageUrl && (
                <img 
                    src={track.imageUrl} 
                    alt={track.title} 
                    className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-105"
                />
            )}
            
            {/* Minimal Overlay Info */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3 className="text-white text-xs font-bold tracking-widest uppercase">
                    {track.title}
                </h3>
            </div>
        </motion.div>
    );
};

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
            className="absolute top-8 right-8 p-4 flex items-center justify-center text-white/50 hover:text-white transition-colors z-50 focus:outline-none"
        >
            <X size={32} strokeWidth={1} />
        </button>

        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()} // Prevent close on media click
        >
            {type === 'video' ? (
                <video 
                    src={url} 
                    controls 
                    autoPlay 
                    playsInline
                    className="max-w-full max-h-full rounded-sm shadow-2xl"
                />
            ) : (
                <img 
                    src={url} 
                    alt="Full View" 
                    className="max-w-full max-h-full object-contain rounded-sm shadow-2xl" 
                />
            )}
        </motion.div>
    </motion.div>
  );
};

const ProjectModal: React.FC<{
  project: ProjectItem;
  color: string;
  onClose: () => void;
}> = ({ project, color, onClose }) => {
  const safeColor = color === '#FFFFFF' ? '#1A1A1A' : color;
  const dragControls = useDragControls();
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'video' | 'image' } | null>(null);

  const handleMediaClick = (e: React.MouseEvent) => {
      // If user is dragging (not clicking), we shouldn't trigger this (dragControls usually handles this but good to be safe)
      // Actually PointerDown starts drag, standard Click fires if no drag.
      
      const mediaUrl = project.videoUrl || project.imageUrl;
      if (mediaUrl) {
          setLightboxMedia({
              url: mediaUrl,
              type: project.videoUrl ? 'video' : 'image'
          });
      }
  };

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
        className="relative w-full md:w-[90vw] md:max-w-[1400px] bg-white shadow-2xl rounded-t-3xl md:rounded-lg overflow-hidden flex flex-col h-[92dvh] md:h-auto md:max-h-[85vh]"
      >
         
         {/* Mobile Pull Handle - High Hit Area */}
         <div 
            onPointerDown={(e) => dragControls.start(e)} 
            className="md:hidden w-full flex justify-center py-6 absolute top-0 z-30 cursor-grab active:cursor-grabbing touch-none"
         >
             <div className="w-12 h-1.5 bg-neutral-300/50 rounded-full backdrop-blur-md"></div>
         </div>

         {/* Close Button - Minimalist */}
         <button 
           onClick={onClose}
           className="hidden md:flex absolute top-6 right-6 z-20 p-2 items-center justify-center transition-transform group focus:outline-none"
         >
           <X size={24} strokeWidth={1.5} className="text-neutral-400 group-hover:text-black group-hover:rotate-90 transition-all duration-300" />
         </button>

         {/* UNIFIED SCROLL CONTAINER */}
         <div className="flex-1 w-full overflow-y-auto overscroll-contain bg-white relative">
             
             {/* Image Header - Now Scrolls */}
             {project.imageUrl && (
               <div 
                   onPointerDown={(e) => dragControls.start(e)}
                   onClick={handleMediaClick}
                   className="w-full bg-neutral-50 relative transition-all duration-700 overflow-hidden cursor-zoom-in group touch-none"
               >
                 {/* Visual Hint for Video */}
                 {project.videoUrl && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                            <Play size={24} fill="white" className="text-white ml-1" />
                        </div>
                    </div>
                 )}
                 <img src={project.imageUrl} alt={project.title} className="w-full h-auto object-contain bg-neutral-100" />
               </div>
             )}

             {/* Content Body */}
             <div className={`w-full px-8 pb-8 md:p-10 bg-white ${project.imageUrl ? 'pt-8' : 'pt-20'}`}>
                <div className="flex flex-wrap gap-2 mb-8">
                   {project.tags.map(tag => (
                      <span key={tag} className="text-[9px] uppercase font-bold tracking-[0.15em] text-neutral-400">
                        #{tag}
                      </span>
                   ))}
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6 tracking-tight leading-tight">
                  {project.title}
                </h2>

                {/* Content Divider */}
                <div 
                    className="w-8 h-1 mb-8"
                    style={{ backgroundColor: safeColor }}
                ></div>

                <div className="prose prose-neutral prose-lg max-w-none">
                    {project.content ? (
                        <SimpleMarkdown content={project.content} color={safeColor} />
                    ) : (
                        <p className="text-neutral-600 leading-relaxed font-normal text-base md:text-lg">
                            {project.description}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row items-center gap-3 mt-12 pt-8 border-t border-neutral-100">
                   {project.link && (
                     <a 
                       href={project.link}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="w-full md:w-auto flex-1 text-white py-3 px-6 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                       style={{ backgroundColor: safeColor }}
                     >
                       查看 <ExternalLink size={12} />
                     </a>
                   )}
                </div>
             </div>
         </div>
      </motion.div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
          {lightboxMedia && (
              <Lightbox 
                  url={lightboxMedia.url} 
                  type={lightboxMedia.type} 
                  onClose={() => setLightboxMedia(null)} 
              />
          )}
      </AnimatePresence>
    </div>
  );
};

import { getAlbumWithProjects } from '../lib/api';
import { Loader2 } from 'lucide-react';

/* ... previous imports ... */

export const ImmersiveView: React.FC<ImmersiveViewProps> = ({ album: initialAlbum, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showVinyl, setShowVinyl] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [backHovered, setBackHovered] = useState(false);

  // Dynamic Data State
  const [albumData, setAlbumData] = useState<Album>(initialAlbum);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Fetch full album data (including projects) from Supabase
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getAlbumWithProjects(initialAlbum.id);
        if (isMounted && data) {
          // Merge: Keep local metadata (Titles, Colors) as Source of Truth. 
          // Only use backend for Tracks.
          setAlbumData({
            ...initialAlbum,
            tracks: data.tracks
          });
        }
      } catch (error) {
        console.error("Failed to load album data", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    // Delay the slide-out of the record
    const timer = setTimeout(() => setShowVinyl(true), 600);
    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [initialAlbum.id]);

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
        
        {/* Mobile Back Button - Now outside the scroll container, pinned to the Viewport/Root */}
        <button 
          onClick={onClose}
          className="md:hidden absolute top-6 left-6 z-50 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm border border-neutral-100 active:scale-95 transition-transform text-neutral-900"
        >
          <ArrowLeft size={18} />
        </button>

        {/* SCROLL CONTAINER WRAPPER */}
        {/* On Mobile: This handles the vertical scroll for the whole page. */}
        {/* On Desktop: This sits still, allowing the Right Column to scroll internally. */}
        <div className="w-full h-full flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative">
            
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
                 <div className="w-[60vw] h-[60vw] md:w-[32vw] md:h-[32vw] max-w-[500px] max-h-[500px] relative -translate-x-[20%] md:-translate-x-[40%]">
                    <RecordVinyl 
                        album={albumData} 
                        isActive={showVinyl} 
                        isSpinning={true} 
                        showSleeve={true}
                        layout="FLAT" 
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
              <div className="min-h-full py-8 pl-8 pr-16 md:p-16 lg:p-24 flex flex-col justify-start md:justify-center">
                  
                  {/* Header */}
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
                    className="flex flex-col items-start"
                  >
                      <div className="pl-8 md:pl-10 w-full">
                          {/* 
                              FLUID TYPOGRAPHY: 
                              Using clamp() to ensure the title scales with the viewport width.
                          */}
                          <h1 className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-black tracking-tighter leading-[0.9] text-neutral-900 mb-8 uppercase text-left font-sans break-words hyphens-auto">
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
                                <SimpleMarkdown content={albumData.introContent} color={albumData.color} />
                            </motion.div>
                         ) : (
                             <div className="pl-0 md:pl-10">
                                {albumData.id === AlbumType.VIDEO ? (
                                    // VIDEO GRID - MASONRY
                                    // columns-1 md:columns-2
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 pl-8 md:pl-0">
                                        {albumData.tracks.map((track, index) => (
                                            <VideoGridItem
                                                key={track.id}
                                                track={track}
                                                index={index}
                                                color={albumData.color}
                                                onClick={() => setSelectedProject(track)}
                                                delay={400 + (index * 80)}
                                            />
                                        ))}
                                    </div>
                                ) : albumData.id === AlbumType.PHOTO ? (
                                    // PHOTO GRID - MASONRY
                                    // columns-2 md:columns-3
                                    <div className="columns-2 md:columns-3 gap-4 pt-4 pl-8 md:pl-0 block">
                                        {albumData.tracks.map((track, index) => (
                                            <PhotoGridItem
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
            onClose={() => setSelectedProject(null)} 
            key="modal"
          />
        )}
      </AnimatePresence>
    </>
  );
};
