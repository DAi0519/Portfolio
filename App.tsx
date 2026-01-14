
import React, { useState, useEffect } from 'react';
import { ALBUMS } from './constants';
import AlbumStack from './components/AlbumStack';
import { ImmersiveView } from './components/ImmersiveView';
import { motion, AnimatePresence } from 'framer-motion';
import OpeningScreen from './components/OpeningScreen';

import CinematicBackground from './components/CinematicBackground';


const App: React.FC = () => {
  // Simple Router: 'STACK' (Home) or 'DETAIL' (Project List)
  const [viewMode, setViewMode] = useState<'STACK' | 'DETAIL'>('STACK');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOpening, setShowOpening] = useState(true);

  const activeAlbum = ALBUMS[currentIndex];

  const handleSelectAlbum = (index: number) => {
    setCurrentIndex(index);
    setViewMode('DETAIL');
  };

  const handleBackToStack = () => {
    setViewMode('STACK');
  };

  const handleIndexChange = (index: number) => {
    setCurrentIndex(index);
  }

  // Keyboard navigation for global shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If opening screen is visible, any key dismisses it (optional, but good UX)
      if (showOpening) {
         // Let the component handle its own internal transition logic if we wanted, 
         // but here we just ignore or could force close. 
         // For now, let's rely on the scroll/click listeners in OpeningScreen
         return;
      }

      if (viewMode === 'DETAIL') {
        if (e.key === 'Escape') handleBackToStack();
      } else {
        // Collection Mode Navigation logic is handled inside AlbumStack for scroll/swipe, 
        // but we keep basic arrow keys here for safety if focus is lost
        if (e.key === 'Enter') handleSelectAlbum(currentIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, currentIndex, showOpening]);

  return (
    <div className="h-[100dvh] w-full relative selection:bg-neutral-900 selection:text-white overflow-hidden">
      
      {showOpening && (
        <OpeningScreen onComplete={() => setShowOpening(false)} />
      )}

      {/* Background Layer */}
      <CinematicBackground 
          color={activeAlbum.color} 
          backgroundColor={activeAlbum.backgroundColor} 
      />

      {/* Main Content Area */}
      <main className={`w-full h-full relative z-10 transition-opacity duration-1000 ${showOpening ? 'opacity-0' : 'opacity-100'}`}>
        <AnimatePresence mode="wait">
        {viewMode === 'STACK' ? (
           <>
              {/* Header for Stack Mode */}
              <header className="absolute top-0 left-0 right-0 z-30 px-6 py-6 md:p-8 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto">
                  <motion.h1 
                    className="text-xs md:text-sm font-bold tracking-tight"
                    animate={{ color: activeAlbum.textColor }}
                    transition={{ duration: 0.5 }}
                  >
                    DAI<span style={{ opacity: 0.4 }}>.DESIGN</span>
                  </motion.h1>
                  {/* Dynamic Brand Accent Bar */}
                  <div 
                    className="w-8 h-0.5 mt-2 transition-colors duration-500"
                    style={{ backgroundColor: activeAlbum.color }}
                  ></div>
                </div>
                <div className="text-right pointer-events-auto">
                   <motion.p 
                    className="text-[9px] font-mono uppercase tracking-widest"
                    animate={{ color: activeAlbum.textColor }}
                    style={{ opacity: 0.5 }}
                    transition={{ duration: 0.5 }}
                   >
                      COLLECTION
                   </motion.p>
                </div>
              </header>

              <motion.div 
                key="stack"
                className="w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)', transition: { duration: 0.5, ease: [0.32, 0, 0.67, 0] } }}
              >
                <AlbumStack 
                    albums={ALBUMS} 
                    currentIndex={currentIndex}
                    onIndexChange={handleIndexChange}
                    onSelect={handleSelectAlbum} 
                />
              </motion.div>

               {/* Footer for Stack Mode */}
              <footer className="absolute bottom-0 left-0 right-0 z-30 px-6 py-6 md:p-8 flex justify-between items-end pointer-events-none">
                <motion.p 
                  className="text-[9px] font-mono uppercase tracking-widest"
                  animate={{ color: activeAlbum.textColor }}
                  style={{ opacity: 0.4 }}
                  transition={{ duration: 0.5 }}
                >
                   Stay hungry,Stay foolish
                </motion.p>
                <motion.p 
                  className="text-[9px] font-mono uppercase tracking-widest"
                  animate={{ color: activeAlbum.textColor }}
                  style={{ opacity: 0.5 }}
                  transition={{ duration: 0.5 }}
                >
                   {String(currentIndex + 1).padStart(2, '0')} / {String(ALBUMS.length).padStart(2, '0')}
                </motion.p>
              </footer>
           </>
        ) : (
          /* DETAIL VIEW (Immersive) - No animation wrapper here, handled inside component */
          <ImmersiveView 
            key="detail"
            album={activeAlbum} 
            onClose={handleBackToStack} 
          />
        )}
        </AnimatePresence>
      </main>

      
    </div>
  );
};

export default App;
