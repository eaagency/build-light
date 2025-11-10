"use client";

import React, { useState, useEffect } from "react";
import { format, parse, isValid, isWeekend, addDays } from "date-fns";
import { calculateWorkdays, addWorkdays } from "@/lib/task-utils";
import { validateTaskDates } from "@/lib/task-types";

interface DateRangePickerProps {
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  disabled?: boolean;
  className?: string;
}

type DateMode = "endDate" | "duration";

/**
 * DateRangePicker Component
 * Supports two modes:
 * 1. End Date mode - Pick start and end dates directly
 * 2. Duration mode - Pick start date and specify workdays, calculates end date
 */
export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled = false,
  className = "",
}: DateRangePickerProps) {
  const [mode, setMode] = useState<DateMode>("endDate");
  const [duration, setDuration] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Calculate duration when dates change in endDate mode
  useEffect(() => {
    if (mode === "endDate" && startDate && endDate) {
      const workdays = calculateWorkdays(startDate, endDate);
      setDuration(workdays);
    }
  }, [startDate, endDate, mode]);

  // Calculate end date when duration changes in duration mode
  useEffect(() => {
    if (mode === "duration" && startDate && duration > 0) {
      const calculatedEndDate = addWorkdays(startDate, duration);
      onEndDateChange(calculatedEndDate);
    }
  }, [mode, startDate, duration]);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      onStartDateChange(null);
      setError(null);
      return;
    }

    const date = parse(value, "yyyy-MM-dd", new Date());
    if (!isValid(date)) {
      setError("Invalid start date");
      return;
    }

    onStartDateChange(date);

    // Validate dates
    const validation = validateTaskDates(date, endDate);
    if (!validation.valid) {
      setError(validation.error || "Invalid dates");
    } else {
      setError(null);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      onEndDateChange(null);
      setError(null);
      return;
    }

    const date = parse(value, "yyyy-MM-dd", new Date());
    if (!isValid(date)) {
      setError("Invalid end date");
      return;
    }

    onEndDateChange(date);

    // Validate dates
    const validation = validateTaskDates(startDate, date);
    if (!validation.valid) {
      setError(validation.error || "Invalid dates");
    } else {
      setError(null);
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value) || value < 1) {
      setDuration(1);
      return;
    }
    if (value > 365) {
      setError("Duration cannot exceed 365 workdays");
      return;
    }
    setDuration(value);
    setError(null);
  };

  const toggleMode = () => {
    setMode(mode === "endDate" ? "duration" : "endDate");
    setError(null);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return format(date, "yyyy-MM-dd");
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return "Not set";
    return format(date, "MMM dd, yyyy");
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Dates <span className="text-red-500">*</span>
        </label>

        {/* Mode toggle */}
        <button
          type="button"
          onClick={toggleMode}
          disabled={disabled}
          className="text-xs text-[#6BF178] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mode === "endDate" ? "Use duration instead" : "Use end date instead"}
        </button>
      </div>

      <div className="space-y-3">
        {/* Start Date */}
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={formatDate(startDate)}
            onChange={handleStartDateChange}
            disabled={disabled}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6BF178] focus:border-[#6BF178] disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
          />
          {startDate && isWeekend(startDate) && (
            <p className="mt-1 text-xs text-amber-600">
              ⚠️ Weekend day selected
            </p>
          )}
        </div>

        {/* End Date OR Duration */}
        {mode === "endDate" ? (
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={formatDate(endDate)}
              onChange={handleEndDateChange}
              disabled={disabled}
              required
              min={formatDate(startDate)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6BF178] focus:border-[#6BF178] disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
            />
            {endDate && isWeekend(endDate) && (
              <p className="mt-1 text-xs text-amber-600">
                ⚠️ Weekend day selected
              </p>
            )}
            {startDate && endDate && (
              <p className="mt-1 text-xs text-gray-500">
                Duration: {duration} workday{duration !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              Duration (workdays)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="365"
                value={duration}
                onChange={handleDurationChange}
                disabled={disabled || !startDate}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6BF178] focus:border-[#6BF178] disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
              />
              <span className="flex items-center text-sm text-gray-500">
                workdays
              </span>
            </div>
            {startDate && duration > 0 && endDate && (
              <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Calculated end date:
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDisplayDate(endDate)}
                </p>
                {isWeekend(endDate) && (
                  <p className="mt-1 text-xs text-amber-600">
                    ⚠️ Ends on a weekend
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      {/* Date range summary */}
      {startDate && endDate && !error && (
        <div className="mt-3 p-3 bg-[#6BF178] bg-opacity-10 rounded-md border border-[#6BF178] border-opacity-20">
          <div className="flex items-center gap-2 text-sm">
            <svg
              className="w-4 h-4 text-[#6BF178]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">
              {formatDisplayDate(startDate)} → {formatDisplayDate(endDate)}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 ml-6">
            {duration} workday{duration !== 1 ? "s" : ""} (excludes weekends & holidays)
          </p>
        </div>
      )}

      {/* Help text */}
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Workday calculations exclude weekends and US federal holidays
      </p>
    </div>
  );
}

/**
 * DateDisplay Component
 * Simple display of date range (for read-only views)
 */
export function DateDisplay({
  startDate,
  endDate,
  showDuration = true,
}: {
  startDate: Date;
  endDate: Date;
  showDuration?: boolean;
}) {
  const duration = calculateWorkdays(startDate, endDate);

  return (
    <div className="text-sm">
      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
        <span>{format(startDate, "MMM dd, yyyy")}</span>
        <span>→</span>
        <span>{format(endDate, "MMM dd, yyyy")}</span>
      </div>
      {showDuration && (
        <p className="text-xs text-gray-500 mt-1">
          {duration} workday{duration !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
