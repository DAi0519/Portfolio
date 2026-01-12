import React, { useEffect, useState, useRef } from 'react';
import { Album, ProjectItem, AlbumType } from '../types';
import { ArrowLeft, X, ExternalLink, Play } from 'lucide-react';
import RecordVinyl from './RecordVinyl';
import { motion, AnimatePresence } from 'framer-motion';

interface ImmersiveViewProps {
  album: Album;
  onClose: () => void;
}

const SimpleMarkdown: React.FC<{ content: string; color: string }> = ({ content, color }) => {
  const safeColor = color === '#FFFFFF' ? '#1A1A1A' : color;
  
  return (
    <div className="prose prose-neutral max-w-none pl-8 md:pl-10">
      {content.split('\n').map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={i} className="text-[10px] font-bold uppercase tracking-[0.2em] mt-8 mb-4 text-neutral-500 font-sans">
              {trimmed.replace('### ', '')}
            </h3>
          );
        }
        
        if (trimmed.startsWith('---')) {
             return <hr key={i} className="my-8 border-neutral-200" />;
        }

        if (trimmed.startsWith('- ')) {
           const parts = trimmed.replace('- ', '').split('**');
           return (
             <div key={i} className="flex items-baseline gap-3 my-2 pl-0">
                <span className="w-1 h-1 rounded-full shrink-0 translate-y-[-2px] opacity-40" style={{ backgroundColor: safeColor }} />
                <p className="flex-1 text-[#1A1A1A] leading-[1.6] m-0 text-[16px] font-serif">
                   {parts.map((part, idx) => 
                      idx % 2 === 1 ? <strong key={idx} className="font-semibold text-black">{part}</strong> : part
                   )}
                </p>
             </div>
           );
        }

        const parts = trimmed.split('**');
        return (
          <p key={i} className="text-[#1A1A1A] leading-[1.6] mb-4 font-serif text-[16px]">
             {parts.map((part, idx) => 
                idx % 2 === 1 ? <strong key={idx} className="font-semibold text-black">{part}</strong> : part
             )}
          </p>
        );
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
    return (
        <motion.div
            onClick={onClick}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay / 1000, duration: 0.8, type: "spring", bounce: 0.2 }}
            className="group cursor-pointer mb-8 break-inside-avoid"
        >
            {/* 
                MASONRY ITEM
                No forced aspect ratio. Just w-full.
            */}
            <div className="relative w-full overflow-hidden rounded-sm bg-neutral-200 mb-3">
                {track.imageUrl && (
                    <img 
                        src={track.imageUrl} 
                        alt={track.title} 
                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                )}
                {/* Overlay Play Button */}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <Play size={20} className="ml-1" style={{ color: safeColor }} fill={safeColor} />
                    </div>
                </div>
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

const ProjectModal: React.FC<{
  project: ProjectItem;
  color: string;
  onClose: () => void;
}> = ({ project, color, onClose }) => {
  const safeColor = color === '#FFFFFF' ? '#1A1A1A' : color;
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
        initial={{ y: "100%", opacity: 0.5, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: "40%", opacity: 0, scale: 0.96 }}
        transition={{ 
            type: "spring", 
            damping: 32, // More dampening = heavier feel
            stiffness: 300, 
            mass: 1.2 // More mass = satisfying thud
        }}
        className="relative w-full md:max-w-xl bg-white shadow-2xl rounded-t-3xl md:rounded-lg overflow-hidden flex flex-col h-[92dvh] md:h-auto md:max-h-[85vh]"
      >
         
         {/* Mobile Pull Handle */}
         <div className="md:hidden w-full flex justify-center pt-4 pb-2 absolute top-0 z-20 pointer-events-none">
             <div className="w-12 h-1 bg-black/10 rounded-full"></div>
         </div>

         {/* Close Button */}
         <button 
           onClick={onClose}
           className="hidden md:flex absolute top-6 right-6 z-20 w-8 h-8 rounded-full bg-white/50 hover:bg-neutral-100 items-center justify-center transition-all group"
         >
           <X size={16} className="text-neutral-400 group-hover:text-black transition-colors" />
         </button>

         {/* Image Header */}
         {project.imageUrl && (
           <div className="w-full max-h-[50vh] bg-neutral-50 relative shrink-0 grayscale hover:grayscale-0 transition-all duration-700 overflow-hidden">
             <img src={project.imageUrl} alt={project.title} className="w-full h-full object-contain bg-neutral-100" />
           </div>
         )}

         {/* Content Body */}
         <div className="p-8 md:p-10 overflow-y-auto bg-white flex-1">
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
                <p className="text-neutral-600 leading-relaxed font-normal text-base md:text-lg">
                {project.description}
                </p>
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
      </motion.div>
    </div>
  );
};

