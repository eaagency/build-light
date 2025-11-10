"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { DailyLogWithRelations } from "@/lib/api/daily-logs";
import { WeatherBadge } from "./weather-badge";
import { PhotoPreviewGrid } from "./photo-preview-grid";

interface DailyLogCardProps {
  /**
   * Daily log data
   */
  log: DailyLogWithRelations;
  /**
   * Current user ID (for permission checks)
   */
  currentUserId?: string;
  /**
   * Can the current user edit this log
   */
  canEdit?: boolean;
  /**
   * Can the current user delete this log
   */
  canDelete?: boolean;
  /**
   * Edit button click handler
   */
  onEdit?: (log: DailyLogWithRelations) => void;
  /**
   * Delete button click handler
   */
  onDelete?: (log: DailyLogWithRelations) => void;
  /**
   * Photo click handler
   */
  onPhotoClick?: (photoUrl: string, index: number) => void;
  /**
   * Card click handler (for opening detail view)
   */
  onClick?: (log: DailyLogWithRelations) => void;
}

const ACTIVITIES_PREVIEW_LENGTH = 150;

export function DailyLogCard({
  log,
  currentUserId,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  onPhotoClick,
  onClick,
}: DailyLogCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldTruncate = log.activities.length > ACTIVITIES_PREVIEW_LENGTH;
  const displayActivities =
    shouldTruncate && !isExpanded
      ? log.activities.substring(0, ACTIVITIES_PREVIEW_LENGTH) + "..."
      : log.activities;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on buttons or interactive elements
    const target = e.target as HTMLElement;
    if (
      target.tagName === "BUTTON" ||
      target.closest("button") ||
      target.tagName === "A"
    ) {
      return;
    }
    onClick?.(log);
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={handleCardClick}
    >
      {/* Header: Weather */}
      <div className="flex items-center justify-between mb-3">
        {log.weather && <WeatherBadge weather={log.weather} size="md" />}

        {/* Actions menu (desktop) */}
        {(canEdit || canDelete) && (
          <div className="hidden md:flex items-center gap-2">
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(log);
                }}
                className="text-sm text-gray-600 hover:text-[#6BF178] font-medium transition-colors"
                type="button"
              >
                ✏️ Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(log);
                }}
                className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                type="button"
              >
                🗑️ Delete
              </button>
            )}
          </div>
        )}

        {/* Actions menu (mobile - 3-dot) */}
        {(canEdit || canDelete) && (
          <button
            className="md:hidden text-gray-400 hover:text-gray-600"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Open actions dropdown menu
            }}
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        )}
      </div>

      {/* Activities */}
      <div className="mb-4">
        <p className="text-gray-900 whitespace-pre-wrap">{displayActivities}</p>
        {shouldTruncate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="text-[#6BF178] hover:text-[#5DE168] font-medium text-sm mt-1 transition-colors"
            type="button"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {/* Photos */}
      {log.photos.length > 0 && (
        <div className="mb-4">
          <PhotoPreviewGrid
            photos={log.photos}
            onPhotoClick={onPhotoClick}
            maxDisplay={3}
          />
        </div>
      )}

      {/* Crew Notes Indicator */}
      {log.crewNotes && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>📝</span>
            <span className="font-medium">Crew notes available</span>
          </div>
        </div>
      )}

      {/* Footer: Creator and Assigned To */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-gray-100">
        {/* Creator */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
            {(log.createdBy.name || log.createdBy.email).charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {log.createdBy.name || log.createdBy.email}
            </p>
            <p className="text-xs text-gray-500">
              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Assigned To */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-gray-500">Assigned to:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-[#6BF178] flex items-center justify-center text-black text-xs font-medium">
              {(log.assignedTo.name || log.assignedTo.email)
                .charAt(0)
                .toUpperCase()}
            </div>
            <span className="font-medium text-gray-900">
              {log.assignedTo.name || log.assignedTo.email}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
