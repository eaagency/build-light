"use client";

import React, { useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

interface PhotoThumbnailProps {
  url: string;
  onRemove: () => void;
  uploading?: boolean;
  uploadProgress?: number;
  originalSize?: number; // bytes
  compressedSize?: number; // bytes
  disabled?: boolean;
}

/**
 * PhotoThumbnail Component
 * Displays uploaded photo with remove button and progress
 *
 * Features:
 * - Lazy loading
 * - Upload progress overlay
 * - File size display (before/after compression)
 * - Remove button
 * - Click to view full size (future enhancement)
 */
export function PhotoThumbnail({
  url,
  onRemove,
  uploading = false,
  uploadProgress = 0,
  originalSize,
  compressedSize,
  disabled = false,
}: PhotoThumbnailProps) {
  const [imageError, setImageError] = useState(false);

  // Format bytes to KB/MB
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      {/* Image */}
      {!imageError ? (
        <LazyLoadImage
          src={url}
          alt="Daily log photo"
          effect="blur"
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      {/* Upload progress overlay */}
      {uploading && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
          <div className="w-16 h-16 mb-2">
            <svg
              className="animate-spin text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <div className="text-white text-sm font-medium">{uploadProgress}%</div>
        </div>
      )}

      {/* File size badge */}
      {!uploading && (originalSize || compressedSize) && (
        <div className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center justify-between">
          {originalSize && compressedSize && (
            <>
              <span className="opacity-60 line-through">
                {formatSize(originalSize)}
              </span>
              <span>→</span>
              <span className="font-medium">{formatSize(compressedSize)}</span>
            </>
          )}
          {compressedSize && !originalSize && (
            <span>{formatSize(compressedSize)}</span>
          )}
        </div>
      )}

      {/* Remove button */}
      {!uploading && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Remove photo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Mobile remove button (always visible on mobile) */}
      {!uploading && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="md:hidden absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Remove photo"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
