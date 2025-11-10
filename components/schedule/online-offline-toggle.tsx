"use client";

import React, { useState } from "react";

interface OnlineOfflineToggleProps {
  projectId: string;
  scheduleId: string;
  isPublic: boolean;
  onToggle: (isPublic: boolean) => void;
  className?: string;
}

/**
 * OnlineOfflineToggle Component
 * Controls schedule visibility for clients and subcontractors
 *
 * OFFLINE (Private):
 * - Not visible to CLIENTS or SUBCONTRACTORS
 * - Only PROJECT_MANAGER+ can view
 * - Grey lock icon
 *
 * ONLINE (Shared):
 * - Visible to assigned CLIENTS and SUBS
 * - Green unlock icon
 */
export function OnlineOfflineToggle({
  projectId,
  scheduleId,
  isPublic,
  onToggle,
  className = "",
}: OnlineOfflineToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPublic: !isPublic }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update schedule visibility");
      }

      onToggle(!isPublic);

      // Show toast
      showToast(
        isPublic
          ? "Schedule is now private"
          : "Schedule is now shared with team",
        "success"
      );
    } catch (err: any) {
      console.error("Error updating schedule visibility:", err);
      setError(err.message);
      showToast(err.message || "Failed to update visibility", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Toggle switch */}
      <label className="flex items-center gap-2 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={handleToggle}
            disabled={isUpdating}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isPublic ? "Share Schedule" : "Private Mode"}
        </span>
      </label>

      {/* Status badge */}
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-md ${
          isPublic
            ? "bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700"
            : "bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700"
        }`}
      >
        {isPublic ? (
          <>
            <svg
              className="w-4 h-4 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs font-medium text-green-700 dark:text-green-300">
              Shared
            </span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Private
            </span>
          </>
        )}
      </div>

      {/* Info tooltip */}
      <div className="group relative">
        <svg
          className="w-4 h-4 text-gray-400 cursor-help"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10 w-64">
          <div className="bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3">
            {isPublic ? (
              <>
                <p className="font-semibold mb-1">Shared Mode</p>
                <p className="text-gray-300">
                  Schedule is visible to assigned team members, including clients
                  and subcontractors.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold mb-1">Private Mode</p>
                <p className="text-gray-300">
                  Schedule is only visible to project managers and above. Clients
                  and subcontractors cannot access it.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}

/**
 * Helper function to show toast notifications
 */
function showToast(message: string, type: "success" | "error") {
  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
    type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
  } animate-fade-in`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
