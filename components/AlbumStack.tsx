import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Album } from "../types";

type ViewportMode = "MOBILE" | "TABLET" | "DESKTOP";
type InfoMode = "full" | "subtitle" | "hidden";

interface AlbumStackProps {
  albums: Album[];
  currentIndex: number;
  maxIndex: number;
  onIndexChange: (index: number) => void;
  onSelect: (index: number) => void;
}

/* ─────────────────────────────────────────────────────────
 * STACK INFO STORYBOARD
 *
 * Read top-to-bottom. These cues support the cover, they do
 * not compete with it.
 *
 *    0ms   active cover settles into place
 *  120ms   title block fades up beneath the cover
 * ───────────────────────────────────────────────────────── */

const STACK_INFO_TIMING = {
  contentEnter: 400, // title/subtitle block fade and rise
  contentExit: 280, // outgoing info block fade
} as const;

const STACK_LAYOUT = {
  breakpoint: {
    mobile: 768,
    desktop: 1280,
    narrowMobile: 430,
  },
  stage: {
    headerClearMobile: 78,
    headerClearDesktop: 96,
    footerClearMobile: 36,
    footerClearDesktop: 44,
    shortScreenHeight: 440,
    centerBiasNarrowMobile: 14,
    centerBiasMobile: 20,
    centerBiasTablet: 12,
    centerBiasDesktop: 8,
  },
  card: {
    activeScale: 1.1,
    mobileMax: 280,
    desktopMax: 480,
    mobileWidthRatio: 0.55,
    desktopWidthRatio: 0.22,
    desktopMin: 300,
    minFloorMobile: 120,
    minFloorTablet: 176,
    minFloorDesktop: 192,
  },
  spacing: {
    breathingGapNarrowMobile: 24,
    breathingGapMobile: 32,
    breathingGapTablet: 44,
    breathingGapDesktop: 56,
    maxGapNarrowMobile: 44,
    maxGapMobile: 60,
    maxGapLarge: 100,
    xSpacingMobile: 85,
    infoInsetMobile: 8,
    infoInsetTablet: 10,
    infoInsetDesktop: 12,
  },
  fallbackHeight: {
    fullNarrowMobile: 124,
    fullMobile: 140,
    fullLarge: 160,
    subtitleNarrowMobile: 42,
    subtitleMobile: 48,
    subtitleLarge: 56,
  },
  topBottomRatio: {
    narrowMobile: 1.08,
    mobile: 1,
    tablet: 1,
    desktop: 1.02,
  },
} as const;

const seconds = (ms: number) => ms / 1000;

