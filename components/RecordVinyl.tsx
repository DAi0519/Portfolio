
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
        VINYL DISC COMPONENT
      */}
      <div 
        className={`
          absolute inset-0 rounded-full bg-[#0a0a0a] shadow-2xl flex items-center justify-center z-10
          transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${layout === '3D' && showSleeve && isActive ? 'translate-x-[40%] rotate-12' : ''}
          ${layout === 'FLAT' ? 'translate-x-[45%]' : ''} 
          ${!showSleeve ? 'scale-100' : 'scale-[0.93]'}
          ${isSpinning ? 'animate-spin-slow' : ''}
        `}
        style={{
          boxShadow: '4px 0 20px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)'
        }}
      >
        {/* Realistic Grooves Texture */}
        <div className="absolute inset-[2%] rounded-full vinyl-grooves opacity-90"></div>
        
        {/* Anisotropic Shine (The "Pizza Slice" reflection) */}
        <div className="absolute inset-0 rounded-full vinyl-shine mix-blend-overlay opacity-60"></div>
        
        {/* Inner Dead Wax area */}
        <div className="absolute inset-[32%] rounded-full bg-[#111] shadow-[0_0_0_1px_#222]"></div>

        {/* Center Label */}
        <div 
          className="w-[30%] h-[30%] rounded-full flex items-center justify-center relative z-20 shadow-[inset_0_1px_4px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,0,0,0.2)]"
          style={{ backgroundColor: album.color }}
        >
          {/* Paper Texture on Label */}
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] mix-blend-multiply rounded-full"></div>
          
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="flex flex-col items-center">
                <span className="text-[5px] md:text-[6px] font-mono font-bold uppercase tracking-widest text-black/60 mb-0.5">
                  Stereo
                </span>
                <span className="text-[6px] md:text-[8px] font-sans font-black uppercase tracking-widest text-black/80 rotate-[-5deg] mix-blend-multiply">
                  {album.title.substring(0, 10)}
                </span>
             </div>
          </div>
          
          {/* Spindle Hole */}
          <div className="w-1.5 h-1.5 bg-[#e8e8e5] rounded-full shadow-[inset_1px_1px_2px_rgba(0,0,0,0.8)]" />
        </div>
      </div>

      {/* 
        ALBUM SLEEVE
        Enhanced for tactility: Cardboard texture, rim lighting, and realistic shadows.
      */}
      {showSleeve && (
        <div 
          className={`
            relative z-20 w-full h-full bg-[#fcfcfc] overflow-hidden rounded-[2px]
            transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]
            ${layout === '3D' ? 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.35)]' : 'shadow-[15px_10px_40px_-10px_rgba(0,0,0,0.2)]'}
            ${layout === '3D' && isActive ? 'scale-100 translate-x-[-10%]' : ''}
            ${layout === '3D' && !isActive ? 'hover:scale-[1.02] hover:-translate-y-2' : ''}
          `}
        >
          {/* Main Cover Image - REMOVED GRAYSCALE FILTER to support pure colors */}
          <img 
            src={album.coverImage} 
            alt={album.title}
            className="w-full h-full object-cover" 
          />
          
          {/* Paper Texture Overlay (Grain) */}
          <div className="absolute inset-0 bg-noise opacity-[0.15] mix-blend-overlay pointer-events-none" />
          
          {/* Subtle Gradient to simulate matte print finish */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none mix-blend-hard-light opacity-50" />
          
          {/* Left Spine Shadow (Curve of the cardboard) */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-r from-black/20 to-transparent mix-blend-multiply"></div>
          
          {/* Right Open Edge (Shadow inside the sleeve) */}
          <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-black/10"></div>

          {/* Interaction Hint (Only for 3D stack mode) */}
          {layout === '3D' && isActive && onDoubleClick && (
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px] cursor-pointer">
              <div className="bg-white/95 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-transform border border-white/50">
                <Play size={12} fill="#000" className="text-black" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-black">Open</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecordVinyl;
