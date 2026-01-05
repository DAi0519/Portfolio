import React, { useRef, useEffect, useState } from 'react';
import { Album } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface AlbumStackProps {
  albums: Album[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onSelect: (index: number) => void;
}

const AlbumStack: React.FC<AlbumStackProps> = ({ albums, currentIndex, onIndexChange, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Responsive Layout State
  const [layout, setLayout] = useState({
      mode: 'DESKTOP' as 'MOBILE' | 'TABLET' | 'DESKTOP',
      width: window.innerWidth
  });

  // Touch state
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
        const w = window.innerWidth;
        let mode: 'MOBILE' | 'TABLET' | 'DESKTOP' = 'DESKTOP';
        if (w < 768) mode = 'MOBILE';
        else if (w < 1280) mode = 'TABLET'; // Laptops / Small Desktops
        
        setLayout({ mode, width: w });
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleItemClick = (index: number) => {
    if (index === currentIndex) {
      onSelect(index);
    } else {
      onIndexChange(index);
    }
  };

  // Touch Handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentIndex < albums.length - 1) {
      onIndexChange(currentIndex + 1);
    }

    if (isRightSwipe && currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }

    // Reset
    touchStartX.current = null;
    touchEndX.current = null;
  };
  
  // Wheel / Scroll support
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isScrolling = false;
    let timeoutId: any;

    const handleWheel = (e: WheelEvent) => {
        if (Math.abs(e.deltaY) < 10 && Math.abs(e.deltaX) < 10) return;
        
        e.preventDefault(); 
        
        if (isScrolling) return;
        
        if (Math.abs(e.deltaY) > 20 || Math.abs(e.deltaX) > 20) {
            isScrolling = true;
            
            if (e.deltaY > 0 || e.deltaX > 0) {
                if (currentIndex < albums.length - 1) {
                    onIndexChange(currentIndex + 1);
                }
            } else {
                if (currentIndex > 0) {
                     onIndexChange(currentIndex - 1);
                }
            }

            timeoutId = setTimeout(() => {
                isScrolling = false;
            }, 300);
        }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
        container.removeEventListener('wheel', handleWheel);
        clearTimeout(timeoutId);
    };
  }, [albums.length, currentIndex, onIndexChange]);

  return (
    <div 
        ref={containerRef}
        className="w-full h-full flex flex-col items-center justify-center relative perspective-1000 touch-pan-y overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
      {/* 
        Stack Container
        Adjusted height and margin for better vertical distribution on all screens
      */}
      <div className="relative w-full h-[250px] md:h-[320px] lg:h-[400px] flex items-center justify-center transform-style-3d -mt-24 md:-mt-12 lg:mt-0 z-10 transition-all duration-500">
        <AnimatePresence initial={false} custom={currentIndex}>
          {albums.map((album, index) => {
            const distance = index - currentIndex;
            
            // Render range logic
            const renderRange = layout.mode === 'MOBILE' ? 1 : 2;
            if (Math.abs(distance) > renderRange) return null; 

            // Responsive 3D Params
            let xOffset = 220; // Default Desktop
            let zOffset = -100;
            let rotateAngle = -25;
            let scaleFactor = 0.1;

            if (layout.mode === 'TABLET') {
                xOffset = 140; // Tighter stack for laptops
                rotateAngle = -20;
                scaleFactor = 0.12;
            } else if (layout.mode === 'MOBILE') {
                xOffset = 30; // Very tight for mobile
                zOffset = -80;
                rotateAngle = -5;
                scaleFactor = 0.15;
            }

            return (
              <motion.div
                key={album.id}
                layout
                onClick={() => handleItemClick(index)}
                className="absolute cursor-pointer"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  x: distance * xOffset, 
                  y: Math.abs(distance) * (layout.mode === 'MOBILE' ? 0 : 10),
                  z: Math.abs(distance) * zOffset,
                  rotateY: distance * rotateAngle, 
                  scale: 1 - Math.abs(distance) * scaleFactor,
                  opacity: 1 - Math.abs(distance) * (layout.mode === 'MOBILE' ? 0.5 : 0.2), 
                  zIndex: 100 - Math.abs(distance),
                }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 20,
                  mass: 0.8
                }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 
                   Responsive Card Size 
                   Mobile: 60vw 
                   Tablet (Small Desktop): 260px (Smaller to fit)
                   Desktop: 320px 
                   Large Desktop: 360px
                */}
                <div 
                    className={`
                        w-[60vw] h-[60vw] max-w-[280px] max-h-[280px] 
                        md:w-64 md:h-64 
                        lg:w-80 lg:h-80 
                        xl:w-96 xl:h-96
                        bg-[#f4f4f4] shadow-xl rounded-sm overflow-hidden relative group
                        transition-all duration-500
                        ${index === currentIndex ? 'shadow-[0_20px_40px_-12px_rgba(0,0,0,0.3)]' : 'brightness-95 grayscale-[0.5]'}
                    `}
                >
                    <img 
                        src={album.coverImage} 
                        alt={album.title} 
                        className="w-full h-full object-cover pointer-events-none select-none"
                    />
                    
                    {/* Spine / overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/20 pointer-events-none mix-blend-overlay" />

                    {/* Desktop Metadata Strip */}
                    <div className={`
                        hidden md:block absolute bottom-0 left-0 right-0 p-3 lg:p-4 bg-white/95 backdrop-blur-md border-t border-black/5
                        transition-transform duration-300
                        ${index === currentIndex ? 'translate-y-0' : 'translate-y-full'}
                    `}>
                        <div className="flex justify-between items-end">
                            <div className="overflow-hidden">
                                <h3 className="text-[10px] lg:text-xs font-bold uppercase tracking-widest text-neutral-900 truncate pr-2">{album.title}</h3>
                                <p className="text-[9px] lg:text-[10px] text-neutral-500 font-mono mt-0.5 truncate">{album.subtitle}</p>
                            </div>
                            <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full flex-shrink-0 mb-0.5" style={{ backgroundColor: album.color }} />
                        </div>
                    </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 
        Active Item Typography 
        Positioned relative to viewport height to avoid overlap on short screens.
        Used min-height constraint on screen to prevent overlap.
      */}
      <div className="absolute bottom-[12%] md:bottom-[10%] lg:bottom-16 left-0 right-0 text-center pointer-events-none px-6 z-50">
        <AnimatePresence mode="wait">
          <motion.div
             key={currentIndex}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: -10 }}
             transition={{ duration: 0.2 }}
             className="flex flex-col items-center"
          >
            {/* Fluid typography scaling */}
            <h2 className="text-xl md:text-3xl lg:text-5xl font-bold tracking-tighter text-neutral-900 mb-1 md:mb-2 leading-tight">
                {albums[currentIndex].title}
            </h2>
            
            <div className="flex items-center justify-center gap-3 my-1">
                <div className="w-4 md:w-6 lg:w-10 h-px bg-neutral-300"></div>
                <p className="text-[9px] md:text-[10px] lg:text-xs font-mono text-neutral-500 tracking-widest uppercase truncate max-w-[200px] md:max-w-none">
                    {albums[currentIndex].subtitle}
                </p>
                <div className="w-4 md:w-6 lg:w-10 h-px bg-neutral-300"></div>
            </div>
            
            <p className="mt-4 md:mt-4 lg:mt-6 text-[8px] md:text-[9px] text-neutral-400 font-mono tracking-widest uppercase opacity-60">
                {layout.mode === 'MOBILE' ? 'SWIPE TO BROWSE' : 'USE ARROW KEYS OR DRAG'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      
    </div>
  );
};

export default AlbumStack;