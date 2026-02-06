import { useState, useEffect } from 'react';

export const useAudioPreloader = (urls: string[]) => {
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let mounted = true;
    let loadedCount = 0;
    const total = urls.length;

    if (total === 0) {
      setLoaded(true);
      return;
    }

    const incrementProgress = () => {
      if (!mounted) return;
      loadedCount++;
      setProgress((loadedCount / total) * 100);
      if (loadedCount >= total) {
        setLoaded(true);
      }
    };

    urls.forEach(url => {
        const audio = new Audio();
        audio.src = url;
        // Preload 'auto' or 'metadata' might not be enough for 'canplaythrough' in some browsers without user interaction context?
        // Actually for pure caching, just setting src and preload is usually enough to start the request.
        // We use 'canplaythrough' to ensure it's ready for seamless playback.
        audio.preload = 'auto'; 
        
        const onLoaded = () => {
           incrementProgress();
           cleanup();
        };

        const onError = () => {
            console.warn(`Failed to preload audio: ${url}`);
            incrementProgress(); // Proceed anyway to avoid blocking execution
            cleanup();
        };

        const cleanup = () => {
            audio.removeEventListener('canplaythrough', onLoaded);
            audio.removeEventListener('error', onError);
        };

        audio.addEventListener('canplaythrough', onLoaded, { once: true });
        audio.addEventListener('error', onError, { once: true });
        
        // Trigger load
        audio.load();
    });

    return () => {
      mounted = false;
    };
  }, [JSON.stringify(urls)]); // Simple dependency check

  return { loaded, progress };
};
