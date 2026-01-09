
import React, { useState, useEffect } from 'react';
import { ALBUMS } from './constants';
import AlbumStack from './components/AlbumStack';
import { ImmersiveView } from './components/ImmersiveView';
import { motion } from 'framer-motion';

import CinematicBackground from './components/CinematicBackground';

const App: React.FC = () => {
  // Simple Router: 'STACK' (Home) or 'DETAIL' (Project List)
  const [viewMode, setViewMode] = useState<'STACK' | 'DETAIL'>('STACK');
  const [currentIndex, setCurrentIndex] = useState(0);

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
  }, [viewMode, currentIndex]);

  return (
    <div className="h-[100dvh] w-full relative selection:bg-neutral-900 selection:text-white overflow-hidden">
      
      {/* Background Layer */}
      <CinematicBackground 
          color={activeAlbum.color} 
          backgroundColor={activeAlbum.backgroundColor} 
      />

      {/* Main Content Area */}
      <main className="w-full h-full relative z-10">
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
                    迪特·拉姆斯<span style={{ opacity: 0.5 }}>.作品集</span>
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
                    style={{ opacity: 0.6 }} // Static opacity for hierarchy
                    transition={{ duration: 0.5 }}
                   >
                      选择唱片
                   </motion.p>
                </div>
              </header>

              <div className="w-full h-full animate-[fadeIn_0.5s_ease-out]">
                <AlbumStack 
                    albums={ALBUMS} 
                    currentIndex={currentIndex}
                    onIndexChange={handleIndexChange}
                    onSelect={handleSelectAlbum} 
                />
              </div>

               {/* Footer for Stack Mode */}
              <footer className="absolute bottom-0 left-0 right-0 z-30 px-6 py-6 md:p-8 flex justify-between items-end pointer-events-none">
                <motion.p 
                  className="text-[9px] font-mono uppercase tracking-widest"
                  animate={{ color: activeAlbum.textColor }}
                  style={{ opacity: 0.6 }}
                  transition={{ duration: 0.5 }}
                >
                   {new Date().getFullYear()} 系统
                </motion.p>
              </footer>
           </>
        ) : (
          /* DETAIL VIEW (Immersive) - No animation wrapper here, handled inside component */
          <ImmersiveView 
            album={activeAlbum} 
            onClose={handleBackToStack} 
          />
        )}
      </main>

    </div>
  );
};

export default App;
