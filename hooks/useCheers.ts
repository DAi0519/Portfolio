import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const SYNC_DEBOUNCE_MS = 2000;
const STORAGE_KEY = 'cheers_local_count';

export function useCheers() {
  const [initialCount, setInitialCount] = useState<number>(0);
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ref to track session count for syncing without dependency cycles
  const sessionCountRef = useRef(0);
  
  // Initialize: Fetch global count and load local buffer
  useEffect(() => {
    async function init() {
      // 1. Load any unsynced local clicks
      const savedLocal = localStorage.getItem(STORAGE_KEY);
      const localCount = savedLocal ? parseInt(savedLocal, 10) : 0;
      if (localCount > 0) {
        setSessionCount(localCount);
        sessionCountRef.current = localCount;
      }

      // 2. Fetch global count
      try {
        const { data, error } = await supabase
          .from('counters')
          .select('count')
          .eq('id', 'cheers')
          .single();
        
        if (data) {
          setInitialCount(Number(data.count));
        } else if (error && error.code !== 'PGRST116') {
            console.error('Error fetching cheers count:', error);
        }
      } catch (err) {
        console.error('Failed to initialize cheers:', err);
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, []);

  // Sync function: Pushes local clicks to server
  const syncToServer = useCallback(async () => {
    const amountToSync = sessionCountRef.current;
    if (amountToSync === 0) return;

    try {
      const { error } = await supabase.rpc('increment_cheers', { amount: amountToSync });
      
      if (!error) {
        // On success:
        // 1. We assume the server is now initial + amount (plus others' clicks)
        // For simplicity and immediate feedback, we just shift our local count to initial
        setInitialCount(prev => prev + amountToSync);
        
        // 2. Reduce local count by the amount we just synced
        // Use functional state to handle race conditions if user clicked while syncing
        setSessionCount(prev => {
            const newValue = prev - amountToSync;
            sessionCountRef.current = newValue;
            localStorage.setItem(STORAGE_KEY, newValue.toString());
            return newValue;
        });
      } else {
        console.error('Sync failed:', error);
      }
    } catch (err) {
      console.error('Sync error:', err);
    }
  }, []);

  // Debounced sync
  useEffect(() => {
    // Don't setup timer if nothing to sync
    if (sessionCount === 0) return;

    const timer = setTimeout(() => {
        syncToServer();
    }, SYNC_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [sessionCount, syncToServer]);

  // Public increment function
  const increment = useCallback(() => {
    setSessionCount(prev => {
      const newVal = prev + 1;
      sessionCountRef.current = newVal;
      localStorage.setItem(STORAGE_KEY, newVal.toString());
      return newVal;
    });
  }, []);

  return {
    count: initialCount + sessionCount,
    isLoading,
    increment
  };
}
