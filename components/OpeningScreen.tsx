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

  // Tonearm State: Drop needle if scrolling OR dragging
  const [isNeedleDown, setIsNeedleDown] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const shouldBeDown = latest > 0.01;
    if (shouldBeDown !== isNeedleDown) setIsNeedleDown(shouldBeDown);
  });

  // Interaction: Drag to scroll (Scrubbing)
  const lastAngleRef = useRef(0);
  
  // Disc size (responsive) - Reduced for delicate Japanese feel
  const discSize = "min(60vw, 60vh)";
  
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
      className="fixed inset-0 z-[100] bg-[#fbfbf9] overflow-y-auto overflow-x-hidden"
      ref={containerRef}
    >
      {/* Scroll Track - Dramatically reduced to 150vh for "Quick Scroll" */}
      <div className="w-full h-[150vh] relative">
        
        {/* Sticky Container - keeps the vinyl centered while scrolling */}
        <div className="sticky top-0 h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden">
          
          {/* Main Turntable Wrapper - Anchors everything together */}
          <div className="relative" style={{ width: discSize, height: discSize }}>
            
            <AnimatePresence onExitComplete={onComplete}>
              {!isExiting && (
                <motion.div
                  className="absolute inset-0 cursor-grab active:cursor-grabbing"
                  // Move drag handlers to this wrapper so scaling/shadow don't break interaction
                  drag 
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0}
                  dragMomentum={false}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDrag={handleDrag}
                  // Apply Scale/Opacity to the whole group (Shadow + Disc + Shine)
                  style={{
                    scale: 1, 
                    opacity: 1, 
                  }}
                  exit={{ 
                    scale: 0, 
                    opacity: 0,
                    transition: { duration: 0.6, ease: "easeIn" }
                  }}
                >
                  {/* Layer 1: Static Shadow (Fixed Light Source) */}
                  {/* Decoupled from rotation so the shadow stays on the "floor" */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{ 
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.02)' 
                    }}
                  />

                  {/* Layer 2: The Physical Spinning Disc */}
                  <motion.div 
                    className="absolute inset-0 rounded-full bg-[#f7f7f5]"
                    style={{ 
                      rotate, // Rotation applies ONLY to this layer
                    }}
                    exit={{ 
                      rotate: 225, // Spin away during exit
                      transition: { duration: 0.6, ease: "easeIn" }
                    }}
                  >
                    {/* Grooves Texture - Dark subtle rings */}
                    <div className="absolute inset-[3%] rounded-full vinyl-grooves opacity-60 ring-1 ring-black/5"
                         style={{ background: 'repeating-radial-gradient(#00000000 0, #00000000 2px, #00000008 3px, #00000008 4px)' }}
                    ></div>
                    
                    {/* Dead Wax Area */}
                    <div className="absolute inset-[35%] rounded-full bg-[#f2f2ef] shadow-[0_0_0_1px_rgba(0,0,0,0.02)]"></div>

                    {/* Center Label - Dark/Black for contrast */}
                    <div className="absolute inset-[38%] rounded-full flex items-center justify-center bg-[#1a1a1a] shadow-[inset_0_1px_3px_rgba(255,255,255,0.1)]">
                      {/* Spindle Hole */}
                      <div className="w-1.5 h-1.5 bg-[#f3f3f1] rounded-full shadow-[inset_1px_1px_1px_rgba(0,0,0,0.5)]" />
                    </div>

                    {/* SVG Curved Text Layer - Moves with the disc */}
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
                        fill="rgba(20, 20, 20, 0.9)"
                        fontSize="13"
                        fontFamily="'EarlySummerSerif', serif"
                        fontWeight="500"
                        letterSpacing="0.12em"
                        textAnchor="middle"
                      >
                        <textPath href="#textArcTop" startOffset="50%">
                          {TEXT_LINE_1}
                        </textPath>
                      </text>
                      
                      <text
                        fill="rgba(20, 20, 20, 0.9)"
                        fontSize="13"
                        fontFamily="'EarlySummerSerif', serif"
                        fontWeight="500"
                        letterSpacing="0.12em"
                        textAnchor="middle"
                      >
                        <textPath href="#textArcBottom" startOffset="50%">
                          {TEXT_LINE_2}
                        </textPath>
                      </text>
                    </svg>
                  </motion.div>

                  {/* Layer 3: Static Reflection (Fixed Light Source) */}
                  {/* Sits ON TOP of the spinning disc but does not rotate with it */}
                  <div className="absolute inset-0 rounded-full vinyl-shine mix-blend-overlay opacity-30 rotate-[30deg] pointer-events-none"></div>

                </motion.div>
              )}
            </AnimatePresence>

            {/* Tonearm Assembly - Skeuomorphic Design */}
            {/* Anchored relative to the Vinyl Wrapper */}
            <AnimatePresence>
              {!isExiting && (
                <motion.div
                  className="absolute pointer-events-none z-20"
                  style={{
                    top: '0%', // Align with top edge of vinyl box
                    right: '0%', // Align with right edge of vinyl box
                    width: '30%', // Scale relative to vinyl size
                    height: '60%',
                    originX: 0.5,
                    originY: 0.15, // Pivot point near the top
                    translateX: '50%', // Move out to the corner (2 o'clock)
                    translateY: '-10%',
                  }}
                  animate={{
                    rotate: (isNeedleDown || isDragging) ? 25 : -10,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 40,
                    damping: 10, // Slight bounce for mechanical feel
                    mass: 1.2
                  }}
                >
                  {/* Pivot Base (The Round Part) */}
                  <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[25%] aspect-square rounded-full bg-[#fcfcfc] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100 z-10 flex items-center justify-center">
                     <div className="w-[50%] h-[50%] rounded-full bg-[#f0f0f0] shadow-inner" />
                  </div>

                  {/* The Arm (Long Tube) - Matte Grey */}
                  <div className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[4%] h-[70%] bg-[#e5e5e5] rounded-full origin-top" />

                  {/* Counterweight (Top of Arm) - White Block */}
                  <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[16%] h-[12%] rounded-sm bg-[#fafafa] shadow-md border border-gray-100 flex flex-col items-center justify-center">
                    <div className="w-full h-[2px] bg-gray-200 mb-[2px]"></div>
                  </div>

                  {/* Headshell (The Tip) - Sleek White */}
                  <div className="absolute bottom-[18%] left-1/2 -translate-x-1/2 translate-y-1 w-[12%] h-[14%] bg-[#fcfcfc] shadow-md rounded-sm flex flex-col items-center justify-end pb-1 origin-top rotate-[25deg] border border-gray-50/50">
                    {/* Finger Lift - Simple Wire */}
                    <div className="absolute -right-[40%] top-2 w-[50%] h-[60%] border-r-[1.5px] border-gray-400 rounded-r-full skew-y-12 opacity-50" />
                    
                    {/* Cartridge - Dark Grey Block */}
                    <div className="w-[70%] h-[50%] bg-[#333] rounded-[1px] relative overflow-hidden">
                       {/* Needle Highlight - Subtle Orange Dot */}
                       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[20%] h-[20%] bg-orange-500 rounded-full mb-[1px]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Scroll Prompt - Updated color for light theme */}
          <motion.div 
            className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 1 }}
            style={{ opacity }}
          >
            <div className="w-px h-6 bg-black/10"></div>
            <p className="text-[9px] font-mono tracking-[0.3em] uppercase text-black/30">
              SCROLL
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OpeningScreen;
