"use client";

import React, { useState, useEffect } from "react";
import { Task } from "@prisma/client";
import {
  calculateCriticalPath,
  getCriticalPathChain,
  formatSlackTime,
  CriticalPathResult,
} from "@/lib/critical-path";

interface CriticalPathToggleProps {
  tasks: Task[];
  isEnabled: boolean;
  onToggle: (enabled: boolean, criticalTaskIds: string[]) => void;
  className?: string;
}

/**
 * CriticalPathToggle Component
 * Toggle switch to enable/disable critical path visualization
 *
 * When enabled:
 * - Critical tasks highlighted in BLUE (#2563EB)
 * - Non-critical tasks fade to LIGHT GREY (#E5E5E5)
 * - Critical path tasks have thicker border (3px)
 *
 * When disabled:
 * - Tasks use their assigned colors (phase colors)
 */
export function CriticalPathToggle({
  tasks,
  isEnabled,
  onToggle,
  className = "",
}: CriticalPathToggleProps) {
  const [criticalPathData, setCriticalPathData] =
    useState<CriticalPathResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Calculate critical path whenever tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      const result = calculateCriticalPath(tasks);
      setCriticalPathData(result);
    }
  }, [tasks]);

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    const criticalTaskIds = criticalPathData?.criticalTasks || [];
    onToggle(newEnabled, criticalTaskIds);
  };

  if (!criticalPathData || tasks.length === 0) {
    return null;
  }

  const criticalCount = criticalPathData.criticalTasks.length;
  const totalCount = tasks.length;
  const criticalPercentage = Math.round((criticalCount / totalCount) * 100);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Toggle switch */}
      <label className="flex items-center gap-2 cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggle}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600" />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Show Critical Path
        </span>
      </label>

      {/* Critical path info */}
      {isEnabled && (
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md">
          <svg
            className="w-4 h-4 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
            {criticalCount} critical task{criticalCount !== 1 ? "s" : ""} (
            {criticalPercentage}%)
          </span>
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showDetails ? "Hide" : "Details"}
          </button>
        </div>
      )}

      {/* Project duration badge */}
      <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-md">
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Project: {criticalPathData.projectDuration} workdays
        </span>
      </div>

      {/* Details panel */}
      {isEnabled && showDetails && (
        <CriticalPathDetails
          criticalPathData={criticalPathData}
          tasks={tasks}
          onClose={() => setShowDetails(false)}
        />
      )}
    </div>
  );
}

/**
 * CriticalPathDetails Component
 * Floating panel showing detailed critical path information
 */
function CriticalPathDetails({
  criticalPathData,
  tasks,
  onClose,
}: {
  criticalPathData: CriticalPathResult;
  tasks: Task[];
  onClose: () => void;
}) {
  const criticalChain = getCriticalPathChain(tasks);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Critical Path Analysis
            </h3>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                Critical Tasks
              </p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {criticalPathData.criticalTasks.length}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Total Tasks
              </p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {tasks.length}
              </p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400 mb-1">
                Project Duration
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {criticalPathData.projectDuration} days
              </p>
            </div>
          </div>

          {/* Critical path chain */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Critical Path Chain
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              {criticalChain.map((taskName, index) => (
                <React.Fragment key={index}>
                  <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium">
                    {taskName}
                  </div>
                  {index < criticalChain.length - 1 && (
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Task details */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Task Details
            </h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {Array.from(criticalPathData.nodes.values())
                .sort((a, b) => a.earliestStart - b.earliestStart)
                .map((node) => (
                  <div
                    key={node.id}
                    className={`p-3 rounded-md border ${
                      node.isCritical
                        ? "bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-medium ${
                          node.isCritical
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {node.name}
                      </span>
                      {node.isCritical ? (
                        <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
                          CRITICAL
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded">
                          {formatSlackTime(node.slack)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                      <span>Duration: {node.duration} days</span>
                      <span>ES: Day {node.earliestStart}</span>
                      <span>EF: Day {node.earliestFinish}</span>
                      {!node.isCritical && (
                        <span className="text-green-600 dark:text-green-400">
                          LS: Day {node.latestStart}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CriticalPathBadge Component
 * Small badge indicating if a task is critical
 */
export function CriticalPathBadge({
  isCritical,
  slackDays,
}: {
  isCritical: boolean;
  slackDays?: number;
}) {
  if (isCritical) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
            clipRule="evenodd"
          />
        </svg>
        Critical
      </span>
    );
  }

  if (slackDays !== undefined && slackDays > 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
        {formatSlackTime(slackDays)}
      </span>
    );
  }

  return null;
}
