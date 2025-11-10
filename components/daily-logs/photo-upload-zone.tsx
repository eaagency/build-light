"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { PhotoThumbnail } from "./photo-thumbnail";
import { compressPhoto, validatePhotoFile } from "@/lib/daily-logs/photo-upload";
import { show } from "@/lib/toast";

interface PhotoInfo {
  url: string;
  uploading: boolean;
  progress: number;
  originalSize?: number;
  compressedSize?: number;
}

interface PhotoUploadZoneProps {
  photos: string[]; // Array of Google Drive URLs
  onChange: (photos: string[]) => void;
  projectId: string;
  logDate: Date;
  maxPhotos?: number;
  disabled?: boolean;
}

/**
 * PhotoUploadZone Component
 * Drag-and-drop zone for photo uploads with compression
 *
 * Features:
 * - Drag-and-drop support
 * - Multiple file selection
 * - Client-side compression (saves bandwidth)
 * - Upload progress per photo
 * - Thumbnail preview with remove
 * - Max 50 photos per log
 * - Camera access on mobile
 */
export function PhotoUploadZone({
  photos,
  onChange,
  projectId,
  logDate,
  maxPhotos = 50,
  disabled = false,
}: PhotoUploadZoneProps) {
  const [photoInfoMap, setPhotoInfoMap] = useState<Map<string, PhotoInfo>>(
    new Map()
  );
  const [isUploading, setIsUploading] = useState(false);

  // Handle file drop/selection
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return;

      // Check max photos limit
      if (photos.length + acceptedFiles.length > maxPhotos) {
        show(`Maximum ${maxPhotos} photos allowed per log`, { icon: "⚠️" });
        return;
      }

      setIsUploading(true);

      for (const file of acceptedFiles) {
        // Validate file
        const validation = validatePhotoFile(file);
        if (!validation.valid) {
          show(validation.error || "Invalid photo file", { icon: "❌" });
          continue;
        }

        try {
          // Create temporary URL for preview
          const tempUrl = URL.createObjectURL(file);

          // Add to map with uploading state
          setPhotoInfoMap((prev) => {
            const next = new Map(prev);
            next.set(tempUrl, {
              url: tempUrl,
              uploading: true,
              progress: 0,
              originalSize: file.size,
            });
            return next;
          });

          // Compress photo
          const compressed = await compressPhoto(file);

          // Update progress
          setPhotoInfoMap((prev) => {
            const next = new Map(prev);
            const info = next.get(tempUrl);
            if (info) {
              next.set(tempUrl, { ...info, progress: 50 });
            }
            return next;
          });

          // Upload to Google Drive (via API)
          const formData = new FormData();
          formData.append("file", compressed);
          formData.append("projectId", projectId);
          formData.append(
            "folderPath",
            `Daily Logs/${logDate.toISOString().split("T")[0]}`
          );

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Upload failed");
          }

          const data = await response.json();
          const driveUrl = data.url;

          // Update with final URL and completion
          setPhotoInfoMap((prev) => {
            const next = new Map(prev);
            next.delete(tempUrl); // Remove temp entry
            next.set(driveUrl, {
              url: driveUrl,
              uploading: false,
              progress: 100,
              originalSize: file.size,
              compressedSize: compressed.size,
            });
            return next;
          });

          // Add to photos array
          onChange([...photos, driveUrl]);

          // Clean up temp URL
          URL.revokeObjectURL(tempUrl);
        } catch (error) {
          console.error("Photo upload error:", error);
          show(`Failed to upload ${file.name}`, { icon: "❌" });

          // Remove failed upload from map
          setPhotoInfoMap((prev) => {
            const next = new Map(prev);
            const tempUrl = URL.createObjectURL(file);
            next.delete(tempUrl);
            return next;
          });
        }
      }

      setIsUploading(false);
    },
    [photos, onChange, projectId, logDate, maxPhotos, disabled]
  );

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".heic"],
    },
    multiple: true,
    disabled: disabled || isUploading,
    maxFiles: maxPhotos - photos.length,
  });

  // Handle photo removal
  const handleRemove = (url: string) => {
    onChange(photos.filter((p) => p !== url));
    setPhotoInfoMap((prev) => {
      const next = new Map(prev);
      next.delete(url);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        Photos {photos.length > 0 && `(${photos.length})`}
      </label>

      {/* Upload Zone */}
      {photos.length < maxPhotos && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${
              isDragActive
                ? "border-[#6BF178] bg-[#6BF178]/10"
                : "border-gray-300 dark:border-gray-700 hover:border-[#6BF178]"
            }
            ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <input {...getInputProps()} />

          {/* Icon */}
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          {/* Text */}
          {isDragActive ? (
            <p className="text-[#6BF178] font-medium">Drop photos here...</p>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Drop photos here or click to upload
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                JPEG, PNG, HEIC, or WebP • Max {maxPhotos} photos
              </p>
            </>
          )}

          {/* Mobile: Camera button */}
          <div className="mt-4 md:hidden">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#6BF178] text-gray-900 rounded-lg font-medium"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Take Photo
            </button>
          </div>
        </div>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((url) => {
            const info = photoInfoMap.get(url);

            return (
              <PhotoThumbnail
                key={url}
                url={url}
                onRemove={() => handleRemove(url)}
                uploading={info?.uploading}
                uploadProgress={info?.progress}
                originalSize={info?.originalSize}
                compressedSize={info?.compressedSize}
                disabled={disabled}
              />
            );
          })}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Photos are compressed automatically to save bandwidth. Maximum 50 photos per log.
      </p>
    </div>
  );
}
