import React from 'react';

interface CinematicBackgroundProps {
  color: string; // The active theme color (e.g., Klein Blue)
  backgroundColor: string; // The base paper tint
  edgeLite?: boolean;
  mobileLite?: boolean;
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

const CinematicBackground: React.FC<CinematicBackgroundProps> = ({
  color,
  backgroundColor,
  edgeLite = false,
  mobileLite = false,
}) => {
  const accentStrong = withAlpha(color, 0.11);
  const accentSoft = withAlpha(color, 0.05);
  const accentWhisper = withAlpha(color, 0.025);
  const primaryBlobClassName = edgeLite
    ? "absolute -left-[6vw] -top-[10vh] h-[46vh] w-[58vw] rounded-full blur-[44px] md:h-[40vh] md:w-[36vw] md:blur-[60px] mix-blend-multiply"
    : "absolute -left-[10vw] -top-[14vh] h-[58vh] w-[70vw] rounded-full blur-[64px] md:h-[52vh] md:w-[44vw] md:blur-[92px] mix-blend-multiply";

  if (mobileLite) {
    return (
      <div
        className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
        style={{ backgroundColor }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.12) 24%, rgba(255,255,255,0) 56%),
              radial-gradient(circle at 32% 18%, ${accentSoft} 0%, transparent 34%)
            `,
          }}
        />

        <div
          className="absolute inset-0 opacity-55"
          style={{
            background: `
              radial-gradient(circle at 50% 46%, transparent 44%, rgba(0,0,0,0.045) 100%)
            `,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ backgroundColor }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.58) 0%, rgba(255,255,255,0.12) 22%, rgba(255,255,255,0) 52%),
            linear-gradient(140deg, ${accentWhisper} 0%, transparent 34%, rgba(255,255,255,0.05) 100%)
          `,
        }}
      />

      <div
        className={primaryBlobClassName}
        style={{
          background: `radial-gradient(circle at 38% 34%, ${accentStrong} 0%, ${accentSoft} 28%, transparent 72%)`,
        }}
      />

      <div
        className="absolute inset-0 opacity-62"
        style={{
          background: `
            radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.1) 24%, transparent 60%),
            radial-gradient(ellipse at 50% 56%, ${accentWhisper} 0%, transparent 56%)
          `,
        }}
      />

      <div
        className="absolute inset-0 opacity-58"
        style={{
          background: `
            radial-gradient(circle at 50% 45%, transparent 42%, rgba(0,0,0,0.055) 100%)
          `,
        }}
      />
    </div>
  );
};

export default CinematicBackground;
