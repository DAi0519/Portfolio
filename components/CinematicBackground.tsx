import React from 'react';
import { motion } from 'framer-motion';

interface CinematicBackgroundProps {
  color: string; // The active theme color (e.g., Klein Blue)
  backgroundColor: string; // The base paper tint
}

const CinematicBackground: React.FC<CinematicBackgroundProps> = ({ color, backgroundColor }) => {
  return (
    <motion.div 
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none transform-gpu will-change-[background-color]"
      initial={false}
      animate={{ backgroundColor }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} // Slower, heavier ease
    >


        {/* 
            LAYER 1: The "Atmosphere" 
            A large, fixed gradient wash from the Top-Left.
            Provides the main directional light source.
        */}
        <motion.div
           className="hidden md:block absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] md:w-[50vw] md:h-[50vw] rounded-full blur-[120px] mix-blend-multiply opacity-20 md:opacity-15"
           animate={{ backgroundColor: color }}
           transition={{ duration: 1.5 }}
        />

        {/* 
            LAYER 2: The "Depth"
            A secondary, darker wash from the Bottom-Right to ground the composition.
            It breathes very slowly to keep the page 'alive'.
        */}
        <motion.div
           className="hidden md:block absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] rounded-full blur-[100px] mix-blend-multiply opacity-15 md:opacity-10"
           animate={{ 
               backgroundColor: color,
           }}
           transition={{ 
               duration: 1.5 
           }}
        />
        
        {/* 
            LAYER 3: The "Spotlight" (Subtle)
            A center-screen highlight to separate the foreground content from the back.
            Typically white/light to act as a backlight for the content.
        */}
        <div 
            className="hidden md:block absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)'
            }}
        />

    </motion.div>
  );
};

export default CinematicBackground;
