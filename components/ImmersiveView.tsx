
import React, { useEffect, useState } from 'react';
import { Album, ProjectItem } from '../types';
import { ArrowLeft, X, ExternalLink, Calendar, ArrowUpRight } from 'lucide-react';
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
            group block relative py-6 md:py-8 cursor-pointer transition-all duration-500
            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
          style={{ transitionDelay: `${delay}ms` }}
          onMouseEnter={() => onHover(track.id)}
          onMouseLeave={() => onHover(null)}
        >
            {/* Hover Background Pill */}
            <div 
              className={`absolute inset-0 -mx-4 md:-mx-6 rounded-xl bg-gray-100/50 scale-95 opacity-0 transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : ''}`} 
            />

            <div className="relative flex items-start md:items-center gap-6 md:gap-10">
                {/* Number */}
                <span 
                    className={`
                       text-xs font-mono font-medium transition-colors duration-300 w-8 pt-1 md:pt-0
                       ${!isHovered ? 'text-neutral-400' : 'font-bold'}
                    `}
                    style={{ color: isHovered ? color : undefined }}
                >
                    {String(index + 1).padStart(2, '0')}
                </span>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-6 items-center">
                    {/* Title */}
                    <div className="md:col-span-6">
                        <h3 
                            className="text-xl md:text-2xl font-bold tracking-tight text-neutral-900 transition-colors"
                            style={{ color: isHovered ? color : undefined }}
                        >
                             {track.title}
                        </h3>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-4 hidden md:block">
                        <p className="text-sm text-neutral-500 line-clamp-1 group-hover:text-neutral-800 transition-colors font-medium">
                            {track.description}
                        </p>
                    </div>

                    {/* Date */}
                    <div className="md:col-span-2 text-right">
                        <span className="text-[11px] font-mono text-neutral-400 group-hover:text-neutral-600 transition-colors uppercase tracking-wider">
                            {track.date}
                        </span>
                    </div>
                </div>

                {/* Arrow Action */}
                <div 
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 transform hidden md:flex
                      ${isHovered ? 'text-white scale-100 shadow-lg' : 'bg-transparent text-neutral-300 scale-90'}
                    `}
                    style={{ 
                        backgroundColor: isHovered ? color : 'transparent',
                        boxShadow: isHovered ? `0 10px 15px -3px ${color}33` : 'none' 
                    }}
                >
                    <ArrowUpRight size={18} strokeWidth={isHovered ? 2.5 : 2} />
                </div>
            </div>

            <p className="md:hidden mt-2 ml-14 text-xs text-neutral-500 line-clamp-2 leading-relaxed">
                {track.description}
            </p>
            
            {/* Divider */}
            <div className={`absolute bottom-0 left-14 right-0 h-px bg-neutral-200 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`} />
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
      
      {/* Backdrop with stronger blur */}
      <div 
        onClick={handleClose}
        className={`absolute inset-0 bg-neutral-900/40 backdrop-blur-md transition-all duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Modal Card */}
      <div className={`
        relative w-full md:max-w-2xl bg-[#FDFDFD] shadow-2xl rounded-t-3xl md:rounded-2xl overflow-hidden flex flex-col 
        max-h-[90vh] md:max-h-[85vh]
        transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1) transform origin-bottom
        ${active ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-full md:translate-y-12 opacity-0 md:scale-95'}
      `}>
         
         {/* Mobile Pull Handle */}
         <div className="md:hidden w-full flex justify-center pt-4 pb-2 absolute top-0 z-20 pointer-events-none" onClick={handleClose}>
             <div className="w-12 h-1 bg-white/50 backdrop-blur rounded-full shadow-sm"></div>
         </div>

         {/* Close Button */}
         <button 
           onClick={handleClose}
           className="hidden md:flex absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md hover:bg-white items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 group"
         >
           <X size={20} className="text-neutral-500 group-hover:text-black transition-colors" />
         </button>

         {/* Image Header - Immersive */}
         {project.imageUrl && (
           <div className="w-full h-64 md:h-80 bg-neutral-100 relative shrink-0">
             <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
           </div>
         )}

         {/* Content Body */}
         <div className="p-8 md:p-12 overflow-y-auto bg-[#FDFDFD]">
            <div className="flex flex-wrap gap-2 mb-6">
               {project.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 bg-neutral-100 rounded-full text-[10px] uppercase font-bold tracking-widest text-neutral-600 border border-neutral-200">
                    {tag}
                  </span>
               ))}
            </div>

            <h2 className="text-3xl md:text-5xl font-black text-neutral-900 mb-6 tracking-tighter leading-[1.1]">
              {project.title}
            </h2>

            {/* Dynamic Accent Line */}
            <div 
                className="w-16 h-1.5 mb-8"
                style={{ backgroundColor: color }}
            ></div>

            <div className="prose prose-neutral prose-lg max-w-none">
                <p className="text-neutral-600 leading-relaxed font-light text-lg md:text-xl">
                {project.description}
                </p>
                <p className="text-neutral-500 text-base leading-relaxed mt-4">
                    This project exemplifies the intersection of utility and aesthetics. By focusing on core functionality and stripping away the non-essential, we arrive at a solution that is both pure and potent. 
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row items-center gap-4 mt-12 pt-8 border-t border-neutral-100 pb-safe">
               <a 
                 href={project.link || "#"}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="w-full md:w-auto flex-1 text-white py-4 px-8 rounded-full text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                 style={{ 
                    backgroundColor: color,
                    boxShadow: `0 10px 15px -3px ${color}40`
                 }}
               >
                 View Live <ExternalLink size={16} />
               </a>
               <button 
                 onClick={handleClose}
                 className="w-full md:w-auto px-8 py-4 rounded-full border border-neutral-200 text-neutral-600 text-sm font-bold uppercase tracking-widest hover:border-neutral-900 hover:text-neutral-900 transition-colors bg-white hover:bg-neutral-50"
               >
                 Close View
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
  const [backHovered, setBackHovered] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    return () => setMounted(false);
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-[#F3F3F1] text-[#111] flex flex-col md:flex-row overflow-hidden">
        
        {/* Mobile Back Button */}
        <button 
          onClick={onClose}
          className="md:hidden absolute top-6 left-6 z-40 w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg border border-neutral-100 active:scale-95 transition-transform text-neutral-900"
        >
          <ArrowLeft size={20} />
        </button>

        {/* LEFT COLUMN: Visuals (Sticky Vinyl) */}
        <div className="relative w-full md:w-[45%] lg:w-[42%] h-[40vh] md:h-full bg-[#EAEAEA] flex items-center justify-center overflow-hidden shrink-0 shadow-[inset_-1px_0_0_rgba(0,0,0,0.05)]">
          
          {/* Vinyl Container */}
          <div className={`
             relative transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
             ${mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-90'}
             w-[70vw] h-[70vw] md:w-[32vw] md:h-[32vw] lg:w-[30vw] lg:h-[30vw] max-w-[500px] max-h-[500px]
             shadow-2xl rounded-full
          `}>
             <RecordVinyl 
                album={album} 
                isActive={true} 
                isSpinning={true} 
                showSleeve={true}
                layout="FLAT" 
             />
          </div>

          {/* Desktop Back Button (Dynamic Hover) */}
          <button 
            onClick={onClose}
            onMouseEnter={() => setBackHovered(true)}
            onMouseLeave={() => setBackHovered(false)}
            className="hidden md:flex absolute top-10 left-10 items-center gap-3 px-5 py-2.5 bg-white/80 backdrop-blur-sm border border-neutral-200 rounded-full transition-all group shadow-sm hover:shadow-lg"
            style={{
                backgroundColor: backHovered ? album.color : 'rgba(255, 255, 255, 0.8)',
                color: backHovered ? '#fff' : 'inherit',
                borderColor: backHovered ? album.color : '#e5e5e5'
            }}
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Archive</span>
          </button>
        </div>

        {/* RIGHT COLUMN: Content */}
        <div className="flex-1 h-full overflow-y-auto no-scrollbar relative bg-[#F3F3F1]">
          <div className="min-h-full p-8 md:p-16 lg:p-24 flex flex-col justify-start md:justify-center">
              
              {/* Header */}
              <div className={`transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                  <div className="flex items-center gap-4 mb-6 md:mb-8">
                      <span className="px-3 py-1 border border-neutral-900 rounded-full text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-neutral-900">
                          {album.id}
                      </span>
                      <div className="h-px flex-1 bg-neutral-300"></div>
                  </div>

                  {/* Adaptive Text Sizing */}
                  <h1 className="text-5xl md:text-6xl lg:text-8xl font-black tracking-[-0.04em] leading-[0.9] text-neutral-900 mb-4 uppercase">
                      {album.title.split(' ').map((word, i) => (
                          <span key={i} className="block">{word}</span>
                      ))}
                  </h1>
                  
                  <p className="text-neutral-500 font-normal text-lg md:text-xl lg:text-2xl max-w-lg leading-relaxed mb-12 md:mb-16 tracking-tight">
                     {album.subtitle}.
                  </p>
              </div>

              {/* List */}
              <div className="space-y-0 pb-24">
                 <div className="flex items-end justify-between border-b-2 border-black pb-4 mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-black">Index</span>
                    <span className="text-[10px] font-mono text-neutral-400">VOL. {album.tracks.length}</span>
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
                        delay={250 + (index * 100)}
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
