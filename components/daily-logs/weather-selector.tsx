"use client";

import React from "react";
import { Weather } from "@prisma/client";
import { WEATHER_OPTIONS } from "@/lib/daily-logs/weather";

interface WeatherSelectorProps {
  value: Weather | null;
  onChange: (weather: Weather) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * WeatherSelector Component
 * Large button grid for selecting weather conditions
 *
 * Features:
 * - 6 weather options with emoji icons
 * - Large touch targets (min 80px × 80px)
 * - Visual feedback on selection
 * - Haptic feedback on mobile (if supported)
 * - Responsive grid (2 cols mobile, 6 cols desktop)
 */
export function WeatherSelector({
  value,
  onChange,
  error,
  disabled = false,
}: WeatherSelectorProps) {
  // Handle selection with haptic feedback
  const handleSelect = (weather: Weather) => {
    // Trigger haptic feedback on mobile (if supported)
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(10); // Short vibration
    }

    onChange(weather);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900 dark:text-white">
        Weather <span className="text-red-500">*</span>
      </label>

      {/* Weather button grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {WEATHER_OPTIONS.map((option) => {
          const isSelected = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              disabled={disabled}
              className={`
                relative min-h-[80px] px-4 py-3 rounded-lg border-2 transition-all duration-200
                flex flex-col items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:scale-105 active:scale-95
                ${
                  isSelected
                    ? "bg-[#6BF178] border-[#6BF178] text-gray-900 shadow-lg"
                    : "bg-transparent border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#6BF178]"
                }
              `}
              aria-label={option.label}
              aria-pressed={isSelected}
            >
              {/* Icon */}
              <span className="text-3xl" role="img" aria-label={option.value}>
                {option.icon}
              </span>

              {/* Label */}
              <span className="text-sm font-medium text-center">
                {option.value}
              </span>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <svg
                    className="w-5 h-5 text-gray-900"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Select the weather conditions for this workday
      </p>
    </div>
  );
}
