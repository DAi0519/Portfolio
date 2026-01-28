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

  // Swipe Logic
  const onPanEnd = (event: any, info: any) => {
    // Swipe Right (positive x) -> Back
    if (info.offset.x > 50 && onBack) {
      onBack();
    }
  };

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center relative cursor-pointer touch-none"
      onPanEnd={onPanEnd}
      onTap={handleCheers} // Use onTap for the click/tap action to avoid conflict with pan
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Centered Content */}
      <div className="relative flex flex-col items-center gap-8">
        
        {/* Cups Container */}
        <div className="relative flex items-center justify-center gap-4">
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
            animate={isAnimating ? { rotate: 15, x: 10 } : { rotate: 0, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
            style={{ scaleX: -1 }}
          >
            <Coffee size={64} strokeWidth={1.5} className="text-neutral-800" />
          </motion.div>

          {/* Right Cup - Normal to have handle on right */}
          <motion.div
            animate={isAnimating ? { rotate: -15, x: -10 } : { rotate: 0, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 10 }}
          >
            <Coffee size={64} strokeWidth={1.5} className="text-neutral-800" />
          </motion.div>
        </div>

        {/* Counter */}
        <div className="flex flex-col items-center gap-2">
            <motion.div
                key={count} // Re-trigger animation on change
                initial={{ scale: 1.5, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="text-4xl font-bold text-neutral-800 tabular-nums"
            >
                {count}
            </motion.div>
            <div className="text-xs font-medium tracking-widest uppercase text-neutral-400">
                CHEERS
            </div>
        </div>

      </div>

        {/* Swipe Hint (Optional, or just rely on user knowing to swipe back) */}
        {/* Since this replaces the stack, we might want to handle swipes here too to go back */}
    </motion.div>
  );
};
