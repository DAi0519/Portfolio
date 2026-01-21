import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ImageWithLoader } from './UI/ImageWithLoader';

interface CarouselProps {
  images: { url: string; alt?: string; type?: 'image' | 'video' }[];
  onClose?: () => void;
  onImageClick?: (url: string, type: 'image' | 'video') => void;
}

export const Carousel: React.FC<CarouselProps> = ({ images, onClose, onImageClick }) => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const x = useMotionValue(0);

  // Swipe Threshold
  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = useCallback((newDirection: number) => {
    setDirection(newDirection);
    // Loop around
    let nextIndex = index + newDirection;
    if (nextIndex < 0) nextIndex = images.length - 1;
    if (nextIndex >= images.length) nextIndex = 0;
    setIndex(nextIndex);
  }, [index, images.length]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        paginate(1);
      } else if (e.key === 'ArrowLeft') {
        paginate(-1);
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paginate, onClose]);

  // "Direct Drive" variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.95
    })
  };

  if (!images || images.length === 0) return null;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black group select-none overflow-hidden">
      
      {/* Background Blur for Ambience - More Visible */}
      <div className="absolute inset-0 overflow-hidden opacity-40 pointer-events-none">
          <motion.div 
             key={index}
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 1 }}
             className="absolute inset-0 bg-cover bg-center blur-3xl scale-125"
             style={{ backgroundImage: `url(${images[index].url})` }}
          />
          <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Main Slide Area */}
      <div className="relative w-full h-full flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={index}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }: PanInfo) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="absolute w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            {images[index].type === 'video' ? (
                 <div className="relative w-full h-full flex items-center justify-center bg-black">
                     <video 
                        src={images[index].url} 
                        controls 
                        className="max-w-full max-h-full shadow-2xl rounded-sm object-contain"
                     />
                 </div>
            ) : (
                <div 
                   className="w-full h-full flex items-center justify-center cursor-zoom-in"
                   onClick={(e) => {
                       e.stopPropagation();
                       onImageClick?.(images[index].url, 'image');
                   }}
                >
                    <ImageWithLoader
                      src={images[index].url}
                      alt={images[index].alt || ''}
                      data-hint="true"
                      containerClassName="w-full h-full flex items-center justify-center"
                      className="shadow-2xl rounded-sm transition-opacity duration-500"
                      style={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain'
                      }}
                      onImageLoad={(img) => {
                        // Logic from before
                        const container = img.parentElement?.parentElement; // ImageWithLoader div -> div -> motion.div
                        if (!container) return;
                        
                        const isLandscape = img.naturalWidth > img.naturalHeight;
                        
                        if (isLandscape) {
                          img.style.width = '100%';
                          img.style.height = 'auto';
                          img.style.maxHeight = 'none';
                        } else {
                          img.style.width = 'auto';
                          img.style.height = '100%';
                          img.style.maxWidth = '100%';
                        }
                      }}
                      draggable={false}
                    />
                </div>
            )}
            
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls Overlay */}
      
      {/* Navigation Arrows (Desktop) */}
      <button 
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all z-10 hidden md:flex"
        onClick={() => paginate(-1)}
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all z-10 hidden md:flex"
        onClick={() => paginate(1)}
      >
        <ChevronRight size={24} />
      </button>

      {/* Bottom Interface - Indicators Only */}
      <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4 z-10 px-6">
          
          {/* Indicators */}
          <div className="flex items-center gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-8 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
      </div>

    </div>
  );
};
