import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee } from "lucide-react";
import React from "react";

interface CheersProps {
    onBack: () => void;
    count: number;
    increment: () => void;
}

export default function Cheers({ onBack, count, increment }: CheersProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  React.useEffect(() => {
    // Note: Ensure the filename matches cases sensitivity if needed, although usually fine on standard web servers
    audioRef.current = new Audio("/musics/碰杯.WAV");
    audioRef.current.volume = 0.6; // Moderate volume
  }, []);

  // Interaction Handler
  const handleCheers = () => {
    if (audioRef.current) {
        audioRef.current.currentTime = 0; // Reset for rapid firing
        audioRef.current.play().catch(e => console.log("Audio play failed", e));
    }
    
    increment(); // Use the hook's increment
    
    setIsAnimating(true);
    // Reset animation trigger after short delay
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Swipe & Wheel Logic
  const onPanEnd = (event: any, info: any) => {
    // Swipe Right (Back) - Existing
    if (info.offset.x > 50 && onBack) {
      onBack();
    }
    // Swipe Left (Back) - Requested by User ("左滑...返回")
    // Treating the page as a dismissible overlay that can be swiped either way or specifically left
    if (info.offset.x < -50 && onBack) {
        onBack();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
      // Scroll Up (deltaY < 0) -> Back
      // Scroll Left (deltaX < 0) -> Back (optional, but good mapping)
      if ((e.deltaY < -20 || e.deltaX < -20) && onBack) {
          onBack();
      }
  };

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center relative touch-none"
      onPanEnd={onPanEnd}
      onWheel={handleWheel}
      // onTap removed - restricted to inner content
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Back Navigation Arrow - Left Edge */}


      {/* Centered Content - Interaction Zone */}
      <motion.div 
        className="relative flex flex-col items-center gap-6 cursor-pointer" // Added cursor-pointer
        onTap={(e) => {
            e.stopPropagation(); // Prevent bubbling if needed, though mostly visual here
            handleCheers();
        }}
      > 
        
        {/* Slogan Image - Placed above cups, pointer-events-none to prevent blocking */}
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="pointer-events-none mb-2 select-none" // Reduced mb-4 to mb-2
        >
            <img 
                src="/images/cheers-slogan.png" 
                alt="Cheers Slogan" 
                className="w-80 md:w-[32rem] h-auto mix-blend-multiply opacity-80" // Increased from w-64/w-96
            />
        </motion.div>

        {/* Cups Container */}
        <div className="relative flex items-center justify-center gap-2"> {/* Reduced gap-4 to gap-2 */}
          <AnimatePresence>
            {isAnimating && (
              <motion.div
                className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-8 z-10"
                initial={{ opacity: 1, scale: 0.5 }}
                animate={{ opacity: 0, scale: 1.2, y: -10 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {/* Left Splash */}
                <div className="relative">
                   <motion.div className="absolute top-0 right-0 w-1 h-3 bg-neutral-800 rounded-full origin-bottom" style={{ rotate: -25 }} /> 
                   <motion.div className="absolute top-2 right-3 w-1 h-2 bg-neutral-800 rounded-full origin-bottom" style={{ rotate: -65 }} /> 
                </div>

                {/* Right Splash */}
                <div className="relative">
                   <motion.div className="absolute top-0 left-0 w-1 h-3 bg-neutral-800 rounded-full origin-bottom" style={{ rotate: 25 }} /> 
                   <motion.div className="absolute top-2 left-3 w-1 h-2 bg-neutral-800 rounded-full origin-bottom" style={{ rotate: 65 }} /> 
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Left Cup - Flipped to have handle on left */}
          <motion.div
            // Pivot from bottom for realistic tipping
            // Idle: Rotate 10 (with flip = Tilted Left/Out)
            // Clink: Rotate -12 (increased from -5 for harder hit)
            animate={isAnimating ? { rotate: -12, x: 0 } : { rotate: 10, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
            style={{ scaleX: -1, originY: 1 }} // Set anchor to bottom
          >
            {/* Increased size 48 -> 56 */}
            <Coffee size={56} strokeWidth={1.5} className="text-neutral-800" />
          </motion.div>

          {/* Right Cup - Normal to have handle on right */}
          <motion.div
            // Pivot from bottom
            // Idle: Rotate 10 (Tilted Right/Out)
            // Clink: Rotate -12 (increased from -5 for harder hit)
            animate={isAnimating ? { rotate: -12, x: 0 } : { rotate: 10, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
            style={{ originY: 1 }} // Set anchor to bottom
          >
            {/* Increased size 48 -> 56 */}
            <Coffee size={56} strokeWidth={1.5} className="text-neutral-800" />
          </motion.div>
        </div>

        {/* Counter */}
        <div className="flex flex-col items-center gap-2 mt-4"> {/* Added mt-4 to match visual spacing of top slogan */}
            <div className="flex items-baseline justify-center gap-1 text-neutral-800 font-bold">
                {/* Increased Text Sizes */}
                <span className="text-base md:text-lg">已有</span>
                <motion.div
                    key={count} // Re-trigger animation on change
                    initial={{ scale: 1.5, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl tabular-nums mx-1 text-[#002FA7]" // Increased 3xl->4xl, 4xl->5xl, Added Klein Blue
                >
                    {count}
                </motion.div>
                <span className="text-base md:text-lg">次碰杯，来一杯？</span>
            </div>
            {/* Removed the redundant "CHEERS" text as requested implicit context replacement */}
        </div>

      </motion.div>

        {/* Swipe Hint (Optional, or just rely on user knowing to swipe back) */}
        {/* Since this replaces the stack, we might want to handle swipes here too to go back */}
    </motion.div>
  );
};
