"use client";

import React, { useState, useMemo } from "react";
import { Task, TaskPhase } from "@prisma/client";
import {
  TASK_PHASE_LABELS,
  TASK_PHASE_ORDER,
  getPhaseColor,
  getPhaseLabel,
} from "@/lib/task-types";

interface BulkPhaseAssignmentProps {
  projectId: string;
  scheduleId: string;
  selectedTasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedTasks: Task[]) => void;
  autoColorByPhase?: boolean;
}

/**
 * BulkPhaseAssignment Component
 * Modal for changing phase of multiple tasks at once
 *
 * Features:
 * - Phase dropdown with validation
 * - Shows current phases of selected tasks
 * - Warning for incompatible phase changes
 * - Auto-updates colors if autoColorByPhase is enabled
 */
export function BulkPhaseAssignment({
  projectId,
  scheduleId,
  selectedTasks,
  isOpen,
  onClose,
  onSuccess,
  autoColorByPhase = true,
}: BulkPhaseAssignmentProps) {
  const [selectedPhase, setSelectedPhase] = useState<TaskPhase | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analyze current phases
  const phaseAnalysis = useMemo(() => {
    const phaseCounts = new Map<TaskPhase, number>();
    const uniquePhases = new Set<TaskPhase>();

    for (const task of selectedTasks) {
      if (task.phase) {
        uniquePhases.add(task.phase);
        phaseCounts.set(task.phase, (phaseCounts.get(task.phase) || 0) + 1);
      }
    }

    return {
      uniquePhases: Array.from(uniquePhases),
      phaseCounts,
      hasMultiplePhases: uniquePhases.size > 1,
    };
  }, [selectedTasks]);

  // Check if phase change is incompatible (jumping too far)
  const getPhaseWarning = (newPhase: TaskPhase): string | null => {
    if (!phaseAnalysis.uniquePhases.length) return null;

    const currentPhaseIndexes = phaseAnalysis.uniquePhases.map((p) =>
      TASK_PHASE_ORDER.indexOf(p)
    );
    const newPhaseIndex = TASK_PHASE_ORDER.indexOf(newPhase);

    const minCurrentIndex = Math.min(...currentPhaseIndexes);
    const maxCurrentIndex = Math.max(...currentPhaseIndexes);

    // Jumping backward more than 2 phases
    if (newPhaseIndex < minCurrentIndex - 2) {
      return "⚠️ This moves tasks significantly backward in the construction sequence";
    }

    // Jumping forward more than 3 phases
    if (newPhaseIndex > maxCurrentIndex + 3) {
      return "⚠️ This skips multiple construction phases";
    }

    return null;
  };

  const handleApply = async () => {
    if (!selectedPhase || selectedTasks.length === 0) return;

    setIsUpdating(true);
    setError(null);

    try {
      const updates: any = { phase: selectedPhase };

      // Auto-update color if enabled
      if (autoColorByPhase) {
        updates.color = getPhaseColor(selectedPhase);
      }

      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}/tasks/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskIds: selectedTasks.map((t) => t.id),
            updates,
            operation: "update",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update tasks");
      }

      const data = await response.json();

      const message = autoColorByPhase
        ? `Updated ${data.updatedCount} tasks to ${getPhaseLabel(selectedPhase)} phase with phase color`
        : `Updated ${data.updatedCount} tasks to ${getPhaseLabel(selectedPhase)} phase`;

      showToast(message, "success");
      onSuccess(data.tasks);
      onClose();
    } catch (err: any) {
      console.error("Error updating task phases:", err);
      setError(err.message || "Failed to update tasks");
      showToast("Failed to update tasks", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  const warning = selectedPhase ? getPhaseWarning(selectedPhase) : null;

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
                Change Task Phase
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
          {/* Current phases summary */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Current Phases
            </label>
            <div className="flex flex-wrap gap-2">
              {phaseAnalysis.uniquePhases.map((phase) => (
                <div
                  key={phase}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-md"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getPhaseColor(phase) }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {getPhaseLabel(phase)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({phaseAnalysis.phaseCounts.get(phase)} tasks)
                  </span>
                </div>
              ))}
            </div>
            {phaseAnalysis.hasMultiplePhases && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Selected tasks are in different phases
              </p>
            )}
          </div>

          {/* New phase selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              New Phase <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPhase || ""}
              onChange={(e) => setSelectedPhase(e.target.value as TaskPhase)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6BF178] focus:border-[#6BF178] dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select new phase...</option>
              {TASK_PHASE_ORDER.map((phase) => (
                <option key={phase} value={phase}>
                  {getPhaseLabel(phase)}
                </option>
              ))}
            </select>
          </div>

          {/* Phase change preview */}
          {selectedPhase && (
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
                    Phase Change Preview
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    All selected tasks will be changed to{" "}
                    <span className="font-semibold">
                      {getPhaseLabel(selectedPhase)}
                    </span>{" "}
                    phase.
                  </p>
                  {autoColorByPhase && (
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Task colors will automatically update to{" "}
                      <span
                        className="inline-block w-4 h-4 rounded align-middle"
                        style={{ backgroundColor: getPhaseColor(selectedPhase) }}
                      />{" "}
                      {getPhaseLabel(selectedPhase)} phase color.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Warning for incompatible changes */}
          {warning && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-700 rounded-md">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-amber-600 dark:text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Unusual Phase Change
                  </h4>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {warning}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selected tasks list */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Selected Tasks ({selectedTasks.length})
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {selectedTasks.slice(0, 10).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm"
                >
                  <span className="text-gray-900 dark:text-white truncate flex-1">
                    {task.name}
                  </span>
                  {task.phase && (
                    <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400 ml-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getPhaseColor(task.phase) }}
                      />
                      {getPhaseLabel(task.phase)}
                    </span>
                  )}
                </div>
              ))}
              {selectedTasks.length > 10 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                  and {selectedTasks.length - 10} more tasks...
                </p>
              )}
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
            disabled={isUpdating || !selectedPhase}
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
                Changing Phase...
              </>
            ) : (
              "Change Phase"
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
