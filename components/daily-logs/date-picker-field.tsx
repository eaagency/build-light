"use client";

import React, { useState, useEffect } from "react";
import { format, isAfter, startOfDay } from "date-fns";

interface DatePickerFieldProps {
  value: Date | null;
  onChange: (date: Date) => void;
  onDateCheck?: (date: Date) => Promise<boolean>; // Check if log exists for this date
  error?: string;
  disabled?: boolean;
}

/**
 * DatePickerField Component
 * Mobile-friendly date picker for daily logs
 *
 * Features:
 * - Native date picker on mobile (better UX)
 * - Blocks future dates
 * - Checks for existing logs
 * - Shows day of week
 */
export function DatePickerField({
  value,
  onChange,
  onDateCheck,
  error,
  disabled = false,
}: DatePickerFieldProps) {
  const [checking, setChecking] = useState(false);
  const [existingLogWarning, setExistingLogWarning] = useState<string | null>(
    null
  );

  // Format date for display
  const displayDate = value ? format(value, "EEEE, MMMM d, yyyy") : "";

  // Format date for input (YYYY-MM-DD)
  const inputDate = value ? format(value, "yyyy-MM-dd") : "";

  // Max date is today
  const maxDate = format(new Date(), "yyyy-MM-dd");

  // Handle date change
  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value + "T12:00:00") : null;

    if (!newDate) return;

    // Check if date is in the future
    const today = startOfDay(new Date());
    if (isAfter(startOfDay(newDate), today)) {
      return; // Input should prevent this, but double-check
    }

    onChange(newDate);

    // Check if log exists for this date
    if (onDateCheck) {
      setChecking(true);
      setExistingLogWarning(null);

      try {
        const exists = await onDateCheck(newDate);
        if (exists) {
          setExistingLogWarning(
            `A daily log already exists for ${format(newDate, "MMM d, yyyy")}. You may want to edit the existing log instead.`
          );
        }
      } catch (error) {
        console.error("Error checking for existing log:", error);
      } finally {
        setChecking(false);
      }
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="date-picker"
        className="block text-sm font-medium text-gray-900 dark:text-white"
      >
        Date <span className="text-red-500">*</span>
      </label>

      {/* Display date (formatted) */}
      {value && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          {displayDate}
        </div>
      )}

      {/* Native date input */}
      <input
        id="date-picker"
        type="date"
        value={inputDate}
        onChange={handleDateChange}
        max={maxDate}
        disabled={disabled || checking}
        className="w-full px-4 py-3 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#6BF178] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontSize: "16px" }} // Prevent iOS zoom
      />

      {/* Checking indicator */}
      {checking && (
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
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
          Checking for existing log...
        </p>
      )}

      {/* Existing log warning */}
      {existingLogWarning && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span>{existingLogWarning}</span>
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Select the date for this daily log. Future dates are not allowed.
      </p>
    </div>
  );
}
