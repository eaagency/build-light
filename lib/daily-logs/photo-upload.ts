/**
 * Photo Upload Utility for Daily Logs
 * Handles client-side compression and Google Drive upload
 */

import imageCompression from "browser-image-compression";
import { format } from "date-fns";

/**
 * Photo upload options for compression
 */
export interface PhotoUploadOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
}

/**
 * Default photo compression options
 * Optimized for mobile field use (saves bandwidth)
 */
export const DEFAULT_PHOTO_OPTIONS: PhotoUploadOptions = {
  maxSizeMB: 1, // 1MB max per photo
  maxWidthOrHeight: 1920, // 1080p max resolution
  useWebWorker: true, // Use web worker for better performance
};

/**
 * Compress photo client-side
 * Reduces file size before upload to save bandwidth
 *
 * @param file - Original photo file
 * @param options - Compression options
 * @returns Compressed file
 */
export async function compressPhoto(
  file: File,
  options: PhotoUploadOptions = DEFAULT_PHOTO_OPTIONS
): Promise<File> {
  try {
    const compressed = await imageCompression(file, options);
    return compressed;
  } catch (error) {
    console.error("Photo compression failed:", error);
    // If compression fails, return original file
    return file;
  }
}

/**
 * Upload photo to Google Drive via API
 * Photos are stored in: BuildLight/[Project]/Daily Logs/YYYY-MM-DD/
 *
 * @param file - Photo file to upload
 * @param projectId - Project ID
 * @param logDate - Date of the daily log
 * @returns Google Drive file URL
 */
export async function uploadDailyLogPhoto(
  file: File,
  projectId: string,
  logDate: Date
): Promise<string> {
  try {
    // 1. Compress photo client-side
    const compressed = await compressPhoto(file);

    // 2. Prepare form data
    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("projectId", projectId);
    formData.append("folderPath", `Daily Logs/${format(logDate, "yyyy-MM-dd")}`);

    // 3. Upload to server (which uploads to Google Drive)
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Upload failed");
    }

    const data = await response.json();
    return data.url; // Google Drive webViewLink
  } catch (error) {
    console.error("Photo upload failed:", error);
    throw new Error("Failed to upload photo");
  }
}

/**
 * Upload multiple photos
 * Uploads photos sequentially to avoid overwhelming the server
 *
 * @param files - Array of photo files
 * @param projectId - Project ID
 * @param logDate - Date of the daily log
 * @param onProgress - Progress callback (called after each upload)
 * @returns Array of Google Drive URLs
 */
export async function uploadMultiplePhotos(
  files: File[],
  projectId: string,
  logDate: Date,
  onProgress?: (uploaded: number, total: number) => void
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const url = await uploadDailyLogPhoto(files[i], projectId, logDate);
      urls.push(url);
      onProgress?.(i + 1, files.length);
    } catch (error) {
      console.error(`Failed to upload photo ${i + 1}:`, error);
      // Continue with other uploads even if one fails
    }
  }

  return urls;
}

/**
 * Delete photo from Google Drive via API
 *
 * @param photoUrl - Google Drive URL
 */
export async function deleteDailyLogPhoto(photoUrl: string): Promise<void> {
  try {
    // Extract file ID from Drive URL
    const fileId = extractDriveFileId(photoUrl);

    if (!fileId) {
      throw new Error("Invalid Google Drive URL");
    }

    const response = await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId }),
    });

    if (!response.ok) {
      throw new Error("Failed to delete photo");
    }
  } catch (error) {
    console.error("Photo deletion failed:", error);
    // Don't throw - allow log deletion even if photo deletion fails
    // The photo will be orphaned but won't block the operation
  }
}

/**
 * Delete multiple photos from Google Drive
 *
 * @param photoUrls - Array of Google Drive URLs
 */
export async function deleteMultiplePhotos(
  photoUrls: string[]
): Promise<void> {
  await Promise.allSettled(
    photoUrls.map((url) => deleteDailyLogPhoto(url))
  );
}

/**
 * Extract Google Drive file ID from URL
 * Supports various Drive URL formats
 *
 * @param url - Google Drive URL
 * @returns File ID or empty string if not found
 */
function extractDriveFileId(url: string): string {
  // Format 1: https://drive.google.com/file/d/FILE_ID/view
  const match1 = url.match(/\/d\/([^/]+)/);
  if (match1) return match1[1];

  // Format 2: https://drive.google.com/open?id=FILE_ID
  const match2 = url.match(/[?&]id=([^&]+)/);
  if (match2) return match2[1];

  // Format 3: https://drive.google.com/uc?id=FILE_ID
  const match3 = url.match(/uc\?id=([^&]+)/);
  if (match3) return match3[1];

  return "";
}

/**
 * Validate photo file
 * Checks file type and size before upload
 *
 * @param file - File to validate
 * @returns Validation result
 */
export function validatePhotoFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
    };
  }

  // Check file size (10MB max before compression)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File too large. Maximum size is 10MB.",
    };
  }

  return { valid: true };
}

/**
 * Validate multiple photo files
 *
 * @param files - Files to validate
 * @returns Validation results
 */
export function validatePhotoFiles(files: File[]): {
  valid: File[];
  invalid: Array<{ file: File; error: string }>;
} {
  const valid: File[] = [];
  const invalid: Array<{ file: File; error: string }> = [];

  files.forEach((file) => {
    const result = validatePhotoFile(file);
    if (result.valid) {
      valid.push(file);
    } else {
      invalid.push({ file, error: result.error! });
    }
  });

  return { valid, invalid };
}

/**
 * Get estimated upload time
 * Based on file size and average upload speed
 *
 * @param fileSizeBytes - File size in bytes
 * @returns Estimated time in seconds
 */
export function getEstimatedUploadTime(fileSizeBytes: number): number {
  // Assume average mobile upload speed of 2 Mbps
  const uploadSpeedBytesPerSecond = (2 * 1024 * 1024) / 8; // 256 KB/s
  return Math.ceil(fileSizeBytes / uploadSpeedBytesPerSecond);
}
