import React, { useEffect, useState, useRef } from 'react';
import { Album, ProjectItem } from '../types';
import { ArrowLeft, X, ExternalLink } from 'lucide-react';
import RecordVinyl from './RecordVinyl';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';

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
        if (!trimmed) return <div key={i} className="h-6" />;
        
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={i} className="text-xl font-black uppercase tracking-widest mt-12 mb-6 border-b pb-4" style={{ borderColor: safeColor }}>
              {trimmed.replace('### ', '')}
            </h3>
          );
        }
        
        if (trimmed.startsWith('---')) {
             return <hr key={i} className="my-12 border-neutral-200" />;
        }

        if (trimmed.startsWith('- ')) {
           const parts = trimmed.replace('- ', '').split('**');
           return (
             <div key={i} className="flex items-start gap-4 my-3 pl-2">
                <span className="mt-[10px] w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: safeColor }} />
                <p className="flex-1 text-neutral-600 leading-relaxed m-0 text-lg">
                   {parts.map((part, idx) => 
                      idx % 2 === 1 ? <strong key={idx} className="font-bold text-neutral-900">{part}</strong> : part
                   )}
                </p>
             </div>
           );
        }

        const parts = trimmed.split('**');
        return (
          <p key={i} className="text-neutral-600 leading-relaxed mb-4 font-normal text-lg">
             {parts.map((part, idx) => 
                idx % 2 === 1 ? <strong key={idx} className="font-bold text-neutral-900">{part}</strong> : part
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: delay / 1000,
            type: "spring",
            stiffness: 400,
            damping: 30
          }}
          className="group flex items-stretch w-full cursor-pointer"
        >
            {/* INDEX COLUMN */}
            <div className="w-8 md:w-10 shrink-0 flex items-center justify-start border-b border-transparent">
                <span 
                    className={`
                       text-[10px] font-mono transition-colors duration-300
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
                <span className="hidden md:block text-[10px] font-mono text-neutral-300 group-hover:text-neutral-500 transition-colors uppercase tracking-wider text-right w-[80px]">
                    {track.date}
                </span>
            </div>
        </motion.div>
    )
}

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
        className="absolute inset-0 bg-neutral-100/80 backdrop-blur-xl"
      />

      <motion.div 
        initial={{ y: "100%", opacity: 0.5, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: "100%", opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 28, stiffness: 300, mass: 0.8 }}
        className="relative w-full md:max-w-xl bg-white shadow-2xl rounded-t-3xl md:rounded-lg overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]"
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

  // Scroll Linked Animations (Mobile Parallax)
  const { scrollY } = useScroll({ container: containerRef });
  
  // Transform scrollY to values
  // Range: 0 to 300px scroll
  const vinylScale = useTransform(scrollY, [0, 300], [1, 0.8]);
  const vinylOpacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  const vinylY = useTransform(scrollY, [0, 300], [0, 50]);
  const vinylBlur = useTransform(scrollY, [0, 300], [0, 10]);

  // Smooth out the transform values with a spring
  // Silkier config: Lower stiffness, adjusted damping for a floaty feel
  const springConfig = { stiffness: 70, damping: 25, mass: 1 };
  
  const smoothScale = useSpring(vinylScale, springConfig);
  const smoothOpacity = useSpring(vinylOpacity, springConfig);
  const smoothY = useSpring(vinylY, springConfig);
  
  // We can't directly use 'filter' in style props as a motion value in older versions, 
  // but let's try standard motion.div style prop.
  // Actually, 'filter' is supported.

  useEffect(() => {
    // Delay the slide-out of the record
    const timer = setTimeout(() => setShowVinyl(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div 
        ref={containerRef}
        className="fixed inset-0 z-50 bg-[#F3F3F1] text-[#111] flex flex-col md:flex-row overflow-y-auto md:overflow-hidden snap-y snap-mandatory scroll-smooth"
      >
        
        {/* Mobile Back Button - Fixed */}
        <button 
          onClick={onClose}
          className="md:hidden fixed top-6 left-6 z-40 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm border border-neutral-100 active:scale-95 transition-transform text-neutral-900"
        >
          <ArrowLeft size={18} />
        </button>

        {/* LEFT COLUMN: VISUALS */}
        <div className="sticky top-0 md:relative w-full md:w-[42%] lg:w-[38%] h-[40vh] md:h-full bg-[#E8E8E6] flex items-center justify-start overflow-hidden shrink-0 shadow-[inset_-1px_0_0_rgba(0,0,0,0.04)] z-0 snap-start">
          
          {/* Vinyl Container with Parallax */}
          <motion.div 
             style={{ 
               scale: smoothScale, 
               opacity: smoothOpacity, 
               y: smoothY 
               // filter: `blur(${useTransform(scrollY, [0, 300], [0, 4])}px)` // simplified for safety
             }}
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
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${backHovered ? 'border-transparent text-white' : 'border-neutral-300 text-neutral-400'}`} style={{ backgroundColor: backHovered ? album.color : 'transparent' }}>
                <ArrowLeft size={14} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${backHovered ? 'text-neutral-900' : 'text-neutral-400'}`}>返回</span>
          </button>
        </div>

        {/* RIGHT COLUMN: Content */}
        <div className="flex-1 w-full h-[100dvh] md:h-full md:overflow-y-auto no-scrollbar relative z-10 bg-[#F3F3F1] snap-start overflow-y-auto">
          <div className="min-h-full py-8 pl-8 pr-16 md:p-16 lg:p-24 flex flex-col justify-start md:justify-center">
              
              {/* Header */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
                className="flex flex-col items-start"
              >
                  <div className="pl-8 md:pl-10 w-full">
                      <h1 className="text-4xl md:text-6xl font-black tracking-[-0.03em] leading-[0.9] text-neutral-900 mb-10 uppercase text-left">
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
                              {album.id} 合集
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
                            <span className="text-[10px] font-bold uppercase tracking-widest text-black">曲目列表</span>
                            <span className="text-[10px] font-mono text-neutral-400 text-right w-[80px]">{album.tracks.length} 项目</span>
                        </div>
                    </motion.div>
                 )}

                 {album.introContent ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        <SimpleMarkdown content={album.introContent} color={album.color} />
                    </motion.div>
                 ) : (
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
          </div>
        </div>
      </div>

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
