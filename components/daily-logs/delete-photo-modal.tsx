"use client";

import { AlertTriangle } from "lucide-react";

interface DeletePhotoModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  photoIndex: number;
  totalPhotos: number;
}

export function DeletePhotoModal({
  isOpen,
  onConfirm,
  onCancel,
  photoIndex,
  totalPhotos,
}: DeletePhotoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-center text-gray-900 dark:text-gray-100 mb-2">
          Delete this photo?
        </h3>

        {/* Description */}
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete photo {photoIndex + 1} of {totalPhotos}? This
          action cannot be undone and the photo will be permanently removed from Google
          Drive.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            Delete Photo
          </button>
        </div>
      </div>
    </div>
  );
}
