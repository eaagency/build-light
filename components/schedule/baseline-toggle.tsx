"use client";

import React, { useState } from "react";
import { Task } from "@prisma/client";

interface Baseline {
  id: string;
  name: string;
  createdAt: Date;
  tasks: Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    phase: string | null;
  }>;
}

interface BaselineToggleProps {
  projectId: string;
  scheduleId: string;
  currentBaseline: Baseline | null;
  tasks: Task[];
  onBaselineSet: (baseline: Baseline) => void;
  className?: string;
}

/**
 * BaselineToggle Component
 * Allows users to set and manage schedule baselines for variance tracking
 *
 * - Set as Baseline: Creates snapshot of current schedule
 * - Update Baseline: Updates existing baseline
 * - View Variance: Shows comparison between baseline and current
 */
export function BaselineToggle({
  projectId,
  scheduleId,
  currentBaseline,
  tasks,
  onBaselineSet,
  className = "",
}: BaselineToggleProps) {
  const [isSettingBaseline, setIsSettingBaseline] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasBaseline = currentBaseline !== null;

  const handleSetBaseline = async () => {
    if (tasks.length === 0) {
      setError("Cannot set baseline with no tasks");
      return;
    }

    setIsSettingBaseline(true);
    setError(null);

    try {
      // Create baseline snapshot
      const baselineData = {
        name: `Baseline ${new Date().toLocaleDateString()}`,
        isBaseline: true,
        tasks: tasks.map((task) => ({
          id: task.id,
          name: task.name,
          startDate: task.startDate,
          endDate: task.endDate,
          phase: task.phase,
        })),
      };

      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}/baseline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(baselineData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to set baseline");
      }

      const data = await response.json();

      onBaselineSet(data.baseline);
      setShowConfirmDialog(false);

      // Show success toast
      showToast("Baseline set successfully", "success");
    } catch (err: any) {
      console.error("Error setting baseline:", err);
      setError(err.message || "Failed to set baseline");
      showToast(err.message || "Failed to set baseline", "error");
    } finally {
      setIsSettingBaseline(false);
    }
  };

  const handleUpdateBaseline = () => {
    setShowConfirmDialog(true);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Set/Update Baseline Button */}
      {!hasBaseline ? (
        <button
          type="button"
          onClick={handleSetBaseline}
          disabled={isSettingBaseline || tasks.length === 0}
          className="px-4 py-2 bg-[#6BF178] text-[#121212] rounded-md hover:bg-[#5ae067] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium text-sm"
        >
          {isSettingBaseline ? (
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
              Setting...
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Set as Baseline
            </>
          )}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {/* Baseline info */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-md">
            <svg
              className="w-4 h-4 text-green-600 dark:text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium text-green-700 dark:text-green-300">
              Baseline: {currentBaseline.name}
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">
              ({new Date(currentBaseline.createdAt).toLocaleDateString()})
            </span>
          </div>

          {/* Update baseline button */}
          <button
            type="button"
            onClick={handleUpdateBaseline}
            disabled={isSettingBaseline}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Update Baseline
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <span className="text-xs text-red-500 ml-2">{error}</span>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowConfirmDialog(false)}
          />

          {/* Dialog */}
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-amber-600 dark:text-amber-400"
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Update Baseline?
                  </h3>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This will replace the existing baseline with the current schedule
                state. This action cannot be undone. Are you sure you want to
                continue?
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSetBaseline}
                disabled={isSettingBaseline}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSettingBaseline ? "Updating..." : "Update Baseline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * BaselineInfo Component
 * Displays baseline information in a compact format
 */
export function BaselineInfo({
  baseline,
  taskCount,
}: {
  baseline: Baseline;
  taskCount: number;
}) {
  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
      <div className="flex-shrink-0">
        <svg
          className="w-8 h-8 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          {baseline.name}
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Set on {new Date(baseline.createdAt).toLocaleDateString()} • {taskCount}{" "}
          tasks
        </p>
      </div>
    </div>
  );
}

/**
 * Helper function to show toast notifications
 */
function showToast(message: string, type: "success" | "error") {
  // This is a simple implementation - you can replace with your toast library
  const toast = document.createElement("div");
  toast.className = `fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
    type === "success"
      ? "bg-green-600 text-white"
      : "bg-red-600 text-white"
  } animate-fade-in`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}
