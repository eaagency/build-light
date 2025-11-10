"use client";

import React, { useMemo } from "react";
import { Task } from "@prisma/client";
import { calculateWorkdays } from "@/lib/task-utils";
import { format, differenceInDays } from "date-fns";

interface BaselineTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  phase: string | null;
}

interface Baseline {
  id: string;
  name: string;
  createdAt: Date;
  tasks: BaselineTask[];
}

interface TaskVariance {
  taskId: string;
  taskName: string;
  baselineStart: Date;
  baselineEnd: Date;
  currentStart: Date;
  currentEnd: Date;
  startVarianceDays: number;
  endVarianceDays: number;
  durationVarianceDays: number;
  status: "ahead" | "behind" | "on-track";
}

interface VarianceViewProps {
  baseline: Baseline | null;
  currentTasks: Task[];
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  className?: string;
}

/**
 * VarianceView Component
 * Shows baseline variance comparison between planned (baseline) and actual (current) schedule
 *
 * Features:
 * - Ghost tasks (baseline) shown as light grey dashed border
 * - Current tasks shown as solid with normal colors
 * - GREEN indicator for tasks ahead of schedule
 * - RED indicator for tasks behind schedule
 * - Variance in days displayed
 */
export function VarianceView({
  baseline,
  currentTasks,
  isEnabled,
  onToggle,
  className = "",
}: VarianceViewProps) {
  // Calculate variance for all tasks
  const variances = useMemo(() => {
    if (!baseline || !isEnabled) return [];

    const results: TaskVariance[] = [];

    for (const currentTask of currentTasks) {
      const baselineTask = baseline.tasks.find((bt) => bt.id === currentTask.id);

      if (!baselineTask) continue;

      const baselineStart = new Date(baselineTask.startDate);
      const baselineEnd = new Date(baselineTask.endDate);
      const currentStart = new Date(currentTask.startDate);
      const currentEnd = new Date(currentTask.endDate);

      const startVarianceDays = differenceInDays(currentStart, baselineStart);
      const endVarianceDays = differenceInDays(currentEnd, baselineEnd);

      const baselineDuration = calculateWorkdays(baselineStart, baselineEnd);
      const currentDuration = calculateWorkdays(currentStart, currentEnd);
      const durationVarianceDays = currentDuration - baselineDuration;

      // Determine status
      let status: "ahead" | "behind" | "on-track";
      if (endVarianceDays < 0) {
        status = "ahead"; // Finishing earlier
      } else if (endVarianceDays > 0) {
        status = "behind"; // Finishing later
      } else {
        status = "on-track";
      }

      results.push({
        taskId: currentTask.id,
        taskName: currentTask.name,
        baselineStart,
        baselineEnd,
        currentStart,
        currentEnd,
        startVarianceDays,
        endVarianceDays,
        durationVarianceDays,
        status,
      });
    }

    return results;
  }, [baseline, currentTasks, isEnabled]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalTasks = variances.length;
    const aheadCount = variances.filter((v) => v.status === "ahead").length;
    const behindCount = variances.filter((v) => v.status === "behind").length;
    const onTrackCount = variances.filter((v) => v.status === "on-track").length;

    const avgVariance =
      totalTasks > 0
        ? variances.reduce((sum, v) => sum + v.endVarianceDays, 0) / totalTasks
        : 0;

    return {
      totalTasks,
      aheadCount,
      behindCount,
      onTrackCount,
      avgVariance: Math.round(avgVariance * 10) / 10,
    };
  }, [variances]);

  if (!baseline) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Set a baseline to view variance
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => onToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Show Baseline Variance
          </span>
        </label>

        {isEnabled && (
          <div className="flex items-center gap-4">
            {/* Summary stats */}
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900 rounded-md">
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                {summary.aheadCount} ahead
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-md">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {summary.onTrackCount} on track
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 dark:bg-red-900 rounded-md">
              <span className="text-xs font-medium text-red-700 dark:text-red-300">
                {summary.behindCount} behind
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Variance table */}
      {isEnabled && variances.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Task
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Baseline Dates
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Current Dates
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Variance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {variances.map((variance) => (
                  <tr
                    key={variance.taskId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {variance.taskName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div>{format(variance.baselineStart, "MMM dd, yyyy")}</div>
                        <div className="text-xs">
                          to {format(variance.baselineEnd, "MMM dd, yyyy")}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <div>{format(variance.currentStart, "MMM dd, yyyy")}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          to {format(variance.currentEnd, "MMM dd, yyyy")}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div
                          className={`font-medium ${
                            variance.endVarianceDays < 0
                              ? "text-green-600 dark:text-green-400"
                              : variance.endVarianceDays > 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {variance.endVarianceDays === 0
                            ? "On schedule"
                            : variance.endVarianceDays > 0
                            ? `${variance.endVarianceDays} days late`
                            : `${Math.abs(variance.endVarianceDays)} days early`}
                        </div>
                        {variance.durationVarianceDays !== 0 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Duration: {variance.durationVarianceDays > 0 ? "+" : ""}
                            {variance.durationVarianceDays} days
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <VarianceStatusBadge status={variance.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Overall summary */}
      {isEnabled && variances.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Overall Schedule Performance
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Based on {summary.totalTasks} tracked tasks
              </p>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${
                  summary.avgVariance < 0
                    ? "text-green-600 dark:text-green-400"
                    : summary.avgVariance > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {summary.avgVariance > 0 ? "+" : ""}
                {summary.avgVariance} days
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Average variance
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * VarianceStatusBadge Component
 * Badge showing task status relative to baseline
 */
export function VarianceStatusBadge({
  status,
}: {
  status: "ahead" | "behind" | "on-track";
}) {
  const config = {
    ahead: {
      color: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z"
            clipRule="evenodd"
          />
        </svg>
      ),
      label: "Ahead",
    },
    behind: {
      color: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
            clipRule="evenodd"
          />
        </svg>
      ),
      label: "Behind",
    },
    "on-track": {
      color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
      icon: (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ),
      label: "On Track",
    },
  };

  const { color, icon, label } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color}`}
    >
      {icon}
      {label}
    </span>
  );
}

/**
 * VarianceIndicator Component
 * Simple visual indicator for task variance
 */
export function VarianceIndicator({ varianceDays }: { varianceDays: number }) {
  if (varianceDays === 0) return null;

  const isAhead = varianceDays < 0;
  const absVariance = Math.abs(varianceDays);

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
        isAhead
          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
          : "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
      }`}
    >
      {isAhead ? "↑" : "↓"} {absVariance}d
    </div>
  );
}