export const ImmersiveView: React.FC<ImmersiveViewProps> = ({ album, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showVinyl, setShowVinyl] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [backHovered, setBackHovered] = useState(false);

  // No scroll-linked scaling. Purity and stillness.

  useEffect(() => {
    // Delay the slide-out of the record
    const timer = setTimeout(() => setShowVinyl(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <motion.div 
        ref={containerRef}
        className="fixed inset-0 z-50 text-[#111] overflow-hidden flex flex-col"
        style={{ backgroundColor: album.backgroundColor }}
        initial={{ opacity: 0, scale: 0.92, filter: 'blur(20px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        exit={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
        transition={{ 
            duration: 0.8, 
            ease: [0.16, 1, 0.3, 1] // Apple-style ease-out
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
                style={{ 
                    backgroundColor: album.backgroundColor,
                }}
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
                        album={album} 
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
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${backHovered ? `border-transparent ${album.color.toLowerCase() === '#ffffff' ? 'text-neutral-900' : 'text-neutral-900'}` : 'border-neutral-300 text-neutral-400'}`} style={{ backgroundColor: backHovered ? album.color : 'transparent' }}>
                    <ArrowLeft size={14} />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${backHovered ? 'text-neutral-900' : 'text-neutral-400'}`}>返回</span>
              </button>
            </div>

            {/* RIGHT COLUMN: Content */}
            <div 
                className="relative z-10 flex-1 w-full min-h-[100dvh] md:min-h-0 md:h-full md:overflow-y-auto no-scrollbar"
                style={{ backgroundColor: album.backgroundColor }}
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
                          <h1 className="text-[clamp(2.5rem,5.5vw,4.5rem)] font-black tracking-tighter leading-[0.9] text-neutral-900 mb-8 uppercase text-left font-serif break-words hyphens-auto">
                              {album.title}
                          </h1>

                          <div className="mb-10 flex items-center">
                            <div className="flex items-center gap-3 select-none group">
                               <div 
                                  className="w-2 h-2 shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-110" 
                                  style={{ backgroundColor: album.color }}
                               ></div>
                               <div className="w-px h-3 bg-neutral-300"></div>
                               <span className="text-[10px] font-mono font-medium uppercase tracking-[0.25em] text-neutral-500">
                                  {album.id} COLLECTION
                               </span>
                            </div>
                          </div>
                      </div>
                  </motion.div>

                  {/* List or Intro Content */}
                  <div className="space-y-0 pb-24">
                     {/* Conditional Header for Tracks */}
                     {!album.introContent && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            transition={{ delay: 0.4 }}
                            className="flex w-full mb-0"
                        >
                            <div className="w-8 md:w-10 shrink-0"></div>
                            <div className="flex-1 flex items-end justify-between border-b border-black pb-2 mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-black">TRACKLIST</span>
                                <span className="text-[10px] font-mono text-neutral-400 text-right w-[80px]">{album.tracks.length} ITEMS</span>
                            </div>
                        </motion.div>
                     )}

                     {album.introContent ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                        >
                            {/* Elegant Divider Line */}
                            <div className="pl-8 md:pl-10 w-full mb-8">
                                <div className="w-full h-px bg-neutral-200" />
                            </div>
                            <SimpleMarkdown content={album.introContent} color={album.color} />
                        </motion.div>
                     ) : (
                         <div className="pl-0 md:pl-10">
                            {album.id === AlbumType.VIDEO ? (
                                // VIDEO GRID - MASONRY
                                // columns-1 md:columns-2
                                <div className="columns-1 md:columns-2 gap-6 pt-4 pl-8 md:pl-0 block">
                                    {album.tracks.map((track, index) => (
                                        <VideoGridItem
                                            key={track.id}
                                            track={track}
                                            index={index}
                                            color={album.color}
                                            onClick={() => setSelectedProject(track)}
                                            delay={400 + (index * 80)}
                                        />
                                    ))}
                                </div>
                            ) : album.id === AlbumType.PHOTO ? (
                                // PHOTO GRID - MASONRY
                                // columns-2 md:columns-3
                                <div className="columns-2 md:columns-3 gap-4 pt-4 pl-8 md:pl-0 block">
                                    {album.tracks.map((track, index) => (
                                        <PhotoGridItem
                                            key={track.id}
                                            track={track}
                                            index={index}
                                            color={album.color}
                                            onClick={() => setSelectedProject(track)}
                                            delay={400 + (index * 80)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                // DEFAULT LIST (WRITING, CODING)
                                album.tracks.map((track, index) => (
                                    <TrackItem 
                                        key={track.id} 
                                        track={track} 
                                        index={index} 
                                        color={album.color}
                                        isHovered={hoveredTrack === track.id}
                                        onHover={setHoveredTrack}
                                        onClick={() => setSelectedProject(track)}
                                        delay={400 + (index * 80)}
                                    />
                                ))
                            )}
                         </div>
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
            color={album.color} 
            onClose={() => setSelectedProject(null)} 
            key="modal"
          />
        )}
      </AnimatePresence>
    </>
  );
};
