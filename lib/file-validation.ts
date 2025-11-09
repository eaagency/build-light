/**
 * File Upload Validation Utilities
 *
 * Provides client and server-side validation for file uploads to Google Drive.
 * Enforces size limits and file type restrictions to prevent security issues
 * and ensure only construction-relevant files are uploaded.
 */

// Maximum file size: 50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 52,428,800 bytes

/**
 * Allowed MIME types for file uploads
 *
 * Categories:
 * - Images: JPEG, PNG, GIF, WebP, HEIC (photos from phones)
 * - Documents: PDF (plans, contracts, permits)
 * - Office: Word, Excel, PowerPoint (reports, schedules, presentations)
 * - Text: Plain text, CSV (data exports)
 * - Video: MP4, QuickTime (progress videos, walkthroughs)
 */
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',

  // Documents
  'application/pdf',

  // Microsoft Office (OpenXML formats)
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',       // .xlsx
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

  // Text files
  'text/plain',
  'text/csv',

  // Video files (for progress documentation)
  'video/mp4',
  'video/quicktime', // .mov
] as const;

/**
 * Friendly file type names for error messages
 */
export const ALLOWED_FILE_TYPES_DESCRIPTION =
  'images (JPEG, PNG, GIF, WebP, HEIC), PDFs, Office documents (Word, Excel, PowerPoint), text files, or videos (MP4, MOV)';

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a single file for size and type
 *
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `${file.name} exceeds 50MB limit (${formatFileSize(file.size)}). Please upload a smaller file.`,
    };
  }

  // Check if file has a type (some files might not)
  if (!file.type) {
    return {
      valid: false,
      error: `${file.name} has an unknown file type. Please ensure the file has a proper extension.`,
    };
  }

  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: `${file.name} is not a supported file type. Please upload ${ALLOWED_FILE_TYPES_DESCRIPTION}.`,
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files
 * Returns error on first invalid file found
 *
 * @param files - Array of files to validate
 * @returns Validation result with error message if any file is invalid
 */
export function validateFiles(files: File[]): FileValidationResult {
  if (!files || files.length === 0) {
    return {
      valid: false,
      error: 'No files selected',
    };
  }

  for (const file of files) {
    const result = validateFile(file);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

/**
 * Format bytes into human-readable file size
 *
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0) return 'Invalid size';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get file extension from filename
 *
 * @param filename - Name of the file
 * @returns File extension (lowercase, without dot) or empty string
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Check if file extension matches common allowed extensions
 * This is a secondary check - MIME type is the primary validation
 *
 * @param filename - Name of the file
 * @returns True if extension is allowed
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = getFileExtension(filename);
  const allowedExtensions = [
    // Images
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'heic',
    // Documents
    'pdf',
    // Office
    'docx', 'xlsx', 'pptx',
    // Text
    'txt', 'csv',
    // Video
    'mp4', 'mov',
  ];

  return allowedExtensions.includes(ext);
}

/**
 * Validate file on server-side (for API routes)
 * Throws error if validation fails
 *
 * @param file - File or file-like object with name, size, and type
 * @throws Error with user-friendly message if validation fails
 */
export function validateFileOrThrow(file: { name: string; size: number; type: string }): void {
  const result = validateFile(file as File);
  if (!result.valid) {
    throw new Error(result.error);
  }
}

/**
 * Calculate total size of multiple files
 *
 * @param files - Array of files
 * @returns Total size in bytes
 */
export function getTotalFileSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0);
}

/**
 * Check if total file size exceeds a limit
 * Useful for batch upload limits
 *
 * @param files - Array of files
 * @param maxTotalSize - Maximum total size in bytes (default: 200MB)
 * @returns Validation result
 */
export function validateTotalFileSize(
  files: File[],
  maxTotalSize: number = 200 * 1024 * 1024
): FileValidationResult {
  const totalSize = getTotalFileSize(files);

  if (totalSize > maxTotalSize) {
    return {
      valid: false,
      error: `Total file size (${formatFileSize(totalSize)}) exceeds ${formatFileSize(maxTotalSize)} limit. Please upload fewer files.`,
    };
  }

  return { valid: true };
}
