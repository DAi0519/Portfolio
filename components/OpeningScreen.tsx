import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValueEvent } from 'framer-motion';

interface OpeningScreenProps {
  onComplete: () => void;
}

// The intro text - split for symmetric placement
const TEXT_LINE_1 = "我的生命是一段乐章";
const TEXT_LINE_2 = "刻下去是旅程，放出来作回声";

const OpeningScreen: React.FC<OpeningScreenProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExiting, setIsExiting] = useState(false);
  
  // Scroll-linked rotation - track the container's scroll position
  const { scrollYProgress } = useScroll({
    container: containerRef,
  });
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false);

  // Map scroll to rotation 
  // Phase 1 [0-70%]: Rotate to 180 (Reading position)
  // At 70% (180deg), we trigger the auto-exit
  const rotateRaw = useTransform(scrollYProgress, [0, 0.7], [0, 180]);
  
  // Dynamic Spring Physics
  // "Belt Drive" (Scroll): Heavy, smooth, luxurious lag (stiffness: 50)
  // "Direct Drive" (Scratch): Instant, responsive, 1:1 feel (stiffness: 800)
  const springConfig = isDragging 
    ? { stiffness: 800, damping: 40, mass: 0.2 } // High responsiveness for scratching
    : { stiffness: 50, damping: 20, mass: 1 };   // Smooth inertia for scrolling
    
  const rotate = useSpring(rotateRaw, springConfig);
  
  // Scale stays at 1 during the manual scroll phase
  // The shrinking happens entirely in the exit animation now
  
  // Opacity fade out at the very end to avoid clipping
  const opacity = useTransform(scrollYProgress, [0.9, 1], [1, 0]);

  // Trigger exit when ROTATION reaches the target (visual sync)
  // We monitor the sprung 'rotate' value, not the raw scroll
  useMotionValueEvent(rotate, "change", (latest) => {
    // 179 allows for minute precision errors while guaranteeing it looks like 180
    if (latest >= 179 && !isExiting) {
      setIsExiting(true);
    }
  });

  // Disc size (responsive)
  const discSize = "min(80vw, 80vh)";
  
  // Interaction: Drag to scroll (Scrubbing)
  const lastAngleRef = useRef(0);
  
  const handleDragStart = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
    setIsDragging(true);
    
    // Calculate initial angle relative to center of screen
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const p = info.point;
    lastAngleRef.current = Math.atan2(p.y - centerY, p.x - centerX) * (180 / Math.PI);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
    if (isExiting || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const p = info.point;
    
    // Deadzone check: If too close to center (< 40px), ignore to prevent angle jumps
    const dist = Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
    if (dist < 40) return;
    
    // Current angle
    const angle = Math.atan2(p.y - centerY, p.x - centerX) * (180 / Math.PI);
    
    // Delta angle (handling wrapping -180/180 ideally, but simple diff works for small movements)
    let delta = angle - lastAngleRef.current;
    
    // Fix jump when crossing -180/180 boundary
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    
    lastAngleRef.current = angle;
    
    // Map Rotation Delta -> Scroll Delta
    // We want 180 degrees of rotation to equal ~70% of scroll height
    // Scroll Height (available) = Total Height (150vh) - Viewport (100vh) = 50vh
    // So 180 deg = 0.7 * 50vh
    // 1 deg = (0.7 * 50vh) / 180
    const vh = window.innerHeight;
    const maxScroll = vh * 0.5; // 50vh scrollable
    const pixelsPerDegree = (maxScroll * 0.7) / 180;
    
    // Update scroll position
    containerRef.current.scrollTop += delta * pixelsPerDegree;
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#f3f3f1] overflow-y-auto overflow-x-hidden"
      ref={containerRef}
    >
      {/* Scroll Track - Dramatically reduced to 150vh for "Quick Scroll" */}
      <div className="w-full h-[150vh] relative">
        
        {/* Sticky Container - keeps the vinyl centered while scrolling */}
        <div className="sticky top-0 h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden">
          <AnimatePresence onExitComplete={onComplete}>
            {!isExiting && (
              <motion.div
                className="relative cursor-grab active:cursor-grabbing"
                drag // Enable simple drag to capture events (we use custom logic)
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} // Lock position, just track input
                dragElastic={0}
                dragMomentum={false}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDrag={handleDrag}
                style={{
                  width: discSize,
                  height: discSize,
                  rotate,
                  scale: 1, // Fixed scale during scroll
                  opacity: 1, // Fixed opacity during scroll
                }}
                exit={{ 
                  scale: 0, 
                  opacity: 0,
                  rotate: 225, // Continue rotation (+45deg)
                  transition: { 
                    duration: 0.6, 
                    ease: "easeIn", // Accelerate away
                  }
                }}
              >
                {/* Vinyl Disc Base - Pure Black, no fog */}
                <div 
                  className="absolute inset-0 rounded-full bg-[#111]"
                  style={{ boxShadow: '0 40px 80px -30px rgba(0,0,0,0.5)' }}
                >
                  {/* Grooves Texture */}
                  <div className="absolute inset-[3%] rounded-full vinyl-grooves opacity-70 ring-1 ring-white/5"></div>
                  
                  {/* Subtle Shine */}
                  <div className="absolute inset-0 rounded-full vinyl-shine mix-blend-plus-lighter opacity-25 rotate-[30deg]"></div>

                  {/* Dead Wax Area */}
                  <div className="absolute inset-[35%] rounded-full bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]"></div>

                  {/* Center Label */}
                  <div className="absolute inset-[38%] rounded-full flex items-center justify-center bg-[#080808] shadow-[inset_0_1px_3px_rgba(255,255,255,0.05)]">
                    {/* Spindle Hole */}
                    <div className="w-1.5 h-1.5 bg-[#f3f3f1] rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]" />
                  </div>
                </div>

                {/* SVG Curved Text Layer */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 400 400"
                >
                  <defs>
                    <path
                      id="textArcTop"
                      d="M 50, 200 A 150,150 0 0,1 350, 200"
                      fill="none"
                    />
                    <path
                      id="textArcBottom"
                      d="M 350, 200 A 150,150 0 0,1 50, 200"
                      fill="none"
                    />
                  </defs>
                  
                  <text
                    fill="rgba(255,255,255,0.85)"
                    fontSize="16"
                    fontFamily="'EarlySummerSerif', serif"
                    fontWeight="400"
                    letterSpacing="0.2em"
                    textAnchor="middle"
                  >
                    <textPath href="#textArcTop" startOffset="50%">
                      {TEXT_LINE_1}
                    </textPath>
                  </text>
                  
                  <text
                    fill="rgba(255,255,255,0.85)"
                    fontSize="16"
                    fontFamily="'EarlySummerSerif', serif"
                    fontWeight="400"
                    letterSpacing="0.2em"
                    textAnchor="middle"
                  >
                    <textPath href="#textArcBottom" startOffset="50%">
                      {TEXT_LINE_2}
                    </textPath>
                  </text>
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Scroll Prompt */}
          <motion.div 
            className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 1 }}
            style={{ opacity }}
          >
            <div className="w-px h-6 bg-black/20"></div>
            <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-black/40">
              SCROLL
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OpeningScreen;
