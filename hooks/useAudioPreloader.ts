import { useEffect, useMemo, useState } from "react";

type AudioPreloadStatus = "loading" | "ready" | "degraded" | "error";

interface AudioPreloadState {
  assets: Record<string, string>;
  failed: string[];
  progress: number;
  ready: boolean;
  status: AudioPreloadStatus;
}

const objectUrlCache = new Map<string, string>();
const preloadPromiseCache = new Map<string, Promise<string>>();

const preloadAudioAsset = async (url: string): Promise<string> => {
  const cachedObjectUrl = objectUrlCache.get(url);
  if (cachedObjectUrl) {
    return cachedObjectUrl;
  }

  const cachedPromise = preloadPromiseCache.get(url);
  if (cachedPromise) {
    return cachedPromise;
  }

  const promise = fetch(url, { cache: "force-cache" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Failed to preload audio: ${url} (${response.status})`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      objectUrlCache.set(url, objectUrl);
      return objectUrl;
    })
    .catch((error) => {
      preloadPromiseCache.delete(url);
      throw error;
    });

  preloadPromiseCache.set(url, promise);
  return promise;
};

export const useAudioPreloader = (
  urls: string[],
  timeoutMs = 4000,
): AudioPreloadState => {
  const serializedUrls = useMemo(() => JSON.stringify(urls), [urls]);
  const [state, setState] = useState<AudioPreloadState>({
    assets: {},
    failed: [],
    progress: urls.length === 0 ? 100 : 0,
    ready: urls.length === 0,
    status: urls.length === 0 ? "ready" : "loading",
  });

  useEffect(() => {
    const requestedUrls = JSON.parse(serializedUrls) as string[];

    if (requestedUrls.length === 0) {
      setState({
        assets: {},
        failed: [],
        progress: 100,
        ready: true,
        status: "ready",
      });
      return;
    }

    let active = true;
    let settledCount = 0;
    let failureCount = 0;
    const pendingUrls = new Set(requestedUrls);
    const nextAssets: Record<string, string> = {};
    const failedUrls = new Set<string>();

    setState({
      assets: requestedUrls.reduce<Record<string, string>>((acc, url) => {
        const cached = objectUrlCache.get(url);
        if (cached) {
          acc[url] = cached;
        }
        return acc;
      }, {}),
      failed: [],
      progress: 0,
      ready: false,
      status: "loading",
    });

    const updateState = (statusOverride?: AudioPreloadStatus) => {
      if (!active) return;

      const progress = Math.round((settledCount / requestedUrls.length) * 100);
      const status =
        statusOverride ??
        (failureCount === requestedUrls.length ? "error" : "ready");

      setState({
        assets: { ...nextAssets },
        failed: Array.from(failedUrls),
        progress: settledCount === requestedUrls.length ? 100 : progress,
        ready: status !== "loading",
        status,
      });
    };

    const timeoutId = window.setTimeout(() => {
      if (!active || settledCount === requestedUrls.length) return;

      console.warn("Critical audio preload timed out - proceeding with fallback URLs");
      updateState("degraded");
    }, timeoutMs);

    requestedUrls.forEach((url) => {
      preloadAudioAsset(url)
        .then((objectUrl) => {
          if (!active) return;
          nextAssets[url] = objectUrl;
        })
        .catch((error) => {
          if (!active) return;
          console.warn(`Audio preload failed for ${url}`, error);
          failedUrls.add(url);
          failureCount += 1;
        })
        .finally(() => {
          if (!active) return;

          settledCount += 1;
          pendingUrls.delete(url);

          if (settledCount === requestedUrls.length) {
            window.clearTimeout(timeoutId);
            updateState();
            return;
          }

          const progress = Math.round((settledCount / requestedUrls.length) * 100);
          setState((previous) => ({
            assets: { ...previous.assets, ...nextAssets },
            failed: Array.from(failedUrls),
            progress,
            ready: previous.ready,
            status: previous.status,
          }));
        });
    });

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [serializedUrls, timeoutMs]);

  return state;
};
