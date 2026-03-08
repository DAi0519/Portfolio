import React, { useState, useEffect, useRef, useCallback } from "react";
import { ALBUMS, Z } from "./constants";
import AlbumStack from "./components/AlbumStack";
import { ImmersiveView } from "./components/ImmersiveView";
import { AnimatePresence, motion, animate, useReducedMotion } from "framer-motion";

import OpeningScreen from "./components/OpeningScreen";
import Cheers from "./components/Cheers";

import CinematicBackground from "./components/CinematicBackground";

import { useCheers } from "./hooks/useCheers";

import { useAudioPreloader } from "./hooks/useAudioPreloader";
import LoadingScreen from "./components/LoadingScreen";

const App: React.FC = () => {
  // Preload Audio Assets
  const audioAssets = [
    '/musics/vinyl_start.mp3',
    '/musics/00bgm.mp3'
  ];
  const { loaded: audioLoaded } = useAudioPreloader(audioAssets);

  // Global Cheers State (Prefetched)
  const { count: cheersCount, increment: incrementCheers } = useCheers();

  // Helper to get slug from album (defined early for state init)
  const getSlug = (albumId: string) => albumId.toLowerCase();

  // Initialize State from URL directly
  // This prevents 'flash of home' or state hydration mismatches
  const [viewMode, setViewMode] = useState<"STACK" | "DETAIL">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const albumSlug = params.get("album");
      if (
        albumSlug &&
        ALBUMS.some((a) => getSlug(a.id) === getSlug(albumSlug))
      ) {
        return "DETAIL";
      }
    }
    return "STACK";
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const albumSlug = params.get("album");
      if (albumSlug) {
        const index = ALBUMS.findIndex(
          (a) => getSlug(a.id) === getSlug(albumSlug),
        );
        if (index !== -1) return index;
      }
    }
    return 0;
  });

  // Check session storage for first visit
  const [showOpening, setShowOpening] = useState(() => {
    // Safety check for SSR or non-browser environments (though this is client-side React)
    if (typeof window !== "undefined") {
      // Pure URL-based logic:
      // 1. If 'album' param exists -> We are deep linking -> SKIP intro (return false)
      // 2. If no 'album' param -> We are at root -> SHOW intro (return true)
      const params = new URLSearchParams(window.location.search);
      if (params.get("album")) return false;

      return true;
    }
    return true;
  });

  const activeAlbum = ALBUMS[currentIndex];
  const prefersReducedMotion = useReducedMotion();

  const handleSelectAlbum = (index: number) => {
    setCurrentIndex(index);
    setViewMode("DETAIL");
  };

  const handleBackToStack = () => {
    setViewMode("STACK");
  };

  const handleIndexChange = (index: number) => {
    setCurrentIndex(index);
  };

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

      if (viewMode === "DETAIL") {
        if (e.key === "Escape") handleBackToStack();
      } else {
        // Collection Mode Navigation logic is handled inside AlbumStack for scroll/swipe,
        // but we keep basic arrow keys here for safety if focus is lost
        if (e.key === "Enter") handleSelectAlbum(currentIndex);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, currentIndex, showOpening]);

  // --- DEEP LINKING & URL SYNC ---

  // 1. Handle PopState (Back/Forward) ONLY
  useEffect(() => {
    // Media Protection: Disable Right-Click Context Menu globally
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
        e.preventDefault();
      }
    };
    window.addEventListener("contextmenu", handleContextMenu);

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const albumSlug = params.get("album");

      if (albumSlug) {
        const index = ALBUMS.findIndex(
          (a) => a.id.toLowerCase() === albumSlug.toLowerCase(),
        );
        if (index !== -1) {
          setCurrentIndex(index);
          setViewMode("DETAIL");
          return;
        }
      }

      setViewMode("STACK");
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  // 2. Sync State to URL
  useEffect(() => {
    // Don't push state on initial render if it matches URL, but pushState handles that via replace vs push logic usually.
    // Here we just want to ensure URL reflects state.
    // We need to avoid infinite loops with popstate.
    // Strategy: Only push if the current URL doesn't match the state.

    const currentParams = new URLSearchParams(window.location.search);
    const currentSlug = currentParams.get("album");

    if (viewMode === "DETAIL") {
      const targetSlug = getSlug(ALBUMS[currentIndex].id);
      if (currentSlug !== targetSlug) {
        const newUrl = `${window.location.pathname}?album=${targetSlug}`;
        window.history.pushState({ path: newUrl }, "", newUrl);
      }
    } else {
      // STACK mode
      if (currentSlug) {
        const newUrl = window.location.pathname; // Remove query
        window.history.pushState({ path: newUrl }, "", newUrl);
      }
    }
  }, [viewMode, currentIndex]);

  // Updated handlers to use history where appropriate or rely on state sync
  // Actually, we can just update state, and the Effect above will update URL.
  // But for Back button, we need to ensure we don't trap user.
  // handleBackToStack just sets ViewMode 'STACK'. The Effect will remove the URL param.
  // "Back" in browser (popstate) will trigger handleUrlChange -> setViewMode('STACK').
  // Perfect.

  // Music State
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [wasPlayingBeforeVideo, setWasPlayingBeforeVideo] = useState(false); // Audio Ducking State
  const [playbackCycle, setPlaybackCycle] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMusicPlayingRef = useRef(isMusicPlaying);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const BGM_TRACK = "/musics/00bgm.mp3";
  // Responsive volume: mobile devices get lower volume for comfort
  const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const MUSIC_TARGET_VOLUME = isMobile ? 0.2 : 0.4;
  const MUSIC_FADE_IN_DURATION = 0.9;

  const getCurrentAudioLevel = useCallback(() => {
    if (gainNodeRef.current) return gainNodeRef.current.gain.value;
    return audioRef.current?.volume ?? 0;
  }, []);

  const setAudioLevel = useCallback((level: number) => {
    const clamped = Math.max(0, Math.min(1, level));
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clamped;
      return;
    }
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  const getAudioSourcePath = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio || typeof window === "undefined") return null;

    const rawSrc = audio.currentSrc || audio.src || audio.getAttribute("src") || "";
    if (!rawSrc) return null;

    try {
      return new URL(rawSrc, window.location.href).pathname;
    } catch {
      return rawSrc.startsWith("/") ? rawSrc : null;
    }
  }, []);

  const restoreAudioTime = useCallback((audio: HTMLAudioElement, time: number) => {
    if (time <= 0) return;

    const seek = () => {
      audio.currentTime = time;
    };

    if (audio.readyState >= 1) {
      seek();
      return;
    }

    const handleLoadedMetadata = () => {
      seek();
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
  }, []);

  const ensureWebAudioGraph = useCallback(async () => {
    if (!audioRef.current || !isMobile || typeof window === 'undefined') return;
    if (gainNodeRef.current && audioContextRef.current && sourceNodeRef.current) {
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume().catch(() => undefined);
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const source = ctx.createMediaElementSource(audioRef.current);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(ctx.destination);

    // Keep element volume maxed; use GainNode for runtime fades on mobile.
    audioRef.current.volume = 1;

    audioContextRef.current = ctx;
    sourceNodeRef.current = source;
    gainNodeRef.current = gain;

    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => undefined);
    }
  }, [isMobile]);

  useEffect(() => {
    isMusicPlayingRef.current = isMusicPlaying;
  }, [isMusicPlaying]);

  useEffect(() => {
    // Initialize Audio
    audioRef.current = new Audio(BGM_TRACK);
    audioRef.current.loop = false;
    audioRef.current.volume = 0; // Initialize silent

    return () => {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.disconnect();
        gainNodeRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [BGM_TRACK]);

  // Unlock AudioContext on first interaction
  const primeAudio = useCallback(() => {
    if (audioRef.current) {
      // Play comfortably silence (muted) to unlock capabilities
      // Volume 0 is not enough on iOS (hardware volume control)
      audioRef.current.muted = true;
      ensureWebAudioGraph().catch(() => undefined);
      audioRef.current
        .play()
        .catch((e) => console.log("Audio Prime Failed:", e));
    }
  }, [ensureWebAudioGraph]);

  // BGM Persistence State
  const bgmState = useRef<{ isPlaying: boolean; currentTime: number }>({
    isPlaying: false,
    currentTime: 0,
  });

  // Handle Track Switching & Auto-Play on View Change
  useEffect(() => {
    if (!audioRef.current) return;

    const switchTrack = async (
      newSrc: string,
      mode: "ENTER_ALBUM" | "RETURN_HOME",
    ) => {
      if (!audioRef.current) return;

      const currentSrc = getAudioSourcePath(audioRef.current);

      if (mode === "ENTER_ALBUM") {
        // LEAVING HOME: Save BGM State
        if (currentSrc === BGM_TRACK) {
          bgmState.current = {
            isPlaying: isMusicPlayingRef.current,
            currentTime: audioRef.current.currentTime,
          };
        }

        // Switch to Album Music
        if (currentSrc !== newSrc) {
          audioRef.current.src = newSrc;
          audioRef.current.load();
        }

        // Attempt Auto-Play
        audioRef.current.muted = false; // Ensure unmuted
        setAudioLevel(0);
        audioRef.current
          .play()
          .then(() => {
            setPlaybackCycle((prev) => prev + 1);
            if (!isMusicPlayingRef.current) {
              setIsMusicPlaying(true);
            }
          })
          .catch((e) => {
            console.log(
              "Album auto-play blocked (user interaction required):",
              e,
            );
            setIsMusicPlaying(false);
          });
      } else if (mode === "RETURN_HOME") {
        // RETURNING HOME: Switch back to BGM
        if (currentSrc !== BGM_TRACK) {
          audioRef.current.src = BGM_TRACK;
          audioRef.current.load();
          restoreAudioTime(audioRef.current, bgmState.current.currentTime);
        }

        // Restore Play State
        if (bgmState.current.isPlaying) {
          audioRef.current.muted = false; // Ensure unmuted
          setAudioLevel(0);
          audioRef.current
            .play()
            .then(() => {
              setPlaybackCycle((prev) => prev + 1);
              if (!isMusicPlayingRef.current) {
                setIsMusicPlaying(true);
              }
            })
            .catch((e) => {
              console.log("BGM Resume Failed:", e);
              setIsMusicPlaying(false);
            });
        } else {
          setIsMusicPlaying(false);
          audioRef.current.pause();
        }
      }
    };

    if (viewMode === "DETAIL") {
      // ENTERING ALBUM
      const albumMusic = activeAlbum.musicFile || "/musics/00bgm.mp3";
      switchTrack(albumMusic, "ENTER_ALBUM");
    } else {
      // STACK MODE
      // Logic Optimization: Only switch/restore if we are NOT already playing the BGM.
      // This prevents stopping the music when just swiping through albums on the homepage.
      const currentSrc = getAudioSourcePath(audioRef.current);
      if (currentSrc !== BGM_TRACK) {
        switchTrack(BGM_TRACK, "RETURN_HOME");
      }
    }
  }, [viewMode, activeAlbum, setAudioLevel, getAudioSourcePath, BGM_TRACK, restoreAudioTime]);

  // Handle Play/Pause Toggle
  useEffect(() => {
    if (!audioRef.current) return;

    let controlsPrimary: any;
    let controlsSecondary: any;
    let isCancelled = false;

    if (isMusicPlaying) {
      audioRef.current.muted = false; // Ensure unmuted

      const startVolume = getCurrentAudioLevel();
      const targetVolume = MUSIC_TARGET_VOLUME;

      // Play audio
      const playPromise = audioRef.current.play();
      if (playPromise) {
        playPromise.catch((e) => console.log("Autoplay prevented:", e));
      }

      // Two-stage fade-in: softly introduce, then settle at target volume.
      if (Math.abs(startVolume - targetVolume) > 0.01) {
        if (startVolume < targetVolume) {
          const introVolume = Math.min(targetVolume, 0.12);
          const stageOneDuration = Math.max(0.25, MUSIC_FADE_IN_DURATION * 0.35);
          const stageTwoDuration = Math.max(
            0.25,
            MUSIC_FADE_IN_DURATION - stageOneDuration,
          );

          const runTwoStageFade = async () => {
            controlsPrimary = animate(startVolume, introVolume, {
              duration: stageOneDuration,
              ease: "easeOut",
              onUpdate: (v) => {
                setAudioLevel(v);
              },
            });
            await controlsPrimary.finished.catch(() => undefined);
            if (isCancelled) return;

            controlsSecondary = animate(introVolume, targetVolume, {
              duration: stageTwoDuration,
              ease: "easeInOut",
              onUpdate: (v) => {
                setAudioLevel(v);
              },
            });
          };

          runTwoStageFade();
        } else {
          controlsPrimary = animate(startVolume, targetVolume, {
            duration: MUSIC_FADE_IN_DURATION,
            onUpdate: (v) => {
              setAudioLevel(v);
            },
          });
        }
      } else {
        setAudioLevel(targetVolume);
      }
    } else {
      audioRef.current.pause();
    }

    return () => {
      isCancelled = true;
      if (controlsPrimary) controlsPrimary.stop();
      if (controlsSecondary) controlsSecondary.stop();
    };
  }, [isMusicPlaying, playbackCycle, MUSIC_TARGET_VOLUME, getCurrentAudioLevel, setAudioLevel]);

  const handleMusicToggle = () => {
    setIsMusicPlaying((prev) => !prev);
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

  // Determine active album for decorations (headers/footers)
  // If we are on the Cheers page (index = length), use the last album's style
  const displayAlbum = ALBUMS[Math.min(currentIndex, ALBUMS.length - 1)];

  // Background Colors Logic
  // If distinct "Cheers" page logic is needed for background override:
  const isCheersPage = viewMode === "STACK" && currentIndex === ALBUMS.length;
  const bgProps = showOpening
     ? { color: "transparent", backgroundColor: "#F3F3F1" } // Root canvas token
     : isCheersPage 
     ? { color: "#E5E5E5", backgroundColor: "#FFFFFF" } // Pure White + Light Grey for Cheers
     : { color: displayAlbum.color, backgroundColor: displayAlbum.backgroundColor };

  return (
    <div className="h-[100dvh] w-full relative selection:bg-neutral-900 selection:text-white overflow-hidden">
      
      
      {/* Loading Screen (while audio preloads) */}
      <AnimatePresence>
        {showOpening && !audioLoaded && (
          <LoadingScreen />
        )}
      </AnimatePresence>

      {/* Opening Screen (Only after audio loaded) */}
      <AnimatePresence>
        {showOpening && audioLoaded && (
          <OpeningScreen
            onStart={primeAudio}
          onComplete={() => {
            setShowOpening(false);
            // No longer using session storage to block future visits
            // sessionStorage.setItem('hasVisited', 'true');

            // Auto-play BGM on entry (User interaction has occurred in OpeningScreen)
            setIsMusicPlaying(true);
          }}
        />
      )}
      </AnimatePresence>

      {/* Background Layer */}
      <CinematicBackground
        color={bgProps.color}
        backgroundColor={bgProps.backgroundColor}
      />

      {/* Main Content Area */}
      <main
        className={`w-full h-full relative ${showOpening ? "opacity-0" : "opacity-100 transition-opacity duration-1000"}`}
        style={{ zIndex: Z.CONTENT }}
      >
        <AnimatePresence>
          {viewMode === "STACK" ? (
            <motion.div 
              className="w-full h-full" 
              key="stack-container"
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {/* Header for Stack Mode */}
              <header className="absolute top-0 left-0 right-0 px-6 py-6 md:p-8 flex justify-between items-center pointer-events-none" style={{ zIndex: Z.HEADER }}>
                <div className="pointer-events-auto relative flex flex-col items-center justify-center">
                  <motion.h1
                    className="text-xs md:text-sm font-bold tracking-tight"
                    animate={{ color: displayAlbum.textColor }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
                  >
                    DAI<span style={{ opacity: 0.55 }}>.DESIGN</span>
                  </motion.h1>
                  {/* Dynamic Brand Accent Bar - Absolute to not affect text alignment */}
                  <div
                    className="absolute top-full left-0 w-8 h-0.5 mt-2 transition-colors duration-500"
                    style={{ backgroundColor: displayAlbum.color }}
                  ></div>
                </div>

                <div className="flex items-center justify-end pointer-events-auto">
                  {/* Music Control - Top Right */}
                  <button
                    onClick={handleMusicToggle}
                    className={`flex items-center gap-3 transition-all duration-500 group cursor-pointer ${isMusicPlaying ? "opacity-100" : "opacity-40 hover:opacity-80"}`}
                  >
                    {/* Spectrum Visualizer */}
                    <div className="flex items-end gap-[2px] h-3">
                      {[0.4, 0.8, 0.5, 0.9].map((h, i) => (
                        <motion.div
                          key={i}
                          className="w-[2px]"
                          animate={{
                            height: isMusicPlaying && !prefersReducedMotion
                              ? ["20%", "70%", "30%", "60%", "20%"]
                              : isMusicPlaying ? "60%" : "25%",
                          }}
                          transition={
                            prefersReducedMotion ? { duration: 0 } :
                            isMusicPlaying
                              ? {
                                  duration: 1.5,
                                  repeat: Infinity,
                                  repeatType: "mirror",
                                  delay: i * 0.2,
                                  ease: "easeInOut",
                                }
                              : {
                                  duration: 0.5,
                                }
                          }
                          style={{ backgroundColor: displayAlbum.textColor }}
                        />
                      ))}
                    </div>

                    {/* Title */}
                    <motion.span
                      className="text-[10px] font-bold tracking-widest uppercase leading-none mt-[1px]"
                      animate={{ color: displayAlbum.textColor }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
                    >
                      {viewMode === "DETAIL" && activeAlbum?.musicFile
                        ? "Now Playing"
                        : "BGM"}
                    </motion.span>
                  </button>
                </div>
              </header>

              {/* Stack vs Cheers Structure Refactor: Keep Stack Mounted */}
              <div className="relative w-full h-full">
                  {/* Layer 1: Album Stack (Always Mounted to prevent re-layout tremble) */}
                  <motion.div
                      className="absolute inset-0 w-full h-full"
                      animate={{ 
                          opacity: currentIndex < ALBUMS.length ? 1 : 0,
                          scale: currentIndex < ALBUMS.length ? 1 : 0.95,
                          filter: currentIndex < ALBUMS.length ? "blur(0px)" : "blur(10px)",
                          pointerEvents: currentIndex < ALBUMS.length ? "auto" : "none"
                      }}
                      transition={{ duration: 0.5 }}
                  >
                      <AlbumStack
                          albums={ALBUMS}
                          currentIndex={Math.min(currentIndex, ALBUMS.length - 1)} // Clamp index for stack logic so it doesn't go out of bounds visually
                          onIndexChange={handleIndexChange}
                          onSelect={handleSelectAlbum}
                      />
                  </motion.div>

                  {/* Layer 2: Cheers Overlay */}
                  <AnimatePresence>
                      {currentIndex === ALBUMS.length && (
                          <motion.div
                              key="cheers"
                              className="absolute inset-0 z-20 w-full h-full"
                              initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                              exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                              transition={{ duration: 0.5 }}
                          >
                              <Cheers 
                                  onBack={() => handleIndexChange(ALBUMS.length - 1)} 
                                  count={cheersCount}
                                  increment={incrementCheers}
                              />
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>



              {/* Footer for Stack Mode */}
              <footer className="absolute bottom-0 left-0 right-0 px-6 py-6 md:p-8 flex justify-between items-end pointer-events-none" style={{ zIndex: Z.HEADER }}>
                <motion.p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  animate={{ color: displayAlbum.textColor }}
                  style={{ opacity: 0.4 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
                >
                  Stay hungry, Stay foolish
                </motion.p>
                <motion.p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  animate={{ color: displayAlbum.textColor }}
                  style={{ opacity: 0.5 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
                >
                  {String(Math.min(currentIndex + 1, ALBUMS.length)).padStart(2, "0")} /{" "}
                  {String(ALBUMS.length).padStart(2, "0")}
                </motion.p>
              </footer>
            </motion.div>
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
