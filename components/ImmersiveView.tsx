
import React, { useEffect, useState } from 'react';
import { Album, ProjectItem } from '../types';
import { ArrowLeft, X, ExternalLink } from 'lucide-react';
import RecordVinyl from './RecordVinyl';

interface ImmersiveViewProps {
  album: Album;
  onClose: () => void;
}

const TrackItem: React.FC<{
    track: ProjectItem;
    index: number;
    color: string;
    isHovered: boolean;
    onHover: (id: string | null) => void;
    onClick: () => void;
    delay: number;
    mounted: boolean;
}> = ({ track, index, color, isHovered, onHover, onClick, delay, mounted }) => {
    return (
        <div 
          onClick={onClick}
          onMouseEnter={() => onHover(track.id)}
          onMouseLeave={() => onHover(null)}
          className={`
            group flex items-stretch w-full cursor-pointer
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: `${delay}ms` }}
        >
            {/* 
              INDEX COLUMN
              Reduced width to bring index closer to title.
              w-8 (32px) on mobile, w-10 (40px) on desktop.
            */}
            <div className="w-8 md:w-10 shrink-0 flex items-center justify-start border-b border-transparent">
                <span 
                    className={`
                       text-[10px] font-mono transition-colors duration-300
                       ${!isHovered ? 'text-neutral-300' : 'font-bold'}
                    `}
                    style={{ color: isHovered ? color : undefined }}
                >
                    {String(index + 1).padStart(2, '0')}
                </span>
            </div>

            {/* 
              MAIN CONTENT AREA (Underlined)
              Includes: Title, Date
              Aligns with the 'Tracklist' header and Main Title above.
            */}
            <div className="flex-1 flex items-center justify-between py-5 border-b border-neutral-200 transition-colors duration-500 group-hover:border-neutral-300">
                
                {/* Title */}
                <h3 
                    className="text-lg md:text-xl font-bold tracking-tight text-neutral-900 transition-colors truncate pr-4"
                    style={{ color: isHovered ? color : undefined }}
                >
                     {track.title}
                </h3>

                {/* Date - Aligned to the right */}
                <span className="hidden md:block text-[10px] font-mono text-neutral-300 group-hover:text-neutral-500 transition-colors uppercase tracking-wider text-right w-[80px]">
                    {track.date}
                </span>
            </div>
        </div>
    )
}

const ProjectModal: React.FC<{
  project: ProjectItem;
  color: string;
  onClose: () => void;
}> = ({ project, color, onClose }) => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setActive(true));
  }, []);

  const handleClose = () => {
    setActive(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-end md:justify-center p-0 md:p-6 lg:p-12">
      
      {/* Backdrop */}
      <div 
        onClick={handleClose}
        className={`absolute inset-0 bg-neutral-100/80 backdrop-blur-xl transition-all duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Modal Card */}
      <div className={`
        relative w-full md:max-w-xl bg-white shadow-2xl rounded-t-3xl md:rounded-lg overflow-hidden flex flex-col 
        max-h-[90vh] md:max-h-[85vh]
        transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1) transform origin-bottom
        ${active ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full md:translate-y-12 opacity-0 md:scale-95'}
      `}>
         
         {/* Mobile Pull Handle */}
         <div className="md:hidden w-full flex justify-center pt-4 pb-2 absolute top-0 z-20 pointer-events-none" onClick={handleClose}>
             <div className="w-12 h-1 bg-black/10 rounded-full"></div>
         </div>

         {/* Close Button */}
         <button 
           onClick={handleClose}
           className="hidden md:flex absolute top-6 right-6 z-20 w-8 h-8 rounded-full bg-white/50 hover:bg-neutral-100 items-center justify-center transition-all group"
         >
           <X size={16} className="text-neutral-400 group-hover:text-black transition-colors" />
         </button>

         {/* Image Header */}
         {project.imageUrl && (
           <div className="w-full h-56 md:h-72 bg-neutral-50 relative shrink-0 grayscale hover:grayscale-0 transition-all duration-700">
             <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
           </div>
         )}

         {/* Content Body */}
         <div className="p-8 md:p-10 overflow-y-auto bg-white">
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
                style={{ backgroundColor: color }}
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
                   style={{ backgroundColor: color }}
                 >
                   View <ExternalLink size={12} />
                 </a>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

export const ImmersiveView: React.FC<ImmersiveViewProps> = ({ album, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [showVinyl, setShowVinyl] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [backHovered, setBackHovered] = useState(false);

  useEffect(() => {
    // Staggered entrance
    requestAnimationFrame(() => setMounted(true));
    // Delay the slide-out of the record to mimic pulling it out
    const timer = setTimeout(() => setShowVinyl(true), 600);
    return () => {
        setMounted(false);
        clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#F3F3F1] text-[#111] flex flex-col md:flex-row overflow-hidden">
        
        {/* Mobile Back Button */}
        <button 
          onClick={onClose}
          className="md:hidden absolute top-6 left-6 z-40 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm border border-neutral-100 active:scale-95 transition-transform text-neutral-900"
        >
          <ArrowLeft size={18} />
        </button>

        {/* 
          LEFT COLUMN: The "Now Playing" Display 
          UPDATED: Increased width (32% -> 42%) to give the record more breathing room
        */}
        <div className="relative w-full md:w-[42%] lg:w-[38%] h-[40vh] md:h-full bg-[#E8E8E6] flex items-center justify-start overflow-hidden shrink-0 shadow-[inset_-1px_0_0_rgba(0,0,0,0.04)]">
          
          {/* Texture */}
          <div className="absolute inset-0 bg-noise opacity-30"></div>
          
          {/* Vinyl Container */}
          <div 
             className={`
               relative transition-all duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)]
               ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}
             `}
          >
             {/* Adjusted positioning to account for wider column */}
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
          </div>

          {/* Desktop Back Button */}
          <button 
            onClick={onClose}
            onMouseEnter={() => setBackHovered(true)}
            onMouseLeave={() => setBackHovered(false)}
            className="hidden md:flex absolute top-10 left-10 items-center gap-3 px-0 py-2 transition-all group z-20"
          >
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${backHovered ? 'border-transparent text-white' : 'border-neutral-300 text-neutral-400'}`} style={{ backgroundColor: backHovered ? album.color : 'transparent' }}>
                <ArrowLeft size={14} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${backHovered ? 'text-neutral-900' : 'text-neutral-400'}`}>Back</span>
          </button>
        </div>

        {/* RIGHT COLUMN: Content */}
        <div className="flex-1 h-full overflow-y-auto no-scrollbar relative bg-[#F3F3F1]">
          {/* 
            UPDATED PADDING LOGIC for Mobile Centering:
            py-8: Vertical padding
            pl-8 (32px): Left Padding + Track Index/Indent (32px) = 64px visual gap from left
            pr-16 (64px): Right Padding = 64px visual gap from right
            This balances the text content content in the viewport.
          */}
          <div className="min-h-full py-8 pl-8 pr-16 md:p-16 lg:p-24 flex flex-col justify-start md:justify-center">
              
              {/* Header */}
              <div className={`transition-all duration-700 delay-100 flex flex-col items-start ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                  
                  {/* 
                     Indented Title Block
                     Updated padding-left (pl-8 md:pl-10) to match the new narrower index column width.
                  */}
                  <div className="pl-8 md:pl-10 w-full">
                      {/* Title: Adjusted margin bottom (mb-10) */}
                      <h1 className="text-4xl md:text-6xl font-black tracking-[-0.03em] leading-[0.9] text-neutral-900 mb-10 uppercase text-left">
                          {album.title}
                      </h1>

                      {/* Subtitle / Technical Label: Minimalist Swiss Style */}
                      <div className="mb-10 flex items-center">
                        <div className="flex items-center gap-3 select-none group">
                           {/* Geometric Color Indicator (Restrained, Sharp) */}
                           <div 
                              className="w-2 h-2 shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-110" 
                              style={{ backgroundColor: album.color }}
                           ></div>
                           
                           {/* Technical Divider */}
                           <div className="w-px h-3 bg-neutral-300"></div>

                           {/* Monospace Metadata Label */}
                           <span className="text-[10px] font-mono font-medium uppercase tracking-[0.25em] text-neutral-500">
                              {album.id} Collection
                           </span>
                        </div>
                      </div>
                  </div>
              </div>

              {/* List */}
              <div className="space-y-0 pb-24">
                 {/* 
                   List Header 
                 */}
                 <div className="flex w-full mb-0">
                    {/* Spacer matches Index Column width (w-8 md:w-10) */}
                    <div className="w-8 md:w-10 shrink-0"></div>
                    
                    {/* Content Header (Aligned with track title) */}
                    <div className="flex-1 flex items-end justify-between border-b border-black pb-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black">Tracklist</span>
                        {/* Aligned to the right of the underlined area */}
                        <span className="text-[10px] font-mono text-neutral-400 text-right w-[80px]">{album.tracks.length} Items</span>
                    </div>
                 </div>

                 {album.tracks.map((track, index) => (
                     <TrackItem 
                        key={track.id} 
                        track={track} 
                        index={index} 
                        color={album.color}
                        isHovered={hoveredTrack === track.id}
                        onHover={setHoveredTrack}
                        onClick={() => setSelectedProject(track)}
                        delay={200 + (index * 80)}
                        mounted={mounted}
                     />
                 ))}
              </div>
          </div>
        </div>
      </div>

      {/* PROJECT MODAL */}
      {selectedProject && (
        <ProjectModal 
          project={selectedProject} 
          color={album.color} 
          onClose={() => setSelectedProject(null)} 
        />
      )}
    </>
  );
};
