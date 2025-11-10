"use client";

import React from "react";
import { getTaskStatus, getStatusColor } from "@/lib/task-types";

interface TaskProgressIndicatorProps {
  progress: number; // 0-100
  showPercentage?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * TaskProgressIndicator Component
 * Visual progress bar with color coding:
 * - 0% = Grey (Not Started)
 * - 1-99% = BuildLight Green (In Progress)
 * - 100% = Dark Green (Complete)
 */
export function TaskProgressIndicator({
  progress = 0,
  showPercentage = true,
  showLabel = false,
  size = "md",
  className = "",
}: TaskProgressIndicatorProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const status = getTaskStatus(clampedProgress);
  const statusColor = getStatusColor(status);

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const statusLabels = {
    NOT_STARTED: "Not Started",
    IN_PROGRESS: "In Progress",
    COMPLETE: "Complete",
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar */}
      <div
        className={`${sizeClasses[size]} bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden`}
      >
        <div
          className="h-full transition-all duration-300 ease-out rounded-full"
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: statusColor,
          }}
        />
      </div>

      {/* Progress text and label */}
      {(showPercentage || showLabel) && (
        <div className="flex items-center justify-between mt-1">
          {showPercentage && (
            <span
              className={`${textSizeClasses[size]} font-medium`}
              style={{ color: statusColor }}
            >
              {clampedProgress}%
            </span>
          )}
          {showLabel && (
            <span
              className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400`}
            >
              {statusLabels[status]}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * TaskProgressBadge Component
 * Compact badge showing progress percentage with color
 */
export function TaskProgressBadge({
  progress,
  className = "",
}: {
  progress: number;
  className?: string;
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const status = getTaskStatus(clampedProgress);
  const statusColor = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: `${statusColor}20`,
        color: statusColor,
      }}
    >
      {clampedProgress}%
    </span>
  );
}

/**
 * TaskProgressSlider Component
 * Interactive slider for quick progress updates
 */
export function TaskProgressSlider({
  progress,
  onChange,
  disabled = false,
  className = "",
}: {
  progress: number;
  onChange: (progress: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const status = getTaskStatus(clampedProgress);
  const statusColor = getStatusColor(status);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value, 10);
    onChange(newProgress);
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Progress
        </span>
        <span
          className="text-sm font-semibold"
          style={{ color: statusColor }}
        >
          {clampedProgress}%
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={clampedProgress}
        onChange={handleChange}
        disabled={disabled}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6BF178] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(to right, ${statusColor} 0%, ${statusColor} ${clampedProgress}%, #E5E5E5 ${clampedProgress}%, #E5E5E5 100%)`,
        }}
      />

      {/* Status label */}
      <div className="mt-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {status === "NOT_STARTED" && "Not Started"}
          {status === "IN_PROGRESS" && "In Progress"}
          {status === "COMPLETE" && "Complete"}
        </span>
      </div>
    </div>
  );
}

/**
 * TaskProgressCircle Component
 * Circular progress indicator (for compact views)
 */
export function TaskProgressCircle({
  progress,
  size = 40,
  strokeWidth = 4,
  showPercentage = true,
  className = "",
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  className?: string;
}) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const status = getTaskStatus(clampedProgress);
  const statusColor = getStatusColor(status);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={`relative inline-flex ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={statusColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>

      {/* Percentage text */}
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-xs font-medium"
            style={{ color: statusColor }}
          >
            {clampedProgress}%
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * TaskStatusDot Component
 * Simple colored dot indicating task status
 */
export function TaskStatusDot({
  progress,
  size = "md",
  className = "",
}: {
  progress: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const status = getTaskStatus(progress);
  const statusColor = getStatusColor(status);

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${className}`}
      style={{ backgroundColor: statusColor }}
      title={`${progress}% - ${status}`}
    />
  );
}
