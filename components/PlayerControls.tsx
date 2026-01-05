import React from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface PlayerControlsProps {
  onNext: () => void;
  onPrev: () => void;
  onExpand: () => void;
  currentIndex: number;
  total: number;
  color: string;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({ onNext, onPrev, onExpand, currentIndex, total, color }) => {
  return (
    <div className="relative pt-6">
      <div className="flex items-center gap-6 md:gap-12">
        <button 
          onClick={onPrev}
          className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white shadow-sm border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black hover:border-neutral-400 hover:shadow-md transition-all active:scale-95"
          aria-label="Previous Album"
        >
          <ChevronLeft size={20} className="md:w-6 md:h-6" />
        </button>

        {/* Center Action Button - styled like a Braun power button */}
        <div className="relative group">
          <button 
             onClick={onExpand}
             className="w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center text-white shadow-lg shadow-black/10 transform transition-transform hover:scale-105 active:scale-95"
             style={{ backgroundColor: color }}
             aria-label="Open Album"
          >
            <Maximize2 size={20} className="md:w-6 md:h-6" />
          </button>
          <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-[9px] font-bold tracking-[0.2em] uppercase text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden md:block">
              Expand View
          </span>
        </div>

        <button 
          onClick={onNext}
          className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-white shadow-sm border border-neutral-200 flex items-center justify-center text-neutral-600 hover:text-black hover:border-neutral-400 hover:shadow-md transition-all active:scale-95"
          aria-label="Next Album"
        >
          <ChevronRight size={20} className="md:w-6 md:h-6" />
        </button>
      </div>

      {/* Pagination Dot Indicator */}
      <div className="flex justify-center gap-1.5 md:gap-2 mt-8 md:mt-10">
         {Array.from({ length: total }).map((_, idx) => (
             <div 
               key={idx} 
               className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-4 md:w-6' : 'w-1 bg-neutral-300'}`}
               style={{ backgroundColor: idx === currentIndex ? color : undefined }}
             />
         ))}
      </div>
    </div>
  );
};

export default PlayerControls;