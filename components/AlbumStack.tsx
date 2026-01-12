import React, { useRef, useEffect, useState } from "react";
import { Album } from "../types";
import { motion, AnimatePresence } from "framer-motion";

interface AlbumStackProps {
  albums: Album[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onSelect: (index: number) => void;
}

const AlbumStack: React.FC<AlbumStackProps> = ({
  albums,
  currentIndex,
  onIndexChange,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive Layout State with Systematic Metrics
  const [layout, setLayout] = useState({
      mode: 'DESKTOP' as 'MOBILE' | 'TABLET' | 'DESKTOP',
      width: window.innerWidth,
      height: window.innerHeight,
      isShort: window.innerHeight < 600, // New flag for vertical crunch
      // System Metrics
      cardSize: 320,
      xSpacing: 200,
      stageTop: 120,
      stageBottom: 260
  });

  // Drag / Interaction State
  const [dragX, setDragX] = useState(0);
  const isDragging = useRef(false);
  const isPressed = useRef(false);
  const startX = useRef(0);

  useEffect(() => {
    const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        let mode: 'MOBILE' | 'TABLET' | 'DESKTOP' = 'DESKTOP';
        
        if (w < 768) mode = 'MOBILE';
        else if (w < 1280) mode = 'TABLET'; 
        
        // 1. Define The Stage (Safe Zones)
        // Adjust these values to match the actual height of Header and Footer+Title
        const STAGE_TOP = mode === 'MOBILE' ? 100 : 120;
        const STAGE_BOTTOM = mode === 'MOBILE' ? 240 : 260; // Mobile has smaller text, might need less space, but let's be safe
        
        const availableHeight = h - (STAGE_TOP + STAGE_BOTTOM);
        
        // 2. Calculate Systematic Card Size (Bi-axial for ALL modes)
        let cardSize = 0;
        
        // Width Constraint
        const widthBase = mode === 'MOBILE' 
            ? Math.min(280, w * 0.55)
            : Math.min(480, Math.max(300, w * 0.22));
            
        // Height Constraint (Fit to Stage)
        const heightBase = availableHeight * 0.95;
        
        // Final Size: Fit to Box
        // Mobile min: 160, Desktop min: 200
        // Relax minSize on extremely short screens to avoid overlap
        // If screen is short (<600), allow shrinking down to 120px.
        const isShort = h < 600;
        const minSize = isShort ? 120 : (mode === 'MOBILE' ? 160 : 200);
        
        cardSize = Math.max(minSize, Math.min(widthBase, heightBase));

        // 3. Spacing
        let xSpacing = 0;
        if (mode === 'MOBILE') {
            xSpacing = 85; 
        } else {
            xSpacing = cardSize * 0.60;
        }

        setLayout({ 
            mode, 
            width: w, 
            height: h, 
            isShort,
            cardSize, 
            xSpacing,
            stageTop: STAGE_TOP,
            stageBottom: STAGE_BOTTOM
        });
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

  // Layout Logic Check
  const isMobileOrTablet = layout.mode === 'MOBILE' || layout.mode === 'TABLET';

  return (
    <div 
        ref={containerRef}
        className="w-full h-full flex flex-col relative perspective-1000 touch-pan-y overflow-hidden items-center justify-center cursor-grab active:cursor-grabbing"
    onPointerDown={(e) => {
        isPressed.current = true;
        startX.current = e.clientX;
        isDragging.current = false;
        // Important: capture pointer to track movement even if it leaves the element
        (e.target as Element).setPointerCapture(e.pointerId);
    }}
    onPointerMove={(e) => {
        if (!isPressed.current) return;
        const currentX = e.clientX;
        const rawDiff = currentX - startX.current;
        
        // Add rubber-band resistance
        // The drag will asymptotically approach 'limit' (1.5x the card spacing)
        // This prevents the stack from flying off-screen while maintaining 1:1 control for small movements.
        const limit = layout.xSpacing * 1.5;
        const dampedDiff = (rawDiff * limit) / (limit + Math.abs(rawDiff));
        
        setDragX(dampedDiff);

        // Determine if this is a drag or a click
        if (Math.abs(dampedDiff) > 10) {
            isDragging.current = true;
        }
    }}
    onPointerUp={(e) => {
        if (!isPressed.current) return;
        
        isPressed.current = false;
        (e.target as Element).releasePointerCapture(e.pointerId);

        // Threshold for switching
        const THRESHOLD = 50; 

        if (isDragging.current) {
            if (dragX > THRESHOLD && currentIndex > 0) {
                // Dragged Right -> Previous
                onIndexChange(currentIndex - 1);
            } else if (dragX < -THRESHOLD && currentIndex < albums.length - 1) {
                // Dragged Left -> Next
                onIndexChange(currentIndex + 1);
            }
        }
        
        // Reset
        setDragX(0);
        isDragging.current = false;
    }}
    onPointerLeave={() => {
        // Optional: Reset if pointer leaves window, but setPointerCapture usually prevents this need.
        // We'll trust setPointerCapture.
    }}
  >
    {/* 
      Stack Container - UNIFIED STAGE
      All devices use absolute positioning constraints now.
      "No Scroll" philosophy.
    */}
    <div 
      className="absolute w-full flex items-center justify-center transform-style-3d z-10"
      style={{
          top: layout.stageTop,
          bottom: layout.stageBottom
      }}
    >
      <div className="relative w-full h-full flex items-center justify-center transform-style-3d">
          <AnimatePresence initial={false} custom={currentIndex}>
          {albums.map((album, index) => {
              const distance = index - currentIndex;
              const isActive = index === currentIndex;
              
              // Render range logic
              const renderRange = layout.mode === 'MOBILE' ? 1 : 2;
              if (Math.abs(distance) > renderRange) return null; 

              // UX/Physics Constants
              // USE SYSTEMATIC METRICS
              const X_SPACING = layout.xSpacing;
              const Z_DEPTH = layout.mode === 'MOBILE' ? -150 : -200;
              const ROTATION = layout.mode === 'MOBILE' ? -10 : -15; 
              
              return (
              <motion.div
                  key={album.id}
                  onClick={(e) => {
                      if (isDragging.current) {
                          e.stopPropagation();
                          e.preventDefault();
                          return;
                      }
                      handleItemClick(index);
                  }}
                  className="absolute cursor-pointer"
                  initial={false}
                  animate={{
                  x: distance * X_SPACING + dragX, // Add dragX here
                  y: 0,
                  z: isActive ? 0 : Math.abs(distance) * Z_DEPTH,
                  rotateY: distance * ROTATION + (dragX / 20), // Subtle rotation on drag
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
                  Uses INLINE STYLES for dynamic sizing based on system metrics.
                  */}
                  <div 
                      style={{
                          width: layout.cardSize,
                          height: layout.cardSize
                      }}
                      className={`
                          relative z-20
                          bg-[#F9F9F9] rounded-[2px] overflow-hidden group
                          transition-all duration-500 ease-out
                          ring-1 ring-white/20 
                          ${isActive 
                              ? 'shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)]' 
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
                      

                  </div>

                  {/* 
                  THEMED AMBIENT GLOW
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
    </div>

    {/* 
      Active Item Typography 
      Hybrid Approach:
      - Mobile/Tablet: Relative 'pb-20' (Bottom of flow)
      - Desktop: Absolute 'bottom-12' (Pinned to viewport bottom)
    */}
    <div className={`
        pointer-events-none px-6 z-50 text-center
        ${isMobileOrTablet 
           ? 'absolute bottom-32 left-0 right-0' // Now Absolute on Mobile too! "Stage" logic.
           : 'absolute bottom-24 left-0 right-0'
        }
    `}>
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

          <motion.h2 
              className={`
                  ${layout.isShort ? 'text-3xl lg:text-5xl mb-1' : 'text-3xl md:text-5xl lg:text-7xl mb-2'}
                  font-black tracking-[-0.03em] leading-none uppercase
              `}
              animate={{ color: albums[currentIndex].textColor }}
              transition={{ duration: 0.5 }}
          >
              {albums[currentIndex].title}
          </motion.h2>
          
          <motion.p 
              className="text-[10px] md:text-xs lg:text-sm font-medium tracking-widest uppercase mt-3"
              animate={{ color: albums[currentIndex].textColor }}
              style={{ opacity: 0.6 }} // Use opacity for hierarchy instead of grey color
              transition={{ duration: 0.5 }}
          >
              {albums[currentIndex].subtitle}
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
    
  </div>
  );
};

export default AlbumStack;
