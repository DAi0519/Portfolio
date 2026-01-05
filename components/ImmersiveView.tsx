import React, { useEffect, useState } from 'react';
import { Album, ProjectItem } from '../types';
import { ArrowLeft, Play, X, ExternalLink, Calendar, ArrowUpRight } from 'lucide-react';
import RecordVinyl from './RecordVinyl';

interface ImmersiveViewProps {
  album: Album;
  onClose: () => void;
}

// Sub-components defined before use to avoid any hoisting confusion
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
            group block relative border-b border-neutral-200 py-4 md:py-5 lg:py-6 transition-all duration-500 cursor-pointer
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            hover:border-neutral-400 hover:bg-white/50
          `}
          style={{ transitionDelay: `${delay}ms` }}
          onMouseEnter={() => onHover(track.id)}
          onMouseLeave={() => onHover(null)}
        >
            <div className="flex items-start md:items-center gap-4 md:gap-6 lg:gap-8">
                <span className="text-xs md:text-sm font-mono font-bold text-neutral-300 group-hover:text-neutral-900 transition-colors w-6 pt-1 md:pt-0">
                    {String(index + 1).padStart(2, '0')}
                </span>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-4 items-center">
                    <div className="md:col-span-5">
                        <h3 className="text-base md:text-lg lg:text-xl font-bold tracking-tight text-neutral-800 group-hover:text-neutral-900 flex items-center gap-2">
                             {track.title}
                        </h3>
                    </div>

                    <div className="md:col-span-5 hidden md:block">
                        <p className="text-xs lg:text-sm text-neutral-500 line-clamp-1 group-hover:text-neutral-700 transition-colors">
                            {track.description}
                        </p>
                    </div>

                    <div className="md:col-span-2 text-right">
                        <span className="text-[10px] md:text-[11px] lg:text-xs font-mono text-neutral-400 uppercase">
                            {track.date}
                        </span>
                    </div>
                </div>

                <div 
                    className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-300 opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 hidden md:flex"
                    style={{ borderColor: isHovered ? color : '', color: isHovered ? color : '' }}
                >
                    <ArrowUpRight size={14} />
                </div>
            </div>

            <p className="md:hidden mt-2 ml-10 text-[10px] text-neutral-500 line-clamp-2">
                {track.description}
            </p>
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
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-end md:justify-center p-0 md:p-8">
      
      {/* Backdrop */}
      <div 
        onClick={handleClose}
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Modal Card / Bottom Sheet */}
      <div className={`
        relative w-full md:max-w-xl lg:max-w-2xl bg-[#fcfcfc] shadow-2xl rounded-t-2xl md:rounded-sm overflow-hidden flex flex-col 
        max-h-[85vh] md:max-h-[80vh]
        transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) transform
        ${active ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full md:translate-y-8 opacity-0 md:scale-95'}
      `}>
         
         {/* Mobile Pull Handle */}
         <div className="md:hidden w-full flex justify-center pt-3 pb-1" onClick={handleClose}>
             <div className="w-12 h-1.5 bg-neutral-200 rounded-full"></div>
         </div>

         {/* Close Button (Desktop Only) */}
         <button 
           onClick={handleClose}
           className="hidden md:flex absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/50 hover:bg-white backdrop-blur items-center justify-center border border-transparent hover:border-neutral-200 transition-all active:scale-95"
         >
           <X size={16} className="text-neutral-800" />
         </button>

         {/* Image Header */}
         {project.imageUrl && (
           <div className="w-full h-48 md:h-56 lg:h-64 bg-neutral-100 relative shrink-0">
             <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
           </div>
         )}

         {/* Content Body */}
         <div className="p-6 md:p-8 overflow-y-auto">
            <div className="flex flex-wrap gap-2 mb-4">
               {project.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 border border-neutral-200 rounded text-[10px] uppercase font-mono tracking-wide text-neutral-500">
                    {tag}
                  </span>
               ))}
               <span className="px-2 py-0.5 flex items-center gap-1 text-[10px] uppercase font-mono tracking-wide text-neutral-400 ml-auto">
                  <Calendar size={10} /> {project.date}
               </span>
            </div>

            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-neutral-900 mb-4 tracking-tight leading-tight">
              {project.title}
            </h2>

            <div className="w-10 h-1 bg-neutral-200 mb-6" style={{ backgroundColor: color }}></div>

            <p className="text-neutral-600 leading-relaxed text-sm md:text-base mb-8">
               {project.description}
               <br/><br/>
               (Placeholder for extended project content. In a real scenario, this would contain detailed case studies, additional images, or code snippets fetched from a CMS.)
            </p>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-auto pt-4 border-t border-neutral-100 pb-safe">
               <a 
                 href={project.link || "#"}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex-1 bg-neutral-900 text-white py-3 md:py-3 px-6 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors"
               >
                 Open Project <ExternalLink size={14} />
               </a>
               <button 
                 onClick={handleClose}
                 className="hidden md:block px-6 py-3 rounded-sm border border-neutral-200 text-neutral-600 text-xs font-bold uppercase tracking-widest hover:border-neutral-400 hover:text-neutral-900 transition-colors"
               >
                 Close
               </button>
            </div>
         </div>
      </div>
    </div>
  );
};

export const ImmersiveView: React.FC<ImmersiveViewProps> = ({ album, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    return () => setMounted(false);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#f4f4f4] text-[#1a1a1a] flex flex-col md:flex-row overflow-hidden">
        
        {/* Mobile Back Button */}
        <button 
          onClick={onClose}
          className="md:hidden absolute top-4 left-4 z-40 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-sm border border-neutral-200 active:scale-95 transition-transform"
        >
          <ArrowLeft size={18} />
        </button>

        {/* LEFT COLUMN: Visuals */}
        <div className="relative w-full md:w-[42%] lg:w-[40%] h-[40vh] md:h-full bg-[#ebebeb] flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-neutral-200 shrink-0">
          
          {/* Background Text Decor */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03]">
             <span className="text-[40vh] font-black leading-none tracking-tighter rotate-90 md:rotate-0">
               {album.id.substring(0, 2)}
             </span>
          </div>

          {/* Vinyl */}
          <div className={`
             relative transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
             ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}
             w-[65vw] h-[65vw] md:w-[28vw] md:h-[28vw] lg:w-[28vw] lg:h-[28vw] max-w-[400px] max-h-[400px]
          `}>
             <RecordVinyl 
                album={album} 
                isActive={true} 
                isSpinning={true} 
                showSleeve={true}
                layout="FLAT" 
             />
          </div>

          {/* Desktop Back Button */}
          <button 
            onClick={onClose}
            className="hidden md:flex absolute top-8 left-8 items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-full hover:bg-neutral-900 hover:text-white hover:border-neutral-900 transition-all group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Back to Archive</span>
          </button>
        </div>

        {/* RIGHT COLUMN: Content */}
        <div className="flex-1 h-full overflow-y-auto no-scrollbar relative bg-[#f4f4f4]">
          <div className="min-h-full p-6 md:p-10 lg:p-20 flex flex-col justify-start md:justify-center">
              
              {/* Header */}
              <div className={`transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <span className="px-2 py-0.5 border border-neutral-300 rounded text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                          {album.id} COLLECTION
                      </span>
                      <div className="h-px flex-1 bg-neutral-200"></div>
                  </div>

                  {/* Adaptive Text Sizing */}
                  <h1 className="text-4xl md:text-5xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.9] text-neutral-900 mb-2 md:mb-4 uppercase">
                      {album.title.split(' ').map((word, i) => (
                          <span key={i} className="block">{word}</span>
                      ))}
                  </h1>
                  
                  <p className="text-neutral-500 font-medium text-xs md:text-sm lg:text-lg max-w-md leading-relaxed mb-8 md:mb-12">
                     {album.subtitle}. <br/>
                     <span className="text-[10px] md:text-xs text-neutral-400 font-normal">
                         Select a track to preview details.
                     </span>
                  </p>
              </div>

              {/* List */}
              <div className="space-y-0 pb-20">
                 <div className="flex items-end justify-between border-b-2 border-neutral-900 pb-2 mb-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-neutral-900">Project List</span>
                    <span className="text-[10px] font-mono text-neutral-400">{album.tracks.length} ITEMS</span>
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
                        delay={200 + (index * 100)}
                        mounted={mounted}
                     />
                 ))}
              </div>
          </div>
        </div>
      </div>

      {/* PROJECT MODAL (Floating Bottom Sheet on Mobile/Tablet) */}
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