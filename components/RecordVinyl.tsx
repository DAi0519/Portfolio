import React from "react";
import { Album } from "../types";
import { Play } from "lucide-react";

interface RecordVinylProps {
  album: Album;
  isActive: boolean;
  onDoubleClick?: () => void;
  isSpinning?: boolean;
  className?: string;
  showSleeve?: boolean;
  layout?: "3D" | "FLAT"; // 3D for stack, FLAT for detail page
}

const RecordVinyl: React.FC<RecordVinylProps> = ({
  album,
  isActive,
  onDoubleClick,
  isSpinning = false,
  className = "",
  showSleeve = true,
  layout = "3D",
}) => {
  return (
    <div
      className={`relative group select-none w-full h-full ${className} ${
        layout === "3D" ? "perspective-1000" : ""
      }`}
      onDoubleClick={onDoubleClick}
    >
      {/* 
        VINYL DISC COMPONENT
      */}
      <div
        className={`
          absolute inset-0 rounded-full flex items-center justify-center z-10
          transition-all duration-[1.2s] ease-[cubic-bezier(0.2,0.8,0.2,1)]
          ${
            layout === "3D" && showSleeve && isActive
              ? "translate-x-[40%] rotate-12 shadow-2xl"
              : ""
          }
          ${
            layout === "FLAT" && isActive
              ? "translate-x-[55%] rotate-[360deg] shadow-[10px_0_30px_rgba(0,0,0,0.3)]"
              : ""
          }
          ${
            layout === "FLAT" && !isActive
              ? "translate-x-0 rotate-0 shadow-none"
              : ""
          }
          ${!showSleeve ? "scale-100" : "scale-[0.94]"}
        `}
        style={{ backgroundColor: album.color }}
      >
        {/* Spinning Inner Container */}
        <div
          className={`w-full h-full relative rounded-full ${
            isSpinning && isActive ? "animate-spin-slow" : ""
          }`}
        >
          {/* Realistic Grooves Texture (Semi-transparent black overlaying the color) */}
          <div className={`absolute inset-[2%] rounded-full vinyl-grooves opacity-60 ring-1 ${album.color.toLowerCase() === '#ffffff' ? 'ring-black/5' : 'ring-white/10'}`}></div>

          {/* Anisotropic Shine (The "Pizza Slice" reflection) */}
          {album.color.toLowerCase() === '#ffffff' ? (
             <>
                <div className="absolute inset-0 rounded-full vinyl-shine-dark mix-blend-multiply opacity-60 rotate-45"></div>
                <div className="absolute inset-0 rounded-full vinyl-shine-dark mix-blend-multiply opacity-30 -rotate-45"></div>
             </>
          ) : (
             <>
                <div className="absolute inset-0 rounded-full vinyl-shine mix-blend-plus-lighter opacity-50 rotate-45"></div>
                <div className="absolute inset-0 rounded-full vinyl-shine mix-blend-plus-lighter opacity-25 -rotate-45"></div>
             </>
          )}

          {/* Inner Dead Wax area - Matches the theme color but slightly darker/different finish */}
          <div
            className="absolute inset-[33%] rounded-full opacity-90 shadow-[0_0_0_1px_rgba(0,0,0,0.05)]"
            style={{ backgroundColor: album.color }}
          >
            {/* Subtle dark overlay to distinguish dead wax from playable area */}
            <div className="absolute inset-0 bg-black/5 rounded-full"></div>
          </div>

          {/* Center Label (Black Vinyl Look) */}
          <div className="absolute inset-[35%] rounded-full flex items-center justify-center bg-[#111] shadow-[inset_0_1px_4px_rgba(255,255,255,0.1),0_0_0_1px_rgba(0,0,0,0.2)]">
            {/* Paper Texture on Label (Subtle matte finish) */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] mix-blend-overlay rounded-full"></div>

            {/* Spindle Hole */}
            <div className="w-1.5 h-1.5 bg-[#e8e8e5] rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)] border border-white/10" />
          </div>
        </div>
      </div>

      {/* 
        ALBUM SLEEVE
      */}
      {showSleeve && (
        <div
          className={`
            relative z-20 w-full h-full bg-[#fcfcfc] overflow-hidden rounded-[2px]
            transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
            ${
              layout === "3D"
                ? "shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)]" // Softer shadow for High Key
                : "shadow-[15px_0_40px_-10px_rgba(0,0,0,0.15)]"
            }
            ${layout === "3D" && isActive ? "scale-100 translate-x-[-10%]" : ""}
            ${
              layout === "3D" && !isActive
                ? "hover:scale-[1.02] hover:-translate-y-2"
                : ""
            }
          `}
        >
          {/* Main Cover Image */}
          <img
            src={album.coverImage}
            alt={album.title}
            className="w-full h-full object-cover"
          />

          {/* Paper Texture Overlay (Grain) */}
          <div className="absolute inset-0 bg-noise opacity-[0.15] mix-blend-overlay pointer-events-none" />

          {/* Left Spine Shadow (Curve of the cardboard) */}
          <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-gradient-to-r from-black/10 to-transparent mix-blend-multiply"></div>

          {/* Right Open Edge (Shadow inside the sleeve) */}
          <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-black/10"></div>

          {/* Surface Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/5 pointer-events-none mix-blend-soft-light" />

          {/* Interaction Hint (Only for 3D stack mode) */}
          {layout === "3D" && isActive && onDoubleClick && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px] cursor-pointer">
              <div className="bg-white/95 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform border border-white/50">
                <Play size={12} fill="#000" className="text-black" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-black">
                  打开
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordVinyl;
