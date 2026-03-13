import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Album } from "../types";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface AlbumStackProps {
  albums: Album[];
  currentIndex: number;
  maxIndex: number;
  onIndexChange: (index: number) => void;
  onSelect: (index: number) => void;
}

const AlbumStack: React.FC<AlbumStackProps> = ({
  albums,
  currentIndex,
  maxIndex,
  onIndexChange,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleMeasureRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = useReducedMotion();
  const [measuredTitleHeight, setMeasuredTitleHeight] = useState(160);

  // Responsive Layout State with Systematic Metrics
  const [layout, setLayout] = useState({
      mode: 'DESKTOP' as 'MOBILE' | 'TABLET' | 'DESKTOP',
      width: window.innerWidth,
      height: window.innerHeight,
      isShort: window.innerHeight < 600,
      showTitle: true,
      titleScale: 1,
      cardSize: 320,
      xSpacing: 200,
      stageTop: 120,
      stageBottom: 260,
      titleTop: 520,
  });
  const subtitleFontSize =
    layout.mode === "MOBILE"
      ? "clamp(0.78rem, 2vmin, 0.98rem)"
      : "clamp(0.85rem, 2.2vmin, 1.1rem)";

  // Drag / Interaction State
  const [dragX, setDragX] = useState(0);
  const isDragging = useRef(false);
  const isPressed = useRef(false);
  const startX = useRef(0);

  useLayoutEffect(() => {
    const node = titleMeasureRef.current;
    if (!node) return;

    const updateHeight = () => {
      const nextHeight = Math.ceil(node.getBoundingClientRect().height);
      if (nextHeight > 0) {
        setMeasuredTitleHeight((prev) => (Math.abs(prev - nextHeight) > 1 ? nextHeight : prev));
      }
    };

    const rafId = window.requestAnimationFrame(updateHeight);
    const observer = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => updateHeight())
      : null;

    observer?.observe(node);
    window.addEventListener("resize", updateHeight);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [currentIndex, albums]);

  useEffect(() => {
    const handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;

        let mode: 'MOBILE' | 'TABLET' | 'DESKTOP' = 'DESKTOP';
        if (w < 768) mode = 'MOBILE';
        else if (w < 1280) mode = 'TABLET';
        const isNarrowMobile = mode === 'MOBILE' && w < 430;
        const isDesktop = mode === 'DESKTOP';

        // ─── Constants ───────────────────────────────────────────
        const PREFERRED_GAP     = isNarrowMobile ? 24 : mode === 'MOBILE' ? 32 : 48;
        const MAX_GAP           = isNarrowMobile ? 44 : mode === 'MOBILE' ? 60 : 100;
        const fallbackTitleH    = isNarrowMobile ? 124 : mode === 'MOBILE' ? 140 : 160;
        const baseTitleHeight   = Math.max(fallbackTitleH, measuredTitleHeight);
        const MIN_TITLE_SCALE   = isNarrowMobile ? 0.76 : mode === 'MOBILE' ? 0.72 : 0.8;
        const HEADER_CLEAR     = mode === 'MOBILE' ? 78  : 96;   // bottom edge of top bar safe zone
        const FOOTER_CLEAR     = mode === 'MOBILE' ? 74  : 88;   // top edge of bottom bar safe zone
        const TOP_BOTTOM_RATIO = isNarrowMobile ? 1.34 : mode === 'MOBILE' ? 1.12 : isDesktop ? 1.18 : 1.1; // top whitespace > bottom whitespace

        // ─── Card size (width-driven, not stage-driven) ───────────
        const widthBase = mode === 'MOBILE'
            ? Math.min(280, w * 0.55)
            : Math.min(480, Math.max(300, w * 0.22));
        const minCardFloor = mode === 'MOBILE' ? 120 : mode === 'TABLET' ? 176 : 192;
        const availableVertical = h - HEADER_CLEAR - FOOTER_CLEAR;

        // ─── Adaptive priority: shrink typography first, hide it second, shrink cover last ───
        let showTitle = true;
        let titleScale = 1;
        let gap = PREFERRED_GAP;
        let cardSize = widthBase;

        const titleSpaceAtFull = availableVertical - cardSize - gap;
        if (titleSpaceAtFull < baseTitleHeight) {
          const scaleCandidate = titleSpaceAtFull / baseTitleHeight;
          if (scaleCandidate >= MIN_TITLE_SCALE) {
            titleScale = scaleCandidate;
          } else {
            showTitle = false;
            titleScale = 0;
            gap = 0;
          }
        }

        if (!showTitle && availableVertical < cardSize) {
          cardSize = Math.min(widthBase, availableVertical);
        }

        const isShort  = availableVertical < minCardFloor || h < 440;

        if (isShort) {
            const stageHeight = Math.max(0, h - 80 - 60);
            const cardSize  = Math.min(
              Math.max(120, Math.min(widthBase, h * 0.55)),
              stageHeight,
            );
            const xSpacing  = mode === 'MOBILE' ? 85 : cardSize * 0.60;
            setLayout({ mode, width: w, height: h, isShort, showTitle: false, titleScale: 0, cardSize, xSpacing,
                stageTop: 80, stageBottom: 60, titleTop: h });
            return;
        }

        if (!showTitle) {
          cardSize = Math.max(minCardFloor, Math.min(cardSize, availableVertical));
        }

        const visibleTitleHeight = showTitle ? baseTitleHeight * titleScale : 0;
        let remainingAfterUnit = Math.max(
          0,
          availableVertical - cardSize - visibleTitleHeight - gap,
        );

        if (showTitle && remainingAfterUnit > 0) {
          const gapBoost = Math.min(MAX_GAP - gap, Math.round(remainingAfterUnit * 0.22));
          gap += gapBoost;
          remainingAfterUnit -= gapBoost;
        }

        // ─── Bias remaining whitespace so the top breathes more than the bottom ───
        const unitH   = cardSize + gap + visibleTitleHeight;
        const remainingWhitespace = Math.max(0, availableVertical - unitH);
        const bottomWhitespace = Math.round(remainingWhitespace / (1 + TOP_BOTTOM_RATIO));
        const topWhitespace = remainingWhitespace - bottomWhitespace;
        const unitTop = HEADER_CLEAR + topWhitespace;

        // Stage = card slot only (card is centered within it by flexbox)
        const stageTop    = unitTop;
        const stageBottom = h - unitTop - cardSize;
        const titleTop    = unitTop + cardSize + gap;

        const xSpacing = mode === 'MOBILE' ? 85 : cardSize * 0.60;

        setLayout({ mode, width: w, height: h, isShort, showTitle, titleScale, cardSize, xSpacing,
            stageTop, stageBottom, titleTop });
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [measuredTitleHeight]);

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
                if (currentIndex < maxIndex) {
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
  }, [currentIndex, maxIndex, onIndexChange]);

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
        // Lowered to 15 to account for the heavy damping formula and improve mobile sensitivity
        const THRESHOLD = 15; 

        if (isDragging.current) {
            if (dragX > THRESHOLD && currentIndex > 0) {
                // Dragged Right -> Previous
                onIndexChange(currentIndex - 1);
            } else if (dragX < -THRESHOLD && currentIndex < maxIndex) {
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
                  transition={prefersReducedMotion ? { duration: 0 } : layout.mode === 'MOBILE' ? {
                      type: "spring",
                      stiffness: 250,
                      damping: 30,
                      mass: 0.8
                  } : {
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
                          height: layout.cardSize,
                          backgroundColor: album.color
                      }}
                      className={`
                          relative z-20
                          rounded-[2px] overflow-hidden group
                          transition-all duration-500 ease-out
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
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20 pointer-events-none mix-blend-overlay z-10"
                      />
                      

                  </div>

                  {/* 
                  THEMED AMBIENT GLOW
                  */}
                  <div 
                      className={`
                          absolute -bottom-8 left-6 right-6 h-16 z-10
                          rounded-[100%]
                          transition-all duration-700 ease-in-out
                          pointer-events-none
                          ${
                            layout.mode === 'MOBILE'
                              ? 'mix-blend-normal blur-[20px] opacity-40'
                              : 'mix-blend-multiply blur-[45px]'
                          }
                      `}
                      style={{ 
                          backgroundColor: album.color,
                          opacity: isActive ? (layout.mode === 'MOBILE' ? 0.4 : 0.6) : 0,
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
      - Short Screens: HIDDEN (as per user request for "Extremely Narrow/Landscape" view)
    */}
    {!layout.isShort && layout.showTitle && currentIndex < albums.length && (
    <div
      className="pointer-events-none px-6 z-50 text-center absolute left-0 right-0"
      style={{ top: layout.titleTop }}
    >
      <AnimatePresence mode="wait">
        <motion.div
           key={currentIndex}
           initial={
             prefersReducedMotion
               ? false
               : { opacity: 0, y: 20, filter: 'blur(4px)' }
           }
           animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
           exit={
             prefersReducedMotion
               ? { opacity: 0 }
               : { opacity: 0, y: -20, filter: 'blur(4px)' }
           }
           transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
           className="flex flex-col items-center"
           style={{ transform: `scale(${layout.titleScale})`, transformOrigin: 'top center' }}
        >
          {/* Dynamic Color Accent Bar */}
          <div
              className="w-1 h-8 mb-4 mx-auto transition-colors duration-500"
              style={{ backgroundColor: albums[currentIndex].color }}
          ></div>

          <motion.h2
              className="font-black tracking-[-0.03em] leading-none uppercase mb-2"
              style={{ fontSize: 'clamp(1.8rem, 8vmin, 4.5rem)' }}
              animate={{ color: albums[currentIndex].textColor }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
          >
              {albums[currentIndex].title}
          </motion.h2>

          <motion.p
              className="font-chill font-light tracking-[0.05em] mt-3"
              animate={{ color: albums[currentIndex].textColor }}
              style={{ opacity: 0.82, fontSize: subtitleFontSize }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
          >
              {albums[currentIndex].subtitle}
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </div>
    )}

    <div
      aria-hidden="true"
      ref={titleMeasureRef}
      className="pointer-events-none invisible absolute left-0 right-0 top-0 px-6 z-[-1] text-center"
    >
      <div className="flex flex-col items-center">
        <div
          className="w-1 h-8 mb-4 mx-auto"
          style={{ backgroundColor: albums[Math.min(currentIndex, albums.length - 1)]?.color }}
        ></div>

        <div
          className="font-black tracking-[-0.03em] leading-none uppercase mb-2"
          style={{ fontSize: 'clamp(1.8rem, 8vmin, 4.5rem)' }}
        >
          {albums[Math.min(currentIndex, albums.length - 1)]?.title}
        </div>

        <div
          className="font-chill font-light tracking-[0.05em] mt-3"
          style={{ fontSize: subtitleFontSize }}
        >
          {albums[Math.min(currentIndex, albums.length - 1)]?.subtitle}
        </div>
      </div>
    </div>
    
  </div>
  );
};

export default AlbumStack;
