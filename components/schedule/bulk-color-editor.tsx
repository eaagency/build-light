"use client";

import React, { useState } from "react";
import { Task, TaskPhase } from "@prisma/client";
import { TASK_PHASE_COLORS, getPhaseColor } from "@/lib/task-types";

interface BulkColorEditorProps {
  projectId: string;
  scheduleId: string;
  selectedTasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTasks: Task[]) => void;
}

/**
 * BulkColorEditor Component
 * Modal for changing color of multiple tasks at once
 *
 * Features:
 * - Phase color presets
 * - Custom color picker
 * - Preview selected color
 * - Optimistic updates
 */
export function BulkColorEditor({
  projectId,
  scheduleId,
  selectedTasks,
  isOpen,
  onClose,
  onSuccess,
}: BulkColorEditorProps) {
  const [selectedColor, setSelectedColor] = useState<string>("#6BF178");
  const [customColor, setCustomColor] = useState<string>("#6BF178");
  const [useCustom, setUseCustom] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApply = async () => {
    if (selectedTasks.length === 0) return;

    setIsUpdating(true);
    setError(null);

    try {
      const color = useCustom ? customColor : selectedColor;

      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}/tasks/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskIds: selectedTasks.map((t) => t.id),
            updates: { color },
            operation: "update",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update tasks");
      }

      const data = await response.json();

      showToast(`Updated ${data.updatedCount} tasks`, "success");
      onSuccess(data.tasks);
      onClose();
    } catch (err: any) {
      console.error("Error updating task colors:", err);
      setError(err.message || "Failed to update tasks");
      showToast("Failed to update tasks", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change Task Colors
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}{" "}
                selected
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Phase color presets */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Phase Colors
            </label>
            <div className="grid grid-cols-7 gap-2">
              {Object.entries(TASK_PHASE_COLORS).map(([phase, color]) => (
                <button
                  key={phase}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color);
                    setUseCustom(false);
                  }}
                  className={`w-full aspect-square rounded-md border-2 transition-all hover:scale-110 ${
                    !useCustom && selectedColor === color
                      ? "border-[#121212] dark:border-white ring-2 ring-[#6BF178]"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  style={{ backgroundColor: color }}
                  title={phase}
                />
              ))}
            </div>
          </div>

          {/* Custom color picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Custom Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setUseCustom(true);
                }}
                className="w-20 h-20 rounded-md border-2 border-gray-300 dark:border-gray-700 cursor-pointer"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    setUseCustom(true);
                  }}
                  placeholder="#6BF178"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6BF178] focus:border-[#6BF178] dark:bg-gray-800 dark:text-white font-mono"
                />
                {useCustom && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Using custom color
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Preview
            </label>
            <div
              className="w-full h-12 rounded-md border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center text-white font-medium shadow-sm"
              style={{ backgroundColor: useCustom ? customColor : selectedColor }}
            >
              Task Color Preview
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={isUpdating}
            className="px-4 py-2 text-sm font-medium text-[#121212] bg-[#6BF178] rounded-md hover:bg-[#5ae067] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Applying...
              </>
            ) : (
              "Apply to Selected"
            )}
          </button>
        </div>
      </div>
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
