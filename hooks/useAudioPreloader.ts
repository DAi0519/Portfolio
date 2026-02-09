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

    const checkAllLoaded = () => {
      if (!mounted) return;
      // If we have "loaded" enough to consider it done.
      // We don't want to be 100% strict if one fails or times out.
      if (loadedCount >= total) {
        setLoaded(true);
      }
    };

    const incrementProgress = () => {
      if (!mounted) return;
      loadedCount++;
      setProgress((loadedCount / total) * 100);
      checkAllLoaded();
    };

    // Global Timeout Fallback
    // If audio takes too long (e.g. mobile Safari blocking download until interaction),
    // we just let the user in.
    const timeoutId = setTimeout(() => {
        if (mounted && !loaded) {
            console.warn('Audio preload timed out - proceeding anyway');
            setLoaded(true); 
            // In a real scenario, we might want to cancel pending loads, 
            // but for simple Audio elements we just leave them be.
        }
    }, 4000); // 4 seconds max wait

    const audioElements: HTMLAudioElement[] = [];

    urls.forEach(url => {
        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto'; // Important for mobile to *try* to download
        audioElements.push(audio);
        
        // Track completion status for this specific file
        let isFileDone = false;

        const onDone = () => {
           if (isFileDone) return;
           isFileDone = true;
           incrementProgress();
           cleanup();
        };

        const cleanup = () => {
            audio.removeEventListener('canplaythrough', onDone);
            audio.removeEventListener('load', onDone);
            audio.removeEventListener('error', onDone);
            // On mobile, sometimes 'loadeddata' is the best we get without interaction
            audio.removeEventListener('loadeddata', onDone); 
        };

        // Multiple success criteria
        audio.addEventListener('canplaythrough', onDone, { once: true });
        audio.addEventListener('load', onDone, { once: true });
        audio.addEventListener('loadeddata', onDone, { once: true });
        audio.addEventListener('error', onDone, { once: true }); // Count errors as 'done' so we don't hang

        // Trigger load
        audio.load();
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      audioElements.forEach(audio => {
          audio.src = ''; // Cancel requests if unmounting
          audio.load();
      });
    };
  }, [JSON.stringify(urls)]); 

  return { loaded, progress };
};
