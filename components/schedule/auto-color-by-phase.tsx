"use client";

import React, { useState } from "react";

interface AutoColorByPhaseProps {
  organizationId: string;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

/**
 * AutoColorByPhase Component
 * Toggle for automatic task coloring based on phase
 *
 * When enabled (default):
 * - Tasks automatically get color of their phase
 * - Changing task phase auto-updates color
 * - Manual color changes disabled
 *
 * When disabled:
 * - Users can set custom colors per task
 * - Phase changes don't affect color
 *
 * Setting saved to organization preferences
 */
export function AutoColorByPhase({
  organizationId,
  isEnabled,
  onToggle,
  className = "",
}: AutoColorByPhaseProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setIsUpdating(true);
    setError(null);

    try {
      const newValue = !isEnabled;

      const response = await fetch(
        `/api/organizations/${organizationId}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            autoColorByPhase: newValue,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update setting");
      }

      onToggle(newValue);

      showToast(
        newValue
          ? "Auto-color by phase enabled"
          : "Manual color selection enabled",
        "success"
      );
    } catch (err: any) {
      console.error("Error updating auto-color setting:", err);
      setError(err.message);
      showToast("Failed to update setting", "error");
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
            checked={isEnabled}
            onChange={handleToggle}
            disabled={isUpdating}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#6BF178] peer-focus:ring-opacity-50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#6BF178] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Auto-Color by Phase
        </span>
      </label>

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
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10 w-72">
          <div className="bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3">
            {isEnabled ? (
              <>
                <p className="font-semibold mb-1">Auto-Color Enabled</p>
                <p className="text-gray-300 mb-2">
                  Tasks automatically use their phase color. When you change a
                  task's phase, the color updates automatically.
                </p>
                <p className="text-gray-400 text-xs">
                  Manual color selection is disabled.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold mb-1">Manual Color Selection</p>
                <p className="text-gray-300 mb-2">
                  You can set custom colors for each task. Phase changes won't
                  affect task colors.
                </p>
                <p className="text-gray-400 text-xs">
                  Gives you full control over task colors.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status badge */}
      {isEnabled ? (
        <span className="px-2 py-1 bg-[#6BF178] bg-opacity-10 text-[#6BF178] text-xs font-medium rounded">
          Auto
        </span>
      ) : (
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded">
          Manual
        </span>
      )}

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
