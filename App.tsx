
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  
  // Check session storage for first visit
  const [showOpening, setShowOpening] = useState(() => {
    // Safety check for SSR or non-browser environments (though this is client-side React)
    if (typeof window !== 'undefined') {
        const hasVisited = sessionStorage.getItem('hasVisited');
        return !hasVisited;
    }
    return true;
  });

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

  // Music State
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [wasPlayingBeforeVideo, setWasPlayingBeforeVideo] = useState(false); // Audio Ducking State
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Audio
    audioRef.current = new Audio('/bgm.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0; // Initialize silent
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Unlock AudioContext on first interaction
  const primeAudio = useCallback(() => {
    if (audioRef.current) {
      // Play comfortably at volume 0 to unlock capabilities
      audioRef.current.play().catch(e => console.log("Audio Prime Failed:", e));
    }
  }, []);

  // BGM Persistence State
  const bgmState = useRef<{ isPlaying: boolean; currentTime: number }>({ isPlaying: false, currentTime: 0 });

  // Handle Track Switching & Auto-Play on View Change
  useEffect(() => {
      if (!audioRef.current) return;

      const switchTrack = async (newSrc: string, mode: 'ENTER_ALBUM' | 'RETURN_HOME') => {
          if (!audioRef.current) return;
          
          const currentSrc = audioRef.current.getAttribute('src');
          
          if (mode === 'ENTER_ALBUM') {
               // LEAVING HOME: Save BGM State
               if (currentSrc === '/bgm.mp3') {
                   bgmState.current = {
                       isPlaying: isMusicPlaying,
                       currentTime: audioRef.current.currentTime
                   };
               }
               
               // Switch to Album Music
               if (currentSrc !== newSrc) {
                   audioRef.current.src = newSrc;
                   audioRef.current.load();
               }

               // Always Auto-Play Album Music
               setIsMusicPlaying(true);
               audioRef.current.volume = 0.4;
               audioRef.current.play().catch(e => console.log("Album play failed", e));
          } 
          else if (mode === 'RETURN_HOME') {
               // RETURNING HOME: Switch back to BGM
                if (currentSrc !== '/bgm.mp3') {
                   audioRef.current.src = '/bgm.mp3';
                   audioRef.current.load();
                   // Restore Progress
                   audioRef.current.currentTime = bgmState.current.currentTime;
               }

               // Restore Play State
               if (bgmState.current.isPlaying) {
                   setIsMusicPlaying(true);
                   audioRef.current.volume = 0.4;
                   audioRef.current.play().catch(e => console.log("BGM Resume Failed", e));
               } else {
                   setIsMusicPlaying(false);
                   audioRef.current.pause();
               }
          }
      };

      if (viewMode === 'DETAIL') {
          // ENTERING ALBUM
          const albumMusic = activeAlbum.musicFile || '/bgm.mp3';
          switchTrack(albumMusic, 'ENTER_ALBUM');
      } else {
          // STACK MODE
          switchTrack('/bgm.mp3', 'RETURN_HOME');
      }
  }, [viewMode, activeAlbum]);

  // Handle Play/Pause Toggle
  useEffect(() => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.volume = 0.4; // Fade in / Set target volume
        audioRef.current.play().catch(e => console.log("Autoplay prevented:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMusicPlaying]);

  const handleMusicToggle = () => {
    setIsMusicPlaying(prev => !prev);
    // If user manually toggles OFF, reset was playing memory to prevent unwanted resume
    if (isMusicPlaying) {
      setWasPlayingBeforeVideo(false);
    }
  };

  // Video-Audio Ducking Handlers
  const handleVideoPlay = () => {
    // Remember if music was playing before video started
    setWasPlayingBeforeVideo(isMusicPlaying);
    // Pause album music
    setIsMusicPlaying(false);
  };

  const handleVideoEnd = () => {
    // Only resume if music was playing before video interrupted
    if (wasPlayingBeforeVideo) {
      setIsMusicPlaying(true);
    }
    // Clear the memory regardless
    setWasPlayingBeforeVideo(false);
  };

  return (
    <div className="h-[100dvh] w-full relative selection:bg-neutral-900 selection:text-white overflow-hidden">
      
      {showOpening && (
        <OpeningScreen 
          onStart={undefined} // Disable audio priming to ensure no auto-play
          onComplete={() => {
            setShowOpening(false);
            // Mark as visited in session storage
            sessionStorage.setItem('hasVisited', 'true');
            // Ensure music is stopped
            if (audioRef.current) {
                audioRef.current.pause();
            }
            setIsMusicPlaying(false);
        }} />
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
              <header className="absolute top-0 left-0 right-0 z-30 px-6 py-6 md:p-8 flex justify-between items-center pointer-events-none">
                <div className="pointer-events-auto relative flex flex-col items-center justify-center">
                  <motion.h1 
                    className="text-xs md:text-sm font-bold tracking-tight"
                    animate={{ color: activeAlbum.textColor }}
                    transition={{ duration: 0.5 }}
                  >
                    DAI<span style={{ opacity: 0.4 }}>.DESIGN</span>
                  </motion.h1>
                  {/* Dynamic Brand Accent Bar - Absolute to not affect text alignment */}
                  <div 
                    className="absolute top-full left-0 w-8 h-0.5 mt-2 transition-colors duration-500"
                    style={{ backgroundColor: activeAlbum.color }}
                  ></div>
                </div>


                <div className="flex items-center justify-end pointer-events-auto">
                   {/* Music Control - Top Right */}
                   <button 
                      onClick={handleMusicToggle}
                      className={`flex items-center gap-3 transition-all duration-500 group cursor-pointer ${isMusicPlaying ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}
                   >
                      {/* Spectrum Visualizer */}
                      <div className="flex items-end gap-[2px] h-3">
                         {[0.4, 0.8, 0.5, 0.9].map((h, i) => (
                             <motion.div 
                                key={i}
                                className="w-[1.5px]"
                                animate={{ 
                                   height: isMusicPlaying ? ['20%', '70%', '30%', '60%', '20%'] : '25%', // Softer animation & Flat inactive state
                                }}
                                transition={isMusicPlaying ? {
                                   duration: 1.5,
                                   repeat: Infinity,
                                   repeatType: "mirror",
                                   delay: i * 0.2, // Rippling delay
                                   ease: "easeInOut",
                                } : {
                                   duration: 0.5 // Smooth return to static
                                }}
                                style={{ backgroundColor: activeAlbum.textColor }} 
                              />
                         ))}
                      </div>

                      {/* Title */}
                      <motion.span 
                         className="text-[9px] font-bold tracking-widest uppercase leading-none mt-[1px]" // Unified Font (Sans Bold) & Size (9px)
                         animate={{ color: activeAlbum.textColor }}
                         transition={{ duration: 0.5 }}
                      >
                         {viewMode === 'DETAIL' && activeAlbum.musicFile ? 'Now Playing' : 'Outer Wilds'}
                      </motion.span>
                   </button>
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
                  className="text-[9px] font-bold uppercase tracking-widest" // Unified Font
                  animate={{ color: activeAlbum.textColor }}
                  style={{ opacity: 0.4 }}
                  transition={{ duration: 0.5 }}
                >
                   Stay hungry,Stay foolish
                </motion.p>
                <motion.p 
                  className="text-[9px] font-bold uppercase tracking-widest" // Unified Font
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
            isMusicPlaying={isMusicPlaying}
            onMusicToggle={handleMusicToggle}
            onVideoPlay={handleVideoPlay}
            onVideoEnd={handleVideoEnd}
          />
        )}
        </AnimatePresence>
      </main>

      
    </div>
  );
};

export default App;
