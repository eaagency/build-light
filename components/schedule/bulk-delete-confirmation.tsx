"use client";

import React, { useState } from "react";
import { Task } from "@prisma/client";

interface BulkDeleteConfirmationProps {
  projectId: string;
  scheduleId: string;
  selectedTasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * BulkDeleteConfirmation Component
 * Modal with strong confirmation before bulk delete
 *
 * Features:
 * - Lists all tasks to be deleted
 * - "This cannot be undone" warning
 * - Requires typing "DELETE" if > 10 tasks
 * - Destructive styling (red)
 */
export function BulkDeleteConfirmation({
  projectId,
  scheduleId,
  selectedTasks,
  isOpen,
  onClose,
  onSuccess,
}: BulkDeleteConfirmationProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requiresTyping = selectedTasks.length > 10;
  const canDelete = !requiresTyping || confirmText === "DELETE";

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}/tasks/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskIds: selectedTasks.map((t) => t.id),
            operation: "delete",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete tasks");
      }

      showToast(`Deleted ${selectedTasks.length} tasks`, "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error deleting tasks:", err);
      setError(err.message || "Failed to delete tasks");
      showToast("Failed to delete tasks", "error");
    } finally {
      setIsDeleting(false);
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
        <div className="px-6 py-4 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">
                Delete {selectedTasks.length} Task{selectedTasks.length !== 1 ? "s" : ""}?
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Warning message */}
          <div className="p-4 bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-md">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>⚠️ Warning:</strong> Deleting these tasks will permanently
              remove them from the schedule. Any dependencies on these tasks will be
              cleared from other tasks.
            </p>
          </div>

          {/* Tasks to be deleted */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Tasks to Delete
            </label>
            <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-800">
              {selectedTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <span className="text-gray-500 dark:text-gray-400 w-8">
                    {index + 1}.
                  </span>
                  <span className="text-gray-900 dark:text-white truncate flex-1">
                    {task.name}
                  </span>
                  {task.phase && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                      {task.phase}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Confirmation input for large deletions */}
          {requiresTyping && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Type <span className="font-mono text-red-600">DELETE</span> to
                confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3 py-2 border-2 border-red-300 dark:border-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-800 dark:text-white font-mono"
                autoFocus
              />
              {confirmText && confirmText !== "DELETE" && (
                <p className="text-xs text-red-500 mt-1">
                  Please type exactly "DELETE" (all caps)
                </p>
              )}
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
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel (Keep Tasks)
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || !canDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isDeleting ? (
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
                Deleting...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Yes, Delete {selectedTasks.length} Task
                {selectedTasks.length !== 1 ? "s" : ""}
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
