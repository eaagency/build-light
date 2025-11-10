"use client";

import React, { useEffect, useState } from "react";

interface ExportProgressModalProps {
  isOpen: boolean;
  format: string;
  taskCount: number;
  onCancel: () => void;
}

/**
 * ExportProgressModal Component
 * Shows progress during schedule export generation
 *
 * Features:
 * - Progress bar with percentage
 * - Estimated time remaining
 * - Cancel button to abort export
 * - Different messages based on export format
 */
export function ExportProgressModal({
  isOpen,
  format,
  taskCount,
  onCancel,
}: ExportProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    // Simulate progress based on task count
    const estimatedTime = calculateEstimatedTime(taskCount, format);
    const steps = 100;
    const interval = estimatedTime / steps;

    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += 1;
      if (currentProgress <= 100) {
        setProgress(currentProgress);
        setStatusText(getStatusText(format, currentProgress));
      } else {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, taskCount, format]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
        {/* Modal */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Exporting Schedule
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {taskCount} task{taskCount !== 1 ? "s" : ""} • {format.toUpperCase()} format
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {statusText}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Status Icons */}
          <div className="flex items-center gap-2 mb-6">
            {progress < 33 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
                <span>Preparing data...</span>
              </div>
            )}
            {progress >= 33 && progress < 66 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
                <span>Generating {format.toUpperCase()}...</span>
              </div>
            )}
            {progress >= 66 && progress < 100 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
                <span>Finalizing...</span>
              </div>
            )}
            {progress === 100 && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>Complete!</span>
              </div>
            )}
          </div>

          {/* Estimated Time */}
          {progress < 100 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Estimated time: {getEstimatedTimeText(taskCount, format, progress)}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={progress === 100}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {progress === 100 ? "Close" : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Calculate estimated time based on task count and format
 */
function calculateEstimatedTime(taskCount: number, format: string): number {
  // Base time in milliseconds
  const baseTime = 1000; // 1 second minimum

  // Time per task varies by format
  const timePerTask = {
    pdf: 50, // PDF is slow due to rendering
    csv: 5,
    excel: 10,
    ical: 5,
  }[format] || 10;

  return baseTime + taskCount * timePerTask;
}

/**
 * Get status text based on progress
 */
function getStatusText(format: string, progress: number): string {
  if (progress < 33) {
    return "Preparing data...";
  } else if (progress < 66) {
    return `Generating ${format.toUpperCase()}...`;
  } else if (progress < 100) {
    return "Finalizing...";
  } else {
    return "Complete!";
  }
}

/**
 * Get estimated time remaining text
 */
function getEstimatedTimeText(
  taskCount: number,
  format: string,
  progress: number
): string {
  const totalTime = calculateEstimatedTime(taskCount, format);
  const remainingTime = totalTime * ((100 - progress) / 100);

  if (remainingTime < 1000) {
    return "Less than 1 second";
  } else if (remainingTime < 60000) {
    const seconds = Math.ceil(remainingTime / 1000);
    return `About ${seconds} second${seconds !== 1 ? "s" : ""}`;
  } else {
    const minutes = Math.ceil(remainingTime / 60000);
    return `About ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
}
