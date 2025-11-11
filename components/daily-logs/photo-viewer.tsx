"use client";

import { useState, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Loader2 } from "lucide-react";

interface PhotoViewerProps {
  photoUrl: string;
  alt?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function PhotoViewer({
  photoUrl,
  alt = "Daily log photo",
  onLoad,
  onError,
}: PhotoViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    setImageUrl(photoUrl);
  }, [photoUrl]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    // Force reload by adding timestamp
    setImageUrl(`${photoUrl}${photoUrl.includes("?") ? "&" : "?"}t=${Date.now()}`);
  };

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-900">
        <div className="text-center text-white space-y-4 p-8">
          <div className="text-6xl mb-4">📷</div>
          <h3 className="text-xl font-semibold">Failed to load photo</h3>
          <p className="text-gray-400">
            This photo could not be loaded. It may have been moved or deleted.
          </p>
          <button
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <Loader2 className="h-12 w-12 text-white animate-spin" />
        </div>
      )}

      {/* Zoomable image */}
      <TransformWrapper
        initialScale={1}
        minScale={1}
        maxScale={3}
        centerOnInit
        doubleClick={{
          mode: "toggle",
          step: 0.5,
        }}
        wheel={{
          step: 0.2,
        }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <button
                onClick={() => zoomIn()}
                className="p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg transition-colors backdrop-blur-sm"
                title="Zoom in (+)"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                  />
                </svg>
              </button>
              <button
                onClick={() => zoomOut()}
                className="p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg transition-colors backdrop-blur-sm"
                title="Zoom out (-)"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                  />
                </svg>
              </button>
              <button
                onClick={() => resetTransform()}
                className="p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg transition-colors backdrop-blur-sm"
                title="Reset zoom (0)"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>

            {/* Image */}
            <TransformComponent
              wrapperClass="!w-full !h-full"
              contentClass="!w-full !h-full flex items-center justify-center"
            >
              <img
                src={imageUrl}
                alt={alt}
                onLoad={handleImageLoad}
                onError={handleImageError}
                className="max-w-full max-h-[90vh] object-contain"
                draggable={false}
              />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
}
