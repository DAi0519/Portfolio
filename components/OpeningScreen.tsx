import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useMotionValueEvent } from 'framer-motion';

interface OpeningScreenProps {
  onComplete: () => void;
}

// The intro text - split for symmetric placement
const TEXT_LINE_1 = "我将一切谱成乐章，刻下去是旅程，放出来是回声。";
const TEXT_LINE_2 = "Without music, life would be a mistake.";

const OpeningScreen: React.FC<OpeningScreenProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const vinylRef = useRef<HTMLDivElement>(null);
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
  const discSize = "min(54vw, 54vh)";
  
  const handleDragStart = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
    setIsDragging(true);
    
    // Calculate initial angle relative to center of VINYL (not screen)
    const rect = vinylRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const p = info.point;
    lastAngleRef.current = Math.atan2(p.y - centerY, p.x - centerX) * (180 / Math.PI);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
    if (isExiting || !vinylRef.current) return;
    
    const rect = vinylRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
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
    if (containerRef.current) {
        containerRef.current.scrollTop += delta * pixelsPerDegree;
    }
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
          <div 
             ref={vinylRef}
             className="relative -translate-y-[5vh]" // Shift up slightly for balance
             style={{ width: discSize, height: discSize }}
          >
            
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

                    {/* Center Label - Klein Blue with Signature */}
                    <div className="absolute inset-[38%] rounded-full flex items-center justify-center bg-[#002FA7] shadow-[inset_0_1px_3px_rgba(255,255,255,0.1)] overflow-hidden">
                      {/* Signature Image */}
                      <img 
                        src="/signature.png" 
                        alt="Signature" 
                        className="absolute w-[85%] h-auto object-contain opacity-90 invert mix-blend-plus-lighter" // Inverted for contrast on blue
                      />
                      
                      {/* Spindle Hole */}
                      <div className="relative z-10 w-1.5 h-1.5 bg-[#f3f3f1] rounded-full shadow-[inset_1px_1px_1px_rgba(0,0,0,0.5)]" />
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
                        fill="rgba(20, 20, 20, 0.95)"
                        fontSize="14.5"
                        fontFamily="'EarlySummerSerif', serif"
                        fontWeight="600"
                        letterSpacing="0.08em"
                        textAnchor="middle"
                      >
                        <textPath href="#textArcTop" startOffset="50%">
                          {TEXT_LINE_1}
                        </textPath>
                      </text>
                      
                      <text
                        fill="rgba(20, 20, 20, 0.55)"
                        fontSize="10.5"
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
                    height: '81%', // Shortened by 1/4 (was 108%)
                    originX: 0.5,
                    originY: 0.13, // Adjusted pivot scale
                    translateX: '53.5%', 
                    translateY: '-15%', // Adjusted for shorter arm
                    filter: 'drop-shadow(6px 10px 12px rgba(0,0,0,0.15)) drop-shadow(0 2px 4px rgba(0,0,0,0.1))', 
                  }}
                  animate={{
                    rotate: (isNeedleDown || isDragging) ? 19 : -10, // Angle adjusted for length
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 40,
                    damping: 10, 
                    mass: 1.2
                  }}
                >
                  {/* Pivot Base (The Round Part) */}
                  <div className="absolute top-[7%] left-1/2 -translate-x-1/2 w-[25%] aspect-square rounded-full bg-[#fcfcfc] shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-gray-100 z-10 flex items-center justify-center">
                     <div className="w-[50%] h-[50%] rounded-full bg-[#f0f0f0] shadow-inner" />
                  </div>

                  {/* The Arm (Long Tube) - Matte Grey */}
                  <div className="absolute top-[9%] left-1/2 -translate-x-1/2 w-[4%] h-[75%] bg-[#e5e5e5] rounded-full origin-top" />

                  {/* Counterweight (Top of Arm) - White Block */}
                  <div className="absolute top-[3.5%] left-1/2 -translate-x-1/2 w-[16%] h-[9%] rounded-sm bg-[#fafafa] shadow-md border border-gray-100 flex flex-col items-center justify-center">
                    <div className="w-full h-[2px] bg-gray-200 mb-[2px]"></div>
                  </div>

                  {/* Headshell (The Tip) - Sleek White */}
                  <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 translate-y-1 w-[12%] h-[10.5%] bg-[#fcfcfc] shadow-md rounded-sm flex flex-col items-center justify-end pb-1 origin-top rotate-[25deg] border border-gray-50/50">
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
          {/* Scroll Prompt - Interaction Fader (Crossfader Style) */}
          <motion.div 
            className="absolute bottom-12 inset-x-0 flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1.5 }}
            style={{ opacity }}
          >
            {/* Crossfader Track */}
            <div className="relative w-24 h-6 flex items-center justify-center">
               {/* Track Line */}
               <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent"></div>
               
               {/* Tick Marks */}
               <div className="absolute left-0 right-0 flex justify-between px-2">
                  <div className="w-px h-1.5 bg-black/10"></div>
                  <div className="w-px h-1.5 bg-black/10"></div>
               </div>

               {/* Fader Cap Animation */}
               <motion.div
                  className="absolute w-8 h-4 bg-[#fcfcfc] border border-black/10 rounded-[1px] shadow-[0_2px_5px_rgba(0,0,0,0.1)] z-10 flex items-center justify-center"
                  animate={{ 
                    x: [-24, 24, -24],
                  }}
                  transition={{ 
                    duration: 3, 
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 0
                  }}
               >
                  {/* Grip Line */}
                  <div className="w-px h-2 bg-black/20"></div>
               </motion.div>
            </div>

            {/* Text */}
            <p className="text-[10px] font-serif italic tracking-widest text-black/40 mix-blend-multiply">
              spin it
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OpeningScreen;
