"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface NavigationControlsProps {
  currentIndex: number;
  totalPhotos: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function NavigationControls({
  currentIndex,
  totalPhotos,
  onPrevious,
  onNext,
}: NavigationControlsProps) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalPhotos - 1;

  return (
    <>
      {/* Previous button */}
      <button
        onClick={onPrevious}
        disabled={isFirst}
        className={`absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all ${
          isFirst
            ? "bg-gray-800/30 text-gray-600 cursor-not-allowed"
            : "bg-black/70 hover:bg-black/90 text-white hover:scale-110"
        } backdrop-blur-sm`}
        title="Previous photo (←)"
        aria-label="Previous photo"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={isLast}
        className={`absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full transition-all ${
          isLast
            ? "bg-gray-800/30 text-gray-600 cursor-not-allowed"
            : "bg-black/70 hover:bg-black/90 text-white hover:scale-110"
        } backdrop-blur-sm`}
        title="Next photo (→)"
        aria-label="Next photo"
      >
        <ChevronRight className="w-8 h-8" />
      </button>
    </>
  );
}
