import React from 'react';
import { Album } from '../types';
import { Play } from 'lucide-react';

interface RecordVinylProps {
  album: Album;
  isActive: boolean;
  onDoubleClick?: () => void;
  isSpinning?: boolean;
  className?: string;
  showSleeve?: boolean;
  layout?: '3D' | 'FLAT'; // 3D for stack, FLAT for detail page
}

const RecordVinyl: React.FC<RecordVinylProps> = ({ 
  album, 
  isActive, 
  onDoubleClick, 
  isSpinning = false,
  className = "",
  showSleeve = true,
  layout = '3D'
}) => {
  return (
    <div 
      className={`relative group select-none ${className} ${layout === '3D' ? 'perspective-1000' : ''}`}
      onDoubleClick={onDoubleClick}
    >
      {/* 
        VINYL DISC 
        In FLAT mode, it slides out to the Right.
        In 3D mode, it peeks out.
      */}
      <div 
        className={`
          absolute inset-0 rounded-full bg-[#111] shadow-2xl flex items-center justify-center z-10
          transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${layout === '3D' && showSleeve && isActive ? 'translate-x-[40%] rotate-12' : ''}
          ${layout === 'FLAT' ? 'translate-x-[45%]' : ''} 
          ${!showSleeve ? 'scale-100' : 'scale-95'}
          ${isSpinning ? 'animate-spin-slow' : ''}
        `}
      >
        {/* Subtle grooves gradient */}
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(transparent_0deg,#333_45deg,transparent_90deg,#333_135deg,transparent_180deg,#333_225deg,transparent_270deg,#333_315deg,transparent_360deg)] opacity-40"></div>
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,transparent_30%,#000_31%,#222_32%,#000_33%,#222_34%,#000_60%,#222_61%,#000_62%)] opacity-80"></div>
        
        {/* Light reflection */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>

        {/* Center Label */}
        <div 
          className="w-[38%] h-[38%] rounded-full flex items-center justify-center relative z-10 shadow-inner"
          style={{ backgroundColor: album.color }}
        >
          <div className="absolute inset-2 border border-black/10 rounded-full"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-[6px] md:text-[8px] font-mono font-bold uppercase tracking-widest text-black/60 rotate-[-15deg]">
               {album.title.substring(0, 12)}
             </span>
          </div>
          <div className="w-1.5 h-1.5 bg-black rounded-full" />
        </div>
      </div>

      {/* 
        ALBUM SLEEVE
        In FLAT mode, it stays on top on the left, casting a shadow on the record sliding out.
      */}
      {showSleeve && (
        <div 
          className={`
            relative z-20 w-full h-full bg-[#f0f0f0] overflow-hidden rounded-[2px]
            transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
            ${layout === '3D' ? 'shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]' : 'shadow-[10px_0_40px_-10px_rgba(0,0,0,0.4)]'}
            ${layout === '3D' && isActive ? 'scale-100 translate-x-[-10%]' : ''}
            ${layout === '3D' && !isActive ? 'hover:scale-[1.02]' : ''}
          `}
        >
          <img 
            src={album.coverImage} 
            alt={album.title}
            className="w-full h-full object-cover grayscale-[10%] contrast-[1.15]"
          />
          
          {/* Matte Finish Texture Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none mix-blend-overlay" />
          
          {/* Spine shadow (Left) */}
          <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-r from-black/30 to-transparent"></div>
          
          {/* Right edge shadow (for FLAT mode to show depth over record) */}
          {layout === 'FLAT' && (
             <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-black/20 to-transparent pointer-events-none"></div>
          )}

          {/* Interaction Hint (Only for 3D stack mode) */}
          {layout === '3D' && isActive && onDoubleClick && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm cursor-pointer">
              <div className="bg-white/90 px-6 py-3 rounded-full flex items-center gap-3 text-xs font-bold tracking-[0.2em] uppercase text-black shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                <Play size={12} fill="currentColor" />
                Open
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordVinyl;