"use client";

import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

interface PhotoPreviewGridProps {
  /**
   * Array of photo URLs
   */
  photos: string[];
  /**
   * Click handler for photo thumbnails
   */
  onPhotoClick?: (photoUrl: string, index: number) => void;
  /**
   * Maximum number of photos to display (default: 3)
   */
  maxDisplay?: number;
}

export function PhotoPreviewGrid({
  photos,
  onPhotoClick,
  maxDisplay = 3,
}: PhotoPreviewGridProps) {
  if (!photos || photos.length === 0) {
    return null;
  }

  const displayPhotos = photos.slice(0, maxDisplay);
  const remainingCount = photos.length - maxDisplay;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-2">
        {displayPhotos.map((photo, index) => (
          <button
            key={photo}
            onClick={() => onPhotoClick?.(photo, index)}
            className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 hover:border-[#6BF178] transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6BF178] focus:ring-offset-2"
            type="button"
          >
            <LazyLoadImage
              src={photo}
              alt={`Photo ${index + 1}`}
              effect="blur"
              className="w-full h-full object-cover"
              wrapperClassName="w-full h-full"
            />
            {/* Show "+X more" overlay on last photo if there are remaining photos */}
            {index === maxDisplay - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  +{remainingCount} more
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
      {photos.length > 0 && (
        <span className="text-sm text-gray-500">
          {photos.length} photo{photos.length !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
