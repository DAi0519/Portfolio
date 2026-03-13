import { useEffect, useMemo, useState } from "react";

type FontLoadStatus = "loading" | "ready" | "degraded";

interface CriticalFontDefinition {
  descriptor: string;
  text: string;
}

interface CriticalFontState {
  ready: boolean;
  status: FontLoadStatus;
}

const fontLoadCache = new Map<string, Promise<void>>();

const loadFont = async ({ descriptor, text }: CriticalFontDefinition) => {
  const cacheKey = `${descriptor}::${text}`;
  const cachedPromise = fontLoadCache.get(cacheKey);

  if (cachedPromise) {
    return cachedPromise;
  }

  const promise = document.fonts.load(descriptor, text).then(() => undefined);
  fontLoadCache.set(cacheKey, promise);
  return promise;
};

export const useCriticalFonts = (
  fonts: CriticalFontDefinition[],
  timeoutMs = 3500,
): CriticalFontState => {
  const serializedFonts = useMemo(() => JSON.stringify(fonts), [fonts]);
  const [state, setState] = useState<CriticalFontState>({
    ready: fonts.length === 0,
    status: fonts.length === 0 ? "ready" : "loading",
  });

  useEffect(() => {
    if (typeof document === "undefined" || !("fonts" in document)) {
      setState({ ready: true, status: "ready" });
      return;
    }

    const parsedFonts = JSON.parse(serializedFonts) as CriticalFontDefinition[];
    if (parsedFonts.length === 0) {
      setState({ ready: true, status: "ready" });
      return;
    }

    let active = true;
    setState({ ready: false, status: "loading" });

    const timeoutId = window.setTimeout(() => {
      if (!active) return;
      console.warn("Critical font load timed out - proceeding with current font state");
      setState({ ready: true, status: "degraded" });
    }, timeoutMs);

    Promise.all(parsedFonts.map(loadFont))
      .then(() => {
        if (!active) return;
        window.clearTimeout(timeoutId);
        setState({ ready: true, status: "ready" });
      })
      .catch(() => {
        if (!active) return;
        window.clearTimeout(timeoutId);
        setState({ ready: true, status: "degraded" });
      });

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [serializedFonts, timeoutMs]);

  return state;
};
