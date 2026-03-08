import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface CinematicBackgroundProps {
  color: string; // The active theme color (e.g., Klein Blue)
  backgroundColor: string; // The base paper tint
}

const withAlpha = (hex: string, alpha: number) => {
  const normalized = hex.trim();

  if (!normalized.startsWith('#')) {
    return 'transparent';
  }

  const value = normalized.slice(1);
  const isShortHex = value.length === 3;
  const isLongHex = value.length === 6;

  if (!isShortHex && !isLongHex) {
    return 'transparent';
  }

  const expanded = isShortHex
    ? value
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
    : value;

  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);

  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return 'transparent';
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const CinematicBackground: React.FC<CinematicBackgroundProps> = ({ color, backgroundColor }) => {
  const prefersReducedMotion = useReducedMotion();
  const accentStrong = withAlpha(color, 0.18);
  const accentSoft = withAlpha(color, 0.08);
  const accentWhisper = withAlpha(color, 0.04);

  return (
    <motion.div 
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none transform-gpu will-change-[background-color]"
      initial={false}
      animate={{ backgroundColor }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }} // Slower, heavier ease
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.18) 24%, rgba(255,255,255,0) 52%),
            linear-gradient(140deg, ${accentWhisper} 0%, transparent 38%, rgba(255,255,255,0.08) 100%)
          `,
        }}
      />

      <motion.div
        className="absolute -left-[12vw] -top-[18vh] h-[70vh] w-[85vw] rounded-full blur-[80px] md:h-[60vh] md:w-[52vw] md:blur-[120px] mix-blend-multiply"
        animate={
          prefersReducedMotion
            ? { x: 0, y: 0, scale: 1 }
            : { x: [0, 18, -12, 0], y: [0, 12, -10, 0], scale: [1, 1.04, 0.98, 1] }
        }
        transition={{
          duration: 26,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(circle at 38% 34%, ${accentStrong} 0%, ${accentSoft} 28%, transparent 72%)`,
        }}
      />

      <motion.div
        className="absolute -bottom-[24vh] right-[-16vw] h-[48vh] w-[62vw] rounded-full blur-[90px] md:h-[44vh] md:w-[34vw] md:blur-[110px] mix-blend-multiply"
        animate={
          prefersReducedMotion
            ? { x: 0, y: 0, scale: 1 }
            : { x: [0, -14, 10, 0], y: [0, -10, 8, 0], scale: [1, 0.98, 1.05, 1] }
        }
        transition={{
          duration: 30,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(circle at 45% 45%, ${accentSoft} 0%, ${accentWhisper} 32%, transparent 72%)`,
        }}
      />

      <div
        className="absolute inset-0 opacity-80 mix-blend-screen"
        style={{
          background: `
            radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.18) 26%, transparent 62%),
            radial-gradient(ellipse at 50% 56%, ${accentSoft} 0%, transparent 58%)
          `,
        }}
      />

      <motion.div
        className="absolute inset-[-12%] opacity-60 blur-[2px] mix-blend-soft-light"
        animate={
          prefersReducedMotion
            ? { x: 0, y: 0 }
            : { x: [0, 10, -8, 0], y: [0, -6, 8, 0] }
        }
        transition={{
          duration: 32,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
        style={{
          background: `linear-gradient(
            125deg,
            transparent 18%,
            rgba(255,255,255,0.06) 34%,
            rgba(255,255,255,0.22) 48%,
            rgba(255,255,255,0.05) 60%,
            transparent 76%
          )`,
        }}
      />

      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: `
            radial-gradient(ellipse at 50% 82%, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.05) 24%, transparent 58%),
            radial-gradient(circle at 50% 45%, transparent 42%, rgba(0,0,0,0.06) 100%)
          `,
        }}
      />

      <div
        className="absolute inset-0 opacity-35 mix-blend-soft-light"
        style={{
          backgroundImage: `
            repeating-linear-gradient(105deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 28px),
            repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 34px)
          `,
        }}
      />
    </motion.div>
  );
};

export default CinematicBackground;
