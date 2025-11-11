"use client";

import { useEffect, useRef } from "react";

interface PhotoThumbnailStripProps {
  photos: string[];
  currentIndex: number;
  onThumbnailClick: (index: number) => void;
}

export function PhotoThumbnailStrip({
  photos,
  currentIndex,
  onThumbnailClick,
}: PhotoThumbnailStripProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Scroll to keep current thumbnail centered
  useEffect(() => {
    const currentThumbnail = thumbnailRefs.current[currentIndex];
    if (currentThumbnail && scrollContainerRef.current) {
      currentThumbnail.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentIndex]);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-16 pb-4">
      <div
        ref={scrollContainerRef}
        className="flex gap-2 px-4 overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {photos.map((photo, index) => {
          const isActive = index === currentIndex;
          return (
            <button
              key={index}
              ref={(el) => {
                thumbnailRefs.current[index] = el;
              }}
              onClick={() => onThumbnailClick(index)}
              className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden transition-all ${
                isActive
                  ? "ring-3 ring-green-500 scale-110"
                  : "ring-2 ring-white/30 hover:ring-white/60"
              }`}
              title={`Photo ${index + 1} of ${photos.length}`}
            >
              <img
                src={photo}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {isActive && (
                <div className="absolute inset-0 bg-green-500/20 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Hide scrollbar CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
