
import React, { useEffect, useState } from 'react';
import { Album, ProjectItem } from '../types';
import { ArrowLeft, X, ExternalLink, ArrowUpRight, Disc } from 'lucide-react';
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
          className={`
            group relative py-4 md:py-5 cursor-pointer transition-all duration-500 border-b border-neutral-100 last:border-0
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
          `}
          style={{ transitionDelay: `${delay}ms` }}
          onMouseEnter={() => onHover(track.id)}
          onMouseLeave={() => onHover(null)}
        >
            {/* Minimal Hover Indicator */}
            <div 
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0 -translate-x-2'}`}
              style={{ backgroundColor: color }}
            />

            <div className="relative flex items-center justify-between gap-4 pl-4 md:pl-6">
                <div className="flex items-center gap-6 md:gap-8 overflow-hidden">
                    {/* Number - Very subtle unless hovered */}
                    <span 
                        className={`
                           text-[10px] font-mono transition-colors duration-300 w-6 shrink-0
                           ${!isHovered ? 'text-neutral-300' : 'font-bold'}
                        `}
                        style={{ color: isHovered ? color : undefined }}
                    >
                        {String(index + 1).padStart(2, '0')}
                    </span>

                    {/* Title - The Hero of the list */}
                    <h3 
                        className="text-lg md:text-xl font-bold tracking-tight text-neutral-900 transition-colors truncate"
                        style={{ color: isHovered ? color : undefined }}
                    >
                         {track.title}
                    </h3>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                    {/* Date - Technical aesthetic */}
                    <span className="text-[10px] font-mono text-neutral-300 group-hover:text-neutral-500 transition-colors uppercase tracking-wider">
                        {track.date}
                    </span>

                    {/* Arrow Action - Only appears on intent */}
                    <div 
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 transform
                          ${isHovered ? 'opacity-100 scale-100 rotate-45' : 'opacity-0 scale-75 rotate-0'}
                        `}
                        style={{ 
                            backgroundColor: color,
                            color: '#fff'
                        }}
                    >
                        <ArrowUpRight size={14} />
                    </div>
                </div>
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
          UPDATED: Narrower column (32%) and left-shifted alignment
        */}
        <div className="relative w-full md:w-[32%] lg:w-[30%] h-[35vh] md:h-full bg-[#E8E8E6] flex items-center justify-start overflow-hidden shrink-0 shadow-[inset_-1px_0_0_rgba(0,0,0,0.04)]">
          
          {/* Texture */}
          <div className="absolute inset-0 bg-noise opacity-30"></div>
          
          {/* Vinyl Container */}
          <div 
             className={`
               relative transition-all duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)]
               ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}
             `}
          >
             {/* 
               Size & Positioning Update:
               - Increased base size slightly for impact
               - Added negative translate-x to crop the sleeve off-screen
             */}
             <div className="w-[60vw] h-[60vw] md:w-[28vw] md:h-[28vw] max-w-[420px] max-h-[420px] relative -translate-x-[20%] md:-translate-x-[45%]">
                <RecordVinyl 
                    album={album} 
                    isActive={showVinyl} 
                    isSpinning={true} 
                    showSleeve={true}
                    layout="FLAT" 
                />
             </div>
             
             {/* 
               Reflection/Shadow 
               - Adjusted position to track the record sliding out to the right
             */}
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
            className="hidden md:flex absolute top-8 left-8 items-center gap-3 px-0 py-2 transition-all group z-20"
          >
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${backHovered ? 'border-transparent text-white' : 'border-neutral-300 text-neutral-400'}`} style={{ backgroundColor: backHovered ? album.color : 'transparent' }}>
                <ArrowLeft size={14} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${backHovered ? 'text-neutral-900' : 'text-neutral-400'}`}>Back</span>
          </button>
        </div>

        {/* RIGHT COLUMN: Content */}
        <div className="flex-1 h-full overflow-y-auto no-scrollbar relative bg-[#F3F3F1]">
          <div className="min-h-full p-8 md:p-16 lg:p-24 flex flex-col justify-start md:justify-center">
              
              {/* Header */}
              <div className={`transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                  {/* Super minimal header */}
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-4">
                      {album.id} Collection
                  </span>

                  <h1 className="text-4xl md:text-6xl font-black tracking-[-0.03em] leading-[0.9] text-neutral-900 mb-12 uppercase">
                      {album.title}
                  </h1>
              </div>

              {/* List */}
              <div className="space-y-0 pb-24">
                 <div className="flex items-end justify-between border-b border-black pb-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black">Tracklist</span>
                    <span className="text-[10px] font-mono text-neutral-400">{album.tracks.length} Items</span>
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
