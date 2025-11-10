"use client";

import React, { useState, useRef } from "react";
import { Task } from "@prisma/client";

interface ScheduleExportMenuProps {
  projectId: string;
  scheduleId: string;
  scheduleName: string;
  tasks: Task[];
  className?: string;
}

type ExportFormat = "pdf" | "csv" | "excel" | "ical";

/**
 * ScheduleExportMenu Component
 * Dropdown menu for exporting schedule in various formats
 *
 * Export options:
 * - PDF: Gantt chart visualization
 * - CSV: Task list with all fields
 * - Excel: Detailed spreadsheet with formulas
 * - iCal: Calendar format for Google Calendar/Outlook
 */
export function ScheduleExportMenu({
  projectId,
  scheduleId,
  scheduleName,
  tasks,
  className = "",
}: ScheduleExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(
    null
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setExportingFormat(format);
    setIsOpen(false);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}/export`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ format }),
        }
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${scheduleName}-${format}.${getFileExtension(format)}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast(`Schedule exported as ${format.toUpperCase()}`, "success");
    } catch (error) {
      console.error("Export error:", error);
      showToast("Export failed. Please try again.", "error");
    } finally {
      setIsExporting(false);
      setExportingFormat(null);
    }
  };

  const getFileExtension = (format: ExportFormat): string => {
    const extensions = {
      pdf: "pdf",
      csv: "csv",
      excel: "xlsx",
      ical: "ics",
    };
    return extensions[format];
  };

  const exportOptions = [
    {
      format: "pdf" as ExportFormat,
      label: "Export as PDF",
      description: "Gantt chart visualization",
      icon: (
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
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      format: "csv" as ExportFormat,
      label: "Export as CSV",
      description: "Task list with all fields",
      icon: (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      format: "excel" as ExportFormat,
      label: "Export as Excel",
      description: "Detailed spreadsheet",
      icon: (
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
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      format: "ical" as ExportFormat,
      label: "Export to Calendar",
      description: "iCal format for Google Calendar",
      icon: (
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
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      {/* Export button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting || tasks.length === 0}
        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
      >
        {isExporting ? (
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
            Exporting {exportingFormat}...
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            <div className="p-2">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Export Schedule
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="mt-2 space-y-1">
                {exportOptions.map((option) => (
                  <button
                    key={option.format}
                    type="button"
                    onClick={() => handleExport(option.format)}
                    className="w-full flex items-start gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-left"
                  >
                    <div className="flex-shrink-0 mt-0.5 text-gray-500 dark:text-gray-400">
                      {option.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
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