const AlbumStack: React.FC<AlbumStackProps> = ({
  albums,
  currentIndex,
  maxIndex,
  onIndexChange,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullMeasureRef = useRef<HTMLDivElement>(null);
  const subtitleMeasureRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = useReducedMotion();
  const [measuredFullHeight, setMeasuredFullHeight] = useState(160);
  const [measuredSubtitleHeight, setMeasuredSubtitleHeight] = useState(56);
  const [dragX, setDragX] = useState(0);
  const isDragging = useRef(false);
  const isPressed = useRef(false);
  const startX = useRef(0);

  const [layout, setLayout] = useState({
    mode: "DESKTOP" as ViewportMode,
    width: window.innerWidth,
    height: window.innerHeight,
    isShort: window.innerHeight < 600,
    infoMode: "full" as InfoMode,
    cardSize: 320,
    xSpacing: 200,
    stageTop: 120,
    stageBottom: 260,
    titleTop: 520,
  });

  const subtitleFontSize =
    layout.mode === "MOBILE"
      ? "clamp(0.78rem, 2vmin, 0.98rem)"
      : "clamp(0.85rem, 2.2vmin, 1.1rem)";
  const titleBottomGapClass = layout.mode === "DESKTOP" ? "mb-4" : "mb-2";
  const subtitleTopGapClass = layout.mode === "DESKTOP" ? "mt-5" : "mt-3";
  const lightweightEffects = prefersReducedMotion || layout.mode === "MOBILE";
  const activeAlbum = albums[Math.min(currentIndex, albums.length - 1)];
  const activeCardWidth = layout.cardSize * STACK_LAYOUT.card.activeScale;
  const contentInset =
    layout.mode === "DESKTOP"
      ? STACK_LAYOUT.spacing.infoInsetDesktop
      : layout.mode === "TABLET"
        ? STACK_LAYOUT.spacing.infoInsetTablet
        : STACK_LAYOUT.spacing.infoInsetMobile;
  const isFullInfo = layout.infoMode === "full";

  useLayoutEffect(() => {
    const fullNode = fullMeasureRef.current;
    const subtitleNode = subtitleMeasureRef.current;
    if (!fullNode || !subtitleNode) return;

    const updateHeights = () => {
      const nextFullHeight = Math.ceil(fullNode.getBoundingClientRect().height);
      const nextSubtitleHeight = Math.ceil(
        subtitleNode.getBoundingClientRect().height,
      );

      if (nextFullHeight > 0) {
        setMeasuredFullHeight((prev) =>
          Math.abs(prev - nextFullHeight) > 1 ? nextFullHeight : prev,
        );
      }

      if (nextSubtitleHeight > 0) {
        setMeasuredSubtitleHeight((prev) =>
          Math.abs(prev - nextSubtitleHeight) > 1 ? nextSubtitleHeight : prev,
        );
      }
    };

    const rafId = window.requestAnimationFrame(updateHeights);
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updateHeights())
        : null;

    observer?.observe(fullNode);
    observer?.observe(subtitleNode);
    window.addEventListener("resize", updateHeights);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener("resize", updateHeights);
    };
  }, [currentIndex, albums]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let mode: ViewportMode = "DESKTOP";
      if (width < STACK_LAYOUT.breakpoint.mobile) mode = "MOBILE";
      else if (width < STACK_LAYOUT.breakpoint.desktop) mode = "TABLET";

      const isNarrowMobile =
        mode === "MOBILE" && width < STACK_LAYOUT.breakpoint.narrowMobile;
      const isDesktop = mode === "DESKTOP";

      const breathingGap = isNarrowMobile
        ? STACK_LAYOUT.spacing.breathingGapNarrowMobile
        : mode === "MOBILE"
          ? STACK_LAYOUT.spacing.breathingGapMobile
          : isDesktop
            ? STACK_LAYOUT.spacing.breathingGapDesktop
            : STACK_LAYOUT.spacing.breathingGapTablet;
      const maxGap = isNarrowMobile
        ? STACK_LAYOUT.spacing.maxGapNarrowMobile
        : mode === "MOBILE"
          ? STACK_LAYOUT.spacing.maxGapMobile
          : STACK_LAYOUT.spacing.maxGapLarge;
      const fallbackFullHeight = isNarrowMobile
        ? STACK_LAYOUT.fallbackHeight.fullNarrowMobile
        : mode === "MOBILE"
          ? STACK_LAYOUT.fallbackHeight.fullMobile
          : STACK_LAYOUT.fallbackHeight.fullLarge;
      const fallbackSubtitleHeight = isNarrowMobile
        ? STACK_LAYOUT.fallbackHeight.subtitleNarrowMobile
        : mode === "MOBILE"
          ? STACK_LAYOUT.fallbackHeight.subtitleMobile
          : STACK_LAYOUT.fallbackHeight.subtitleLarge;
      const fullInfoHeight = Math.max(fallbackFullHeight, measuredFullHeight);
      const subtitleInfoHeight = Math.max(
        fallbackSubtitleHeight,
        measuredSubtitleHeight,
      );
      const headerClear =
        mode === "MOBILE"
          ? STACK_LAYOUT.stage.headerClearMobile
          : STACK_LAYOUT.stage.headerClearDesktop;
      const footerClear =
        mode === "MOBILE"
          ? STACK_LAYOUT.stage.footerClearMobile
          : STACK_LAYOUT.stage.footerClearDesktop;
      const topBottomRatio = isNarrowMobile
        ? STACK_LAYOUT.topBottomRatio.narrowMobile
        : mode === "MOBILE"
          ? STACK_LAYOUT.topBottomRatio.mobile
          : isDesktop
            ? STACK_LAYOUT.topBottomRatio.desktop
            : STACK_LAYOUT.topBottomRatio.tablet;
      const centerBias = isNarrowMobile
        ? STACK_LAYOUT.stage.centerBiasNarrowMobile
        : mode === "MOBILE"
          ? STACK_LAYOUT.stage.centerBiasMobile
          : isDesktop
            ? STACK_LAYOUT.stage.centerBiasDesktop
            : STACK_LAYOUT.stage.centerBiasTablet;

      const widthBase =
        mode === "MOBILE"
          ? Math.min(
              STACK_LAYOUT.card.mobileMax,
              width * STACK_LAYOUT.card.mobileWidthRatio,
            )
          : Math.min(
              STACK_LAYOUT.card.desktopMax,
              Math.max(
                STACK_LAYOUT.card.desktopMin,
                width * STACK_LAYOUT.card.desktopWidthRatio,
              ),
            );
      const minCardFloor =
        mode === "MOBILE"
          ? STACK_LAYOUT.card.minFloorMobile
          : mode === "TABLET"
            ? STACK_LAYOUT.card.minFloorTablet
            : STACK_LAYOUT.card.minFloorDesktop;
      const availableVertical = height - headerClear - footerClear;

      let cardSize = widthBase;
      let infoMode: InfoMode = "full";
      let infoGap = breathingGap;

      if (availableVertical - cardSize - breathingGap < fullInfoHeight) {
        infoMode = "subtitle";
      }

      if (availableVertical - cardSize - breathingGap < subtitleInfoHeight) {
        infoMode = "hidden";
        infoGap = 0;
      }

      if (infoMode !== "full" && availableVertical < cardSize) {
        cardSize = Math.min(widthBase, availableVertical);
      }

      const isShort =
        availableVertical < minCardFloor ||
        height < STACK_LAYOUT.stage.shortScreenHeight;

      if (isShort) {
        const stageHeight = Math.max(0, height - 80 - 60);
        const shortCardSize = Math.min(
          Math.max(120, Math.min(widthBase, height * 0.55)),
          stageHeight,
        );
        const xSpacing =
          mode === "MOBILE"
            ? STACK_LAYOUT.spacing.xSpacingMobile
            : shortCardSize * 0.6;

        setLayout({
          mode,
          width,
          height,
          isShort,
          infoMode: "hidden",
          cardSize: shortCardSize,
          xSpacing,
          stageTop: 80,
          stageBottom: 60,
          titleTop: height,
        });
        return;
      }

      if (infoMode === "hidden") {
        cardSize = Math.max(minCardFloor, Math.min(cardSize, availableVertical));
      }

      const visibleInfoHeight =
        infoMode === "full"
          ? fullInfoHeight
          : infoMode === "subtitle"
            ? subtitleInfoHeight
            : 0;
      let remainingAfterUnit = Math.max(
        0,
        availableVertical - cardSize - visibleInfoHeight - infoGap,
      );

      if (infoMode !== "hidden" && remainingAfterUnit > 0) {
        const gapBoost = Math.min(maxGap - infoGap, Math.round(remainingAfterUnit * 0.22));
        infoGap += gapBoost;
        remainingAfterUnit -= gapBoost;
      }

      const unitHeight = cardSize + infoGap + visibleInfoHeight;
      const remainingWhitespace = Math.max(0, availableVertical - unitHeight);
      const bottomWhitespace = Math.round(
        remainingWhitespace / (1 + topBottomRatio),
      );
      const topWhitespace = remainingWhitespace - bottomWhitespace;
      const maxUnitTop = height - footerClear - unitHeight;
      const unitTop = Math.min(
        headerClear + topWhitespace + centerBias,
        maxUnitTop,
      );
      const xSpacing =
        mode === "MOBILE"
          ? STACK_LAYOUT.spacing.xSpacingMobile
          : cardSize * 0.6;

      setLayout({
        mode,
        width,
        height,
        isShort,
        infoMode,
        cardSize,
        xSpacing,
        stageTop: unitTop,
        stageBottom: height - unitTop - cardSize,
        titleTop: unitTop + cardSize + infoGap,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measuredFullHeight, measuredSubtitleHeight]);

  const handleItemClick = (index: number) => {
    if (index === currentIndex) {
      onSelect(index);
    } else {
      onIndexChange(index);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isScrolling = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 10 && Math.abs(event.deltaX) < 10) return;

      event.preventDefault();

      if (isScrolling) return;

      if (Math.abs(event.deltaY) > 20 || Math.abs(event.deltaX) > 20) {
        isScrolling = true;

        if (event.deltaY > 0 || event.deltaX > 0) {
          if (currentIndex < maxIndex) onIndexChange(currentIndex + 1);
        } else if (currentIndex > 0) {
          onIndexChange(currentIndex - 1);
        }

        timeoutId = setTimeout(() => {
          isScrolling = false;
        }, 300);
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentIndex, maxIndex, onIndexChange]);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full cursor-grab flex-col items-center justify-center overflow-hidden touch-pan-y perspective-1000 active:cursor-grabbing"
      onPointerDown={(event) => {
        isPressed.current = true;
        startX.current = event.clientX;
        isDragging.current = false;
        (event.target as Element).setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!isPressed.current) return;
        const rawDiff = event.clientX - startX.current;
        const limit = layout.xSpacing * 1.5;
        const dampedDiff = (rawDiff * limit) / (limit + Math.abs(rawDiff));

        setDragX(dampedDiff);

        if (Math.abs(dampedDiff) > 10) {
          isDragging.current = true;
        }
      }}
      onPointerUp={(event) => {
        if (!isPressed.current) return;

        isPressed.current = false;
        (event.target as Element).releasePointerCapture(event.pointerId);

        const threshold = 15;
        if (isDragging.current) {
          if (dragX > threshold && currentIndex > 0) {
            onIndexChange(currentIndex - 1);
          } else if (dragX < -threshold && currentIndex < maxIndex) {
            onIndexChange(currentIndex + 1);
          }
        }

        setDragX(0);
        isDragging.current = false;
      }}
    >
      <div
        className="absolute z-10 flex w-full items-center justify-center transform-style-3d"
        style={{ top: layout.stageTop, bottom: layout.stageBottom }}
      >
        <div className="relative flex h-full w-full items-center justify-center transform-style-3d">
          <AnimatePresence initial={false} custom={currentIndex}>
            {albums.map((album, index) => {
              const distance = index - currentIndex;
              const isActive = index === currentIndex;
              const renderRange = layout.mode === "MOBILE" ? 1 : 2;
              const isVisible = Math.abs(distance) <= renderRange;

              if (Math.abs(distance) > renderRange + 1) return null;

              const xSpacing = layout.xSpacing;
              const zDepth = layout.mode === "MOBILE" ? -150 : -200;
              const rotation = layout.mode === "MOBILE" ? -10 : -15;

              return (
                <motion.div
                  key={album.id}
                  onClick={(event) => {
                    if (isDragging.current) {
                      event.stopPropagation();
                      event.preventDefault();
                      return;
                    }
                    handleItemClick(index);
                  }}
                  className="absolute cursor-pointer"
                  initial={false}
                  animate={{
                    x: distance * xSpacing + dragX,
                    y: 0,
                    z: isActive ? 0 : Math.abs(distance) * zDepth,
                    rotateY: distance * rotation + dragX / 20,
                    scale: isActive
                      ? STACK_LAYOUT.card.activeScale
                      : Math.max(0, 1 - Math.abs(distance) * 0.1),
                    opacity: isVisible ? 1 : 0,
                    pointerEvents: isVisible ? "auto" : "none",
                    zIndex: 100 - Math.abs(distance),
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : layout.mode === "MOBILE"
                        ? { type: "spring", stiffness: 250, damping: 30, mass: 0.8 }
                        : { type: "spring", stiffness: 150, damping: 20, mass: 0.8 }
                  }
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div
                    style={{
                      width: layout.cardSize,
                      height: layout.cardSize,
                      backgroundColor: album.color,
                    }}
                    className={`relative z-20 overflow-hidden rounded-[4px] transition-all duration-500 ease-out ${
                      lightweightEffects
                        ? isActive
                          ? "shadow-[0_14px_28px_-14px_rgba(0,0,0,0.22),0_3px_10px_-4px_rgba(0,0,0,0.1)]"
                          : "shadow-[0_6px_16px_-10px_rgba(0,0,0,0.14),0_2px_6px_-3px_rgba(0,0,0,0.08)]"
                        : isActive
                          ? "shadow-[0_20px_60px_-16px_rgba(0,0,0,0.3),0_4px_16px_-4px_rgba(0,0,0,0.1)]"
                          : "shadow-[0_8px_24px_-4px_rgba(0,0,0,0.12),0_4px_8px_-2px_rgba(0,0,0,0.06)]"
                    }`}
                  >
                    <img
                      src={album.coverImage}
                      alt={album.title}
                      className={`h-full w-full select-none object-cover transition-all duration-500 pointer-events-none ${
                        isActive
                          ? "grayscale-0 contrast-100"
                          : "grayscale-[0.5] contrast-[0.9]"
                      }`}
                    />

                    <div
                      className={`absolute inset-0 bg-black transition-opacity duration-500 pointer-events-none ${
                        isActive ? "opacity-0" : "opacity-40"
                      }`}
                    />

                    <div className="absolute inset-0 z-10 rounded-[4px] ring-1 ring-inset ring-black/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] pointer-events-none" />
                  </div>

                  <div
                    className={`absolute -bottom-8 left-6 right-6 z-10 h-16 rounded-[100%] transition-all duration-700 ease-in-out pointer-events-none ${
                      lightweightEffects ? "opacity-0" : "mix-blend-multiply blur-[45px]"
                    }`}
                    style={{
                      backgroundColor: album.color,
                      opacity: isActive ? (lightweightEffects ? 0 : 0.45) : 0,
                      transform: isActive
                        ? "translateY(0) scale(1)"
                        : "translateY(-20px) scale(0.8)",
                    }}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {!layout.isShort && layout.infoMode !== "hidden" && currentIndex < albums.length && (
        <div
          className="pointer-events-none absolute left-1/2 z-[200] -translate-x-1/2"
          style={{
            top: layout.titleTop,
            width: activeCardWidth,
            paddingInline: contentInset,
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIndex}-${layout.infoMode}`}
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0, y: 20, filter: "blur(4px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -20, filter: "blur(4px)" }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: seconds(STACK_INFO_TIMING.contentEnter), ease: "easeOut" }
              }
              className="flex items-stretch gap-4 text-left"
            >
              <div
                className="w-1 shrink-0 self-stretch transition-colors duration-500"
                style={{
                  backgroundColor: activeAlbum.color,
                  boxShadow:
                    activeAlbum.color === "#FFFFFF"
                      ? "0 0 8px rgba(0,0,0,0.12)"
                      : "none",
                }}
              />

              <div className="min-w-0 flex-1">
                {isFullInfo && (
                  <motion.h2
                    className={`${titleBottomGapClass} font-chill font-medium leading-none`}
                    style={{ fontSize: "clamp(1.8rem, 8vmin, 4.5rem)" }}
                    animate={{ color: activeAlbum.textColor }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
                  >
                    {activeAlbum.title}
                  </motion.h2>
                )}

                <motion.p
                  className={`font-chill font-light tracking-[0.05em] whitespace-pre-line ${
                    isFullInfo ? subtitleTopGapClass : ""
                  }`}
                  animate={{ color: activeAlbum.textColor }}
                  style={{ opacity: 0.82, fontSize: subtitleFontSize }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
                >
                  {activeAlbum.subtitle}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      <div
        aria-hidden="true"
        ref={fullMeasureRef}
        className="pointer-events-none invisible absolute top-0 left-1/2 z-[-1] -translate-x-1/2"
        style={{ width: activeCardWidth, paddingInline: contentInset }}
      >
        <div className="flex items-stretch gap-4 text-left">
          <div
            className="w-1 shrink-0 self-stretch"
            style={{
              backgroundColor: activeAlbum?.color,
              boxShadow:
                activeAlbum?.color === "#FFFFFF"
                  ? "0 0 8px rgba(0,0,0,0.12)"
                  : "none",
            }}
          />

          <div className="min-w-0 flex-1">
            <div
              className={`${titleBottomGapClass} font-chill font-medium leading-none`}
              style={{ fontSize: "clamp(1.8rem, 8vmin, 4.5rem)" }}
            >
              {activeAlbum?.title}
            </div>

            <div
              className={`${subtitleTopGapClass} font-chill font-light tracking-[0.05em] whitespace-pre-line`}
              style={{ fontSize: subtitleFontSize }}
            >
              {activeAlbum?.subtitle}
            </div>
          </div>
        </div>
      </div>

      <div
        aria-hidden="true"
        ref={subtitleMeasureRef}
        className="pointer-events-none invisible absolute top-0 left-1/2 z-[-1] -translate-x-1/2"
        style={{ width: activeCardWidth, paddingInline: contentInset }}
      >
        <div className="flex items-stretch gap-4 text-left">
          <div
            className="w-1 shrink-0 self-stretch"
            style={{
              backgroundColor: activeAlbum?.color,
              boxShadow:
                activeAlbum?.color === "#FFFFFF"
                  ? "0 0 8px rgba(0,0,0,0.12)"
                  : "none",
            }}
          />

          <div className="min-w-0 flex-1">
            <div
              className="font-chill font-light tracking-[0.05em] whitespace-pre-line"
              style={{ fontSize: subtitleFontSize }}
            >
              {activeAlbum?.subtitle}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumStack;
