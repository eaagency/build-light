"use client";

import React, { useState, useMemo } from "react";
import { Task } from "@prisma/client";
import { COMMON_TASK_TAGS } from "@/lib/task-types";

interface BulkTagEditorProps {
  projectId: string;
  scheduleId: string;
  selectedTasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTasks: Task[]) => void;
}

type EditMode = "add" | "replace";

/**
 * BulkTagEditor Component
 * Modal for adding or replacing tags on multiple tasks
 *
 * Features:
 * - Add mode: Adds tags without removing existing
 * - Replace mode: Replaces all tags on selected tasks
 * - Common tag suggestions
 * - Custom tag input
 * - Duplicate tag handling
 */
export function BulkTagEditor({
  projectId,
  scheduleId,
  selectedTasks,
  isOpen,
  onClose,
  onSuccess,
}: BulkTagEditorProps) {
  const [mode, setMode] = useState<EditMode>("add");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analyze current tags
  const tagAnalysis = useMemo(() => {
    const allTags = new Set<string>();
    const tagCounts = new Map<string, number>();

    for (const task of selectedTasks) {
      if (task.tags) {
        for (const tag of task.tags) {
          allTags.add(tag);
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }
    }

    return {
      allTags: Array.from(allTags),
      tagCounts,
      totalUniqueTags: allTags.size,
    };
  }, [selectedTasks]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed) return;

    if (selectedTags.includes(trimmed)) {
      setError("Tag already selected");
      return;
    }

    if (selectedTags.length >= 10) {
      setError("Maximum 10 tags allowed");
      return;
    }

    setSelectedTags([...selectedTags, trimmed]);
    setCustomTag("");
    setError(null);
  };

  const handleApply = async () => {
    if (selectedTasks.length === 0 || selectedTags.length === 0) return;

    setIsUpdating(true);
    setError(null);

    try {
      // For each task, calculate new tags based on mode
      const taskUpdates = selectedTasks.map((task) => {
        let newTags: string[];

        if (mode === "add") {
          // Add tags without removing existing
          const existing = task.tags || [];
          const combined = [...existing, ...selectedTags];
          // Remove duplicates
          newTags = Array.from(new Set(combined));
        } else {
          // Replace all tags
          newTags = selectedTags;
        }

        return {
          id: task.id,
          tags: newTags.slice(0, 10), // Enforce max 10 tags
        };
      });

      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}/tasks/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskIds: selectedTasks.map((t) => t.id),
            updates: { tags: selectedTags },
            operation: mode === "add" ? "add-tags" : "replace-tags",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update tasks");
      }

      const data = await response.json();

      const message =
        mode === "add"
          ? `Added ${selectedTags.length} tag${selectedTags.length !== 1 ? "s" : ""} to ${data.updatedCount} tasks`
          : `Replaced tags on ${data.updatedCount} tasks`;

      showToast(message, "success");
      onSuccess(data.tasks);
      onClose();
    } catch (err: any) {
      console.error("Error updating task tags:", err);
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
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Task Tags
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
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Mode selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Edit Mode
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("add")}
                className={`flex-1 px-4 py-2 rounded-md border-2 transition-all ${
                  mode === "add"
                    ? "border-[#6BF178] bg-[#6BF178] bg-opacity-10 text-[#6BF178]"
                    : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className="text-sm font-medium">Add Tags</div>
                <div className="text-xs mt-0.5 opacity-75">
                  Keep existing tags
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMode("replace")}
                className={`flex-1 px-4 py-2 rounded-md border-2 transition-all ${
                  mode === "replace"
                    ? "border-[#6BF178] bg-[#6BF178] bg-opacity-10 text-[#6BF178]"
                    : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className="text-sm font-medium">Replace Tags</div>
                <div className="text-xs mt-0.5 opacity-75">
                  Remove all existing
                </div>
              </button>
            </div>
          </div>

          {/* Current tags (if any) */}
          {tagAnalysis.allTags.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Current Tags on Selected Tasks
              </label>
              <div className="flex flex-wrap gap-2">
                {tagAnalysis.allTags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                  >
                    {tag}
                    <span className="text-gray-500 dark:text-gray-400">
                      ({tagAnalysis.tagCounts.get(tag)} tasks)
                    </span>
                  </div>
                ))}
              </div>
              {mode === "replace" && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  ⚠️ These tags will be removed and replaced with new tags
                </p>
              )}
            </div>
          )}

          {/* Common tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Common Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_TASK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-[#6BF178] text-[#121212]"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Custom tag input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Custom Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                placeholder="Type custom tag and press Enter"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6BF178] focus:border-[#6BF178] dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={addCustomTag}
                disabled={!customTag.trim()}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Selected Tags ({selectedTags.length}/10)
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#6BF178] text-[#121212] rounded-full text-sm font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="hover:bg-[#121212] hover:text-[#6BF178] rounded-full p-0.5 transition-colors"
                    >
                      <svg
                        className="w-3 h-3"
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
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {selectedTags.length > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    {mode === "add" ? "Add Tags Preview" : "Replace Tags Preview"}
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    {mode === "add" ? (
                      <>
                        These tags will be added to all selected tasks. Existing
                        tags will be kept.
                      </>
                    ) : (
                      <>
                        All existing tags will be removed and replaced with these{" "}
                        {selectedTags.length} new tag
                        {selectedTags.length !== 1 ? "s" : ""}.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

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
            disabled={isUpdating || selectedTags.length === 0}
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
              <>
                {mode === "add" ? "Add Tags" : "Replace Tags"}
              </>
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
