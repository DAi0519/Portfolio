
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
      */}
      <div className="relative w-full h-[280px] md:h-[360px] lg:h-[450px] flex items-center justify-center transform-style-3d -mt-16 md:-mt-8 lg:mt-0 z-10">
        <AnimatePresence initial={false} custom={currentIndex}>
          {albums.map((album, index) => {
            const distance = index - currentIndex;
            const isActive = index === currentIndex;
            
            // Render range logic
            const renderRange = layout.mode === 'MOBILE' ? 1 : 2;
            if (Math.abs(distance) > renderRange) return null; 

            // UX/Physics Constants
            const X_SPACING = layout.mode === 'MOBILE' ? 60 : layout.mode === 'TABLET' ? 220 : 320;
            const Z_DEPTH = layout.mode === 'MOBILE' ? -150 : -200;
            const ROTATION = layout.mode === 'MOBILE' ? -10 : -15; 
            
            return (
              <motion.div
                key={album.id}
                onClick={() => handleItemClick(index)}
                className="absolute cursor-pointer"
                initial={false}
                animate={{
                  x: distance * X_SPACING, 
                  y: 0,
                  z: isActive ? 0 : Math.abs(distance) * Z_DEPTH,
                  rotateY: distance * ROTATION, 
                  scale: isActive ? 1.1 : 1 - Math.abs(distance) * 0.1, 
                  opacity: 1, 
                  zIndex: 100 - Math.abs(distance),
                }}
                transition={{
                  type: "spring",
                  stiffness: 150,
                  damping: 20,
                  mass: 0.8
                }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 
                   Card Sizing & Construction
                */}
                <div 
                    className={`
                        relative z-20
                        w-[65vw] h-[65vw] max-w-[300px] max-h-[300px] 
                        md:w-72 md:h-72 
                        lg:w-96 lg:h-96 
                        bg-[#F9F9F9] rounded-[2px] overflow-hidden group
                        transition-all duration-500 ease-out
                        ring-1 ring-white/20 
                        ${isActive 
                            ? 'shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)]' // Reduced black shadow to let color glow breathe
                            : 'shadow-2xl'} 
                    `}
                >
                    {/* Image */}
                    <img 
                        src={album.coverImage} 
                        alt={album.title} 
                        className={`
                          w-full h-full object-cover pointer-events-none select-none transition-all duration-500
                          ${isActive ? 'grayscale-0 contrast-100' : 'grayscale-[0.5] contrast-[0.9]'}
                        `}
                    />
                    
                    {/* Atmospheric Depth Layer */}
                    <div 
                      className={`
                        absolute inset-0 bg-black transition-opacity duration-500 pointer-events-none
                        ${isActive ? 'opacity-0' : 'opacity-40'}
                      `} 
                    />

                    {/* Gloss / Plastic Wrap Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 pointer-events-none mix-blend-overlay z-10" />
                    
                    {/* Subtle Noise Texture */}
                    <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay pointer-events-none z-10" />
                </div>

                {/* 
                   THEMED AMBIENT GLOW (Apple Style)
                   This replaces the physical mirror reflection.
                   It creates a soft, colored light cast on the "floor" matching the album art.
                */}
                <div 
                    className={`
                        absolute -bottom-8 left-6 right-6 h-16 z-10
                        rounded-[100%]
                        blur-[45px]
                        transition-all duration-700 ease-in-out
                        pointer-events-none
                        mix-blend-multiply
                    `}
                    style={{ 
                        backgroundColor: album.color,
                        opacity: isActive ? 0.6 : 0,
                        transform: isActive ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.8)'
                    }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 
        Active Item Typography 
      */}
      <div className="absolute bottom-[10%] md:bottom-[8%] lg:bottom-12 left-0 right-0 text-center pointer-events-none px-6 z-50">
        <AnimatePresence mode="wait">
          <motion.div
             key={currentIndex}
             initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
             animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
             exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
             transition={{ duration: 0.4, ease: "easeOut" }}
             className="flex flex-col items-center"
          >
            {/* Dynamic Color Accent Bar */}
            <div 
                className="w-1 h-8 mb-4 mx-auto transition-colors duration-500"
                style={{ backgroundColor: albums[currentIndex].color }}
            ></div>

            <h2 className="text-3xl md:text-5xl lg:text-7xl font-black tracking-[-0.03em] text-neutral-900 mb-2 leading-none uppercase">
                {albums[currentIndex].title}
            </h2>
            
            <p className="text-[10px] md:text-xs lg:text-sm font-medium text-neutral-500 tracking-widest uppercase mt-3">
                {albums[currentIndex].subtitle}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      
    </div>
  );
};

export default AlbumStack;
