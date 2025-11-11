"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Trash2, MoreVertical, ExternalLink, Link as LinkIcon } from "lucide-react";

interface PhotoActionsMenuProps {
  photoUrl: string;
  photoIndex: number;
  canDelete: boolean;
  onDownload: () => void;
  onDelete: () => void;
  projectName?: string;
  logDate?: Date;
}

export function PhotoActionsMenu({
  photoUrl,
  photoIndex,
  canDelete,
  onDownload,
  onDelete,
  projectName,
  logDate,
}: PhotoActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(photoUrl);
      // Show toast notification (you can integrate with your toast system)
      alert("Link copied to clipboard!");
      setIsOpen(false);
    } catch (err) {
      console.error("Failed to copy link:", err);
      alert("Failed to copy link");
    }
  };

  const handleViewInDrive = () => {
    // Extract file ID from Google Drive URL and open in new tab
    const fileIdMatch = photoUrl.match(/[-\w]{25,}/);
    if (fileIdMatch) {
      window.open(`https://drive.google.com/file/d/${fileIdMatch[0]}/view`, "_blank");
    } else {
      window.open(photoUrl, "_blank");
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Menu toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg transition-colors backdrop-blur-sm"
        title="More actions"
        aria-label="More actions"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {/* Download */}
          <button
            onClick={() => {
              onDownload();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Download original
            </span>
          </button>

          {/* View in Google Drive */}
          <button
            onClick={handleViewInDrive}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              View in Google Drive
            </span>
          </button>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <LinkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Copy link
            </span>
          </button>

          {/* Delete (if permitted) */}
          {canDelete && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700" />
              <button
                onClick={() => {
                  onDelete();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
              >
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-500" />
                <span className="text-sm font-medium text-red-600 dark:text-red-500">
                  Delete photo
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
