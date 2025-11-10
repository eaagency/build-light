"use client";

import React, { useState, useEffect } from "react";
import { US_HOLIDAYS } from "@/lib/task-utils";

interface WorkdaySettings {
  weekendDays: number[]; // 0=Sunday, 6=Saturday
  holidays: string[]; // YYYY-MM-DD format
  customNonWorkdays: string[]; // YYYY-MM-DD format
  hoursPerDay: number;
}

interface WorkdaySettingsProps {
  organizationId: string;
  currentSettings: WorkdaySettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: WorkdaySettings) => void;
  className?: string;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * WorkdaySettings Component
 * Modal for customizing workday configuration
 *
 * Configuration options:
 * - Weekend days (checkboxes for Mon-Sun)
 * - US Holidays (toggle each)
 * - Custom non-workdays (date picker)
 * - Work hours per day
 *
 * Saves to organization settings, affects all projects
 */
export function WorkdaySettings({
  organizationId,
  currentSettings,
  isOpen,
  onClose,
  onSave,
  className = "",
}: WorkdaySettingsProps) {
  const [settings, setSettings] = useState<WorkdaySettings>(currentSettings);
  const [customDate, setCustomDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset settings when modal opens
  useEffect(() => {
    if (isOpen) {
      setSettings(currentSettings);
      setCustomDate("");
      setError(null);
    }
  }, [isOpen, currentSettings]);

  const toggleWeekendDay = (day: number) => {
    setSettings((prev) => {
      const weekendDays = prev.weekendDays.includes(day)
        ? prev.weekendDays.filter((d) => d !== day)
        : [...prev.weekendDays, day];
      return { ...prev, weekendDays };
    });
  };

  const toggleHoliday = (holiday: string) => {
    setSettings((prev) => {
      const holidays = prev.holidays.includes(holiday)
        ? prev.holidays.filter((h) => h !== holiday)
        : [...prev.holidays, holiday];
      return { ...prev, holidays };
    });
  };

  const addCustomNonWorkday = () => {
    if (!customDate) return;

    // Validate date is not in the past
    const selectedDate = new Date(customDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setError("Cannot add dates in the past");
      return;
    }

    // Check if already added
    if (settings.customNonWorkdays.includes(customDate)) {
      setError("This date is already added");
      return;
    }

    setSettings((prev) => ({
      ...prev,
      customNonWorkdays: [...prev.customNonWorkdays, customDate].sort(),
    }));
    setCustomDate("");
    setError(null);
  };

  const removeCustomNonWorkday = (date: string) => {
    setSettings((prev) => ({
      ...prev,
      customNonWorkdays: prev.customNonWorkdays.filter((d) => d !== date),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/organizations/${organizationId}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workdaySettings: settings }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save settings");
      }

      onSave(settings);
      onClose();

      // Show success toast
      showToast("Workday settings saved successfully", "success");
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

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
                Workday Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Configure workdays and holidays for your organization
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Weekend days */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Weekend Days (Non-working days)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DAY_NAMES.map((day, index) => (
                <label
                  key={index}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition-colors ${
                    settings.weekendDays.includes(index)
                      ? "bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={settings.weekendDays.includes(index)}
                    onChange={() => toggleWeekendDay(index)}
                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {day}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Work hours per day */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Work Hours per Day
            </label>
            <input
              type="number"
              min="1"
              max="24"
              value={settings.hoursPerDay}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  hoursPerDay: parseInt(e.target.value) || 8,
                })
              }
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6BF178] focus:border-[#6BF178] dark:bg-gray-800 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Used for capacity planning and resource allocation
            </p>
          </div>

          {/* US Holidays */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              US Federal Holidays
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {US_HOLIDAYS.map((holiday) => {
                const date = `2025-${holiday}`;
                const dateObj = new Date(date);
                const formattedDate = dateObj.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <label
                    key={holiday}
                    className={`flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer transition-colors ${
                      settings.holidays.includes(date)
                        ? "bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700"
                        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={settings.holidays.includes(date)}
                      onChange={() => toggleHoliday(date)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {formattedDate}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Custom non-workdays */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Custom Non-Working Days
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6BF178] focus:border-[#6BF178] dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={addCustomNonWorkday}
                disabled={!customDate}
                className="px-4 py-2 bg-[#6BF178] text-[#121212] rounded-md hover:bg-[#5ae067] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>

            {settings.customNonWorkdays.length > 0 && (
              <div className="space-y-2">
                {settings.customNonWorkdays.map((date) => (
                  <div
                    key={date}
                    className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeCustomNonWorkday(date)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg
                        className="w-5 h-5"
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
                ))}
              </div>
            )}
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
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-[#121212] bg-[#6BF178] rounded-md hover:bg-[#5ae067] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving..." : "Save Settings"}
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
