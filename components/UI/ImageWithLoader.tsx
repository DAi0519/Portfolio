import React, { useState } from 'react';

interface ImageWithLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  // Optional callback for specialized carousel aspect ratio logic
  onImageLoad?: (img: HTMLImageElement) => void;
  containerClassName?: string;
}

export const ImageWithLoader: React.FC<ImageWithLoaderProps> = ({ 
  src, 
  alt, 
  className, 
  style, 
  onImageLoad,
  containerClassName,
  ...props 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    if (onImageLoad) {
      onImageLoad(e.currentTarget);
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={`relative overflow-hidden ${containerClassName || ''}`}>
      {/* Loading Spinner Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[2px] gap-3">
           {/* CSS Spinner for Perfect Centering */}
           <div className="w-6 h-6 border-2 border-neutral-400/30 border-t-neutral-400 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-900 text-neutral-500 gap-2">
           <span className="text-xs uppercase tracking-widest">Image Failed</span>
        </div>
      )}

      {/* The Image */}
      <img
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={style}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
};
