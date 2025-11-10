"use client";

import React from "react";
import { TaskPhase } from "@prisma/client";
import {
  TASK_PHASE_LABELS,
  TASK_PHASE_COLORS,
  TASK_PHASE_ORDER,
  getPhaseColor,
} from "@/lib/task-types";

interface PhaseSelectorProps {
  value: TaskPhase | null;
  onChange: (phase: TaskPhase | null, color?: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * PhaseSelector Component
 * Dropdown for selecting construction phase with color indicators
 * Auto-fills task color with phase color when selected
 */
export function PhaseSelector({
  value,
  onChange,
  required = false,
  disabled = false,
  className = "",
}: PhaseSelectorProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPhase = e.target.value as TaskPhase | "";
    if (selectedPhase === "") {
      onChange(null);
    } else {
      const phaseColor = getPhaseColor(selectedPhase);
      onChange(selectedPhase, phaseColor);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Phase {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <select
          value={value || ""}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6BF178] focus:border-[#6BF178] disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white appearance-none pr-10"
        >
          <option value="">Select a phase...</option>
          {TASK_PHASE_ORDER.map((phase) => (
            <option key={phase} value={phase}>
              {TASK_PHASE_LABELS[phase]}
            </option>
          ))}
        </select>

        {/* Color indicator */}
        {value && (
          <div
            className="absolute right-10 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: getPhaseColor(value) }}
            title={`${TASK_PHASE_LABELS[value]} color`}
          />
        )}

        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Phase color preview */}
      {value && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Task will use phase color:</span>
          <div
            className="w-6 h-6 rounded border border-gray-300"
            style={{ backgroundColor: getPhaseColor(value) }}
          />
          <span className="font-mono">{getPhaseColor(value)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * PhaseIndicator Component
 * Simple colored dot with phase name for display purposes
 */
export function PhaseIndicator({
  phase,
  showLabel = true,
  size = "md",
}: {
  phase: TaskPhase | null;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  if (!phase) return null;

  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full border border-white shadow-sm`}
        style={{ backgroundColor: getPhaseColor(phase) }}
      />
      {showLabel && (
        <span className="text-sm font-medium">{TASK_PHASE_LABELS[phase]}</span>
      )}
    </div>
  );
}
