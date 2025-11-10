"use client";

import React, { useState } from "react";
import { Task, TaskPhase } from "@prisma/client";
import { TaskSort, TaskSortField, TaskSortDirection } from "@/lib/task-types";

interface TaskListControlsProps {
  tasks: Task[];
  selectedTaskIds: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkColorChange: (color: string) => void;
  onBulkPhaseChange: (phase: TaskPhase) => void;
  onBulkTagAdd: (tag: string) => void;
  sort: TaskSort;
  onSortChange: (sort: TaskSort) => void;
  className?: string;
}

/**
 * TaskListControls Component
 * Handles bulk selection, bulk actions, and sorting
 * Shows bulk action toolbar when tasks are selected
 */
export function TaskListControls({
  tasks,
  selectedTaskIds,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkColorChange,
  onBulkPhaseChange,
  onBulkTagAdd,
  sort,
  onSortChange,
  className = "",
}: TaskListControlsProps) {
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [bulkColor, setBulkColor] = useState("#6BF178");

  const selectedCount = selectedTaskIds.length;
  const allSelected = tasks.length > 0 && selectedCount === tasks.length;

  const handleBulkColorChange = () => {
    onBulkColorChange(bulkColor);
    setShowBulkMenu(false);
  };

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedCount} tasks?`)) {
      onBulkDelete();
      setShowBulkMenu(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <div
      className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-[#121212] text-white rounded-lg shadow-2xl px-4 py-3 flex items-center gap-4 z-30 ${className}`}
    >
      {/* Selection count */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          {selectedCount} task{selectedCount !== 1 ? "s" : ""} selected
        </span>
        <button
          type="button"
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="text-xs text-[#6BF178] hover:underline"
        >
          {allSelected ? "Deselect all" : "Select all"}
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-600" />

      {/* Bulk actions */}
      <div className="flex items-center gap-2">
        {/* Change color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowBulkMenu(!showBulkMenu)}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-sm flex items-center gap-2 transition-colors"
          >
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
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
              />
            </svg>
            Change Color
          </button>

          {/* Color picker dropdown */}
          {showBulkMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={bulkColor}
                  onChange={(e) => setBulkColor(e.target.value)}
                  className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {bulkColor}
                </span>
              </div>
              <button
                type="button"
                onClick={handleBulkColorChange}
                className="w-full px-3 py-1.5 bg-[#6BF178] text-[#121212] rounded-md hover:bg-[#5ae067] text-sm font-medium transition-colors"
              >
                Apply Color
              </button>
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={handleBulkDelete}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-md text-sm flex items-center gap-2 transition-colors"
        >
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          Delete
        </button>

        {/* Cancel */}
        <button
          type="button"
          onClick={onDeselectAll}
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-md text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * TaskSortHeader Component
 * Clickable column header with sort indicator
 */
export function TaskSortHeader({
  field,
  label,
  currentSort,
  onSort,
  className = "",
}: {
  field: TaskSortField;
  label: string;
  currentSort: TaskSort;
  onSort: (sort: TaskSort) => void;
  className?: string;
}) {
  const isActive = currentSort.field === field;
  const direction = isActive ? currentSort.direction : "asc";

  const handleClick = () => {
    if (isActive) {
      // Toggle direction
      onSort({
        field,
        direction: direction === "asc" ? "desc" : "asc",
      });
    } else {
      // Set new field with default ascending
      onSort({ field, direction: "asc" });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-1 text-left font-medium text-gray-700 dark:text-gray-300 hover:text-[#6BF178] transition-colors ${className} ${
        isActive ? "text-[#6BF178]" : ""
      }`}
    >
      <span>{label}</span>
      {isActive && (
        <svg
          className={`w-4 h-4 transition-transform ${
            direction === "desc" ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      )}
      {!isActive && (
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
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )}
    </button>
  );
}

/**
 * TaskBulkSelectCheckbox Component
 * Checkbox for individual task selection
 */
export function TaskBulkSelectCheckbox({
  taskId,
  isSelected,
  onToggle,
  className = "",
}: {
  taskId: string;
  isSelected: boolean;
  onToggle: (taskId: string) => void;
  className?: string;
}) {
  return (
    <label className={`flex items-center cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onToggle(taskId)}
        onClick={(e) => e.stopPropagation()} // Prevent row click
        className="w-4 h-4 text-[#6BF178] border-gray-300 rounded focus:ring-[#6BF178] focus:ring-offset-0 cursor-pointer"
      />
    </label>
  );
}

/**
 * TaskBulkSelectAllCheckbox Component
 * Checkbox for selecting all tasks in the current view
 */
export function TaskBulkSelectAllCheckbox({
  totalTasks,
  selectedCount,
  onSelectAll,
  onDeselectAll,
  className = "",
}: {
  totalTasks: number;
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  className?: string;
}) {
  const allSelected = totalTasks > 0 && selectedCount === totalTasks;
  const someSelected = selectedCount > 0 && selectedCount < totalTasks;

  const handleChange = () => {
    if (allSelected || someSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  return (
    <label className={`flex items-center cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={allSelected}
        ref={(el) => {
          if (el) {
            el.indeterminate = someSelected;
          }
        }}
        onChange={handleChange}
        className="w-4 h-4 text-[#6BF178] border-gray-300 rounded focus:ring-[#6BF178] focus:ring-offset-0 cursor-pointer"
      />
    </label>
  );
}

/**
 * Utility function to sort tasks
 */
export function sortTasks(tasks: Task[], sort: TaskSort): Task[] {
  const { field, direction } = sort;
  const multiplier = direction === "asc" ? 1 : -1;

  return [...tasks].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (field) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "startDate":
        aValue = new Date(a.startDate).getTime();
        bValue = new Date(b.startDate).getTime();
        break;
      case "endDate":
        aValue = new Date(a.endDate).getTime();
        bValue = new Date(b.endDate).getTime();
        break;
      case "phase":
        aValue = a.phase || "";
        bValue = b.phase || "";
        break;
      case "progress":
        aValue = a.completed ? 100 : 0;
        bValue = b.completed ? 100 : 0;
        break;
      case "duration":
        const aDuration =
          (new Date(a.endDate).getTime() - new Date(a.startDate).getTime()) /
          (1000 * 60 * 60 * 24);
        const bDuration =
          (new Date(b.endDate).getTime() - new Date(b.startDate).getTime()) /
          (1000 * 60 * 60 * 24);
        aValue = aDuration;
        bValue = bDuration;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return -1 * multiplier;
    if (aValue > bValue) return 1 * multiplier;
    return 0;
  });
}
