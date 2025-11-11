"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Download } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { PhotoViewer } from "./photo-viewer";
import { NavigationControls } from "./navigation-controls";
import { PhotoThumbnailStrip } from "./photo-thumbnail-strip";
import { PhotoActionsMenu } from "./photo-actions-menu";
import { DeletePhotoModal } from "./delete-photo-modal";

interface PhotoGalleryModalProps {
  photos: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (photoUrl: string, photoIndex: number) => Promise<void>;
  canDelete?: boolean;
  projectName?: string;
  logDate?: Date;
}

export function PhotoGalleryModal({
  photos,
  initialIndex,
  isOpen,
  onClose,
  onDelete,
  canDelete = false,
  projectName,
  logDate,
}: PhotoGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  // Navigation functions
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, photos.length]);

  const goToFirst = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  const goToLast = useCallback(() => {
    setCurrentIndex(photos.length - 1);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "Home":
          goToFirst();
          break;
        case "End":
          goToLast();
          break;
        case "+":
        case "=":
          // Zoom in (handled by PhotoViewer)
          break;
        case "-":
        case "_":
          // Zoom out (handled by PhotoViewer)
          break;
        case "0":
          // Reset zoom (handled by PhotoViewer)
          break;
        case "Delete":
          if (canDelete) {
            setShowDeleteModal(true);
          }
          break;
        case "?":
          // Show keyboard shortcuts help
          alert(
            "Keyboard Shortcuts:\n\n" +
              "← → : Navigate photos\n" +
              "Home/End : First/Last photo\n" +
              "+ - : Zoom in/out\n" +
              "0 : Reset zoom\n" +
              "Delete : Delete photo\n" +
              "Escape : Close gallery"
          );
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext, goToFirst, goToLast, canDelete]);

  // Swipe gestures for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrevious,
    trackMouse: false,
    trackTouch: true,
  });

  // Download photo
  const handleDownload = async () => {
    const photoUrl = photos[currentIndex];
    try {
      // Generate filename
      const dateStr = logDate ? logDate.toISOString().split("T")[0] : "unknown";
      const filename = `buildlight-${projectName || "project"}-${dateStr}-${currentIndex + 1}.jpg`;

      // Download the file
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Show success message (you can integrate with your toast system)
      console.log("Photo downloaded successfully");
    } catch (error) {
      console.error("Failed to download photo:", error);
      alert("Failed to download photo. Please try again.");
    }
  };

  // Delete photo
  const handleDeleteConfirm = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      const photoToDelete = photos[currentIndex];
      await onDelete(photoToDelete, currentIndex);

      // If this was the last photo, close the modal
      if (photos.length === 1) {
        onClose();
      } else {
        // Navigate to next photo or previous if at end
        if (currentIndex >= photos.length - 1) {
          setCurrentIndex(Math.max(0, currentIndex - 1));
        }
      }

      setShowDeleteModal(false);
    } catch (error) {
      console.error("Failed to delete photo:", error);
      alert("Failed to delete photo. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <>
      {/* Full-screen modal */}
      <div
        ref={modalRef}
        className="fixed inset-0 z-50 bg-black/95 flex flex-col"
        onClick={handleBackdropClick}
        {...swipeHandlers}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-4">
            <h2 className="text-white text-lg font-semibold hidden md:block">
              Photo Gallery
            </h2>
            <span className="text-white/80 text-sm">
              {currentIndex + 1} / {photos.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download button */}
            <button
              onClick={handleDownload}
              className="p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg transition-colors backdrop-blur-sm"
              title="Download photo"
              aria-label="Download photo"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* Actions menu */}
            <PhotoActionsMenu
              photoUrl={currentPhoto}
              photoIndex={currentIndex}
              canDelete={canDelete}
              onDownload={handleDownload}
              onDelete={() => setShowDeleteModal(true)}
              projectName={projectName}
              logDate={logDate}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg transition-colors backdrop-blur-sm"
              title="Close (Esc)"
              aria-label="Close gallery"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main photo viewer */}
        <div className="flex-1 relative flex items-center justify-center px-4 md:px-16">
          <PhotoViewer photoUrl={currentPhoto} alt={`Photo ${currentIndex + 1}`} />

          {/* Navigation controls */}
          <NavigationControls
            currentIndex={currentIndex}
            totalPhotos={photos.length}
            onPrevious={goToPrevious}
            onNext={goToNext}
          />
        </div>

        {/* Thumbnail strip */}
        <PhotoThumbnailStrip
          photos={photos}
          currentIndex={currentIndex}
          onThumbnailClick={setCurrentIndex}
        />

        {/* Mobile hint */}
        <div className="md:hidden absolute bottom-24 left-0 right-0 text-center text-white/60 text-xs pb-2">
          Swipe to navigate ← →
        </div>
      </div>

      {/* Delete confirmation modal */}
      <DeletePhotoModal
        isOpen={showDeleteModal}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
        photoIndex={currentIndex}
        totalPhotos={photos.length}
      />

      {/* Deleting overlay */}
      {isDeleting && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            <span className="text-gray-900 dark:text-gray-100">Deleting photo...</span>
          </div>
        </div>
      )}
    </>
  );
}
