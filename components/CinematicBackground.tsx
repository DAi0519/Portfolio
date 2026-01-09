import React from 'react';
import { motion } from 'framer-motion';

interface CinematicBackgroundProps {
  color: string; // The active theme color (e.g., Klein Blue)
  backgroundColor: string; // The base paper tint
}

const CinematicBackground: React.FC<CinematicBackgroundProps> = ({ color, backgroundColor }) => {
  return (
    <motion.div 
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      initial={false}
      animate={{ backgroundColor }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} // Slower, heavier ease
    >
        {/* Global Grain Overlay: Adds physical texture */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-multiply" 
             style={{ 
                 backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
             }} 
        />

        {/* 
            LAYER 1: The "Atmosphere" 
            A large, fixed gradient wash from the Top-Left.
            Provides the main directional light source.
        */}
        <motion.div
           className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] rounded-full blur-[120px] mix-blend-multiply opacity-20"
           animate={{ backgroundColor: color }}
           transition={{ duration: 1.5 }}
        />

        {/* 
            LAYER 2: The "Depth"
            A secondary, darker wash from the Bottom-Right to ground the composition.
            It breathes very slowly to keep the page 'alive'.
        */}
        <motion.div
           className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[100px] mix-blend-multiply opacity-15"
           animate={{ 
               backgroundColor: color,
               scale: [1, 1.05, 1],
           }}
           transition={{ 
               backgroundColor: { duration: 1.5 },
               scale: { duration: 10, repeat: Infinity, ease: "easeInOut" }
           }}
        />
        
        {/* 
            LAYER 3: The "Spotlight" (Subtle)
            A center-screen highlight to separate the foreground content from the back.
            Typically white/light to act as a backlight for the content.
        */}
        <div 
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)'
            }}
        />

    </motion.div>
  );
};

export default CinematicBackground;
