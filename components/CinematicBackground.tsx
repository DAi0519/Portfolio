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
           className="absolute top-[-20%] left-[-10%] w-[90vw] h-[90vw] md:w-[50vw] md:h-[50vw] rounded-full blur-[80px] md:blur-[120px] mix-blend-multiply opacity-10 md:opacity-15"
           animate={{ backgroundColor: color }}
           transition={{ duration: 1.5 }}
        />

        <motion.div
           className="hidden md:block absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] rounded-full blur-[100px] mix-blend-multiply opacity-10"
           animate={{ backgroundColor: color }}
           transition={{ duration: 1.5 }}
        />
        
        <div 
            className="absolute inset-0 opacity-20 md:opacity-40 mix-blend-overlay"
            style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)'
            }}
        />

    </motion.div>
  );
};

export default CinematicBackground;
