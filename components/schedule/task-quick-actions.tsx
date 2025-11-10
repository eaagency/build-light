"use client";

import React, { useState, useRef, useEffect } from "react";
import { Task } from "@prisma/client";
import { EditTaskModal } from "./edit-task-modal";

interface TaskQuickActionsProps {
  projectId: string;
  scheduleId: string;
  task: Task;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
  onTaskDuplicated?: (task: Task) => void;
  className?: string;
}

/**
 * TaskQuickActions Component
 * Three-dot menu with Edit, Duplicate, and Delete actions
 * Opens dropdown menu on click
 */
export function TaskQuickActions({
  projectId,
  scheduleId,
  task,
  onTaskUpdated,
  onTaskDeleted,
  onTaskDuplicated,
  className = "",
}: TaskQuickActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleEdit = () => {
    setIsMenuOpen(false);
    setIsEditModalOpen(true);
  };

  const handleDuplicate = async () => {
    setIsMenuOpen(false);
    setIsDuplicating(true);

    try {
      // Create a duplicate task with " (Copy)" appended to name
      const duplicateData = {
        name: `${task.name} (Copy)`,
        startDate: new Date(task.startDate).toISOString(),
        endDate: new Date(task.endDate).toISOString(),
        phase: task.phase,
        tags: task.tags || [],
        assignees: task.assignees || [],
        dependencies: [], // Don't copy dependencies
        color: task.color,
        notes: task.notes,
        completed: false,
      };

      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(duplicateData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to duplicate task");
      }

      const data = await response.json();

      if (onTaskDuplicated) {
        onTaskDuplicated(data.task);
      }
    } catch (error) {
      console.error("Error duplicating task:", error);
      alert("Failed to duplicate task. Please try again.");
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setIsMenuOpen(false);

    // Confirm before deleting
    if (!confirm(`Are you sure you want to delete "${task.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}/tasks/${task.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      if (onTaskDeleted) {
        onTaskDeleted(task.id);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  return (
    <>
      <div className={`relative ${className}`} ref={menuRef}>
        {/* Three-dot menu button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Task actions"
        >
          <svg
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="py-1">
              {/* Edit */}
              <button
                type="button"
                onClick={handleEdit}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </button>

              {/* Duplicate */}
              <button
                type="button"
                onClick={handleDuplicate}
                disabled={isDuplicating}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {isDuplicating ? "Duplicating..." : "Duplicate"}
              </button>

              {/* Divider */}
              <div className="my-1 border-t border-gray-200 dark:border-gray-700" />

              {/* Delete */}
              <button
                type="button"
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 flex items-center gap-2"
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
            </div>
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        projectId={projectId}
        scheduleId={scheduleId}
        task={task}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />
    </>
  );
}

/**
 * TaskQuickActionsCompact Component
 * Compact version with icon buttons instead of dropdown
 */
export function TaskQuickActionsCompact({
  projectId,
  scheduleId,
  task,
  onTaskUpdated,
  onTaskDeleted,
  className = "",
}: Omit<TaskQuickActionsProps, "onTaskDuplicated">) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${task.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}/tasks/${task.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      if (onTaskDeleted) {
        onTaskDeleted(task.id);
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  return (
    <>
      <div className={`flex items-center gap-1 ${className}`}>
        {/* Edit button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditModalOpen(true);
          }}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Edit task"
          title="Edit"
        >
          <svg
            className="w-4 h-4 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>

        {/* Delete button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
          aria-label="Delete task"
          title="Delete"
        >
          <svg
            className="w-4 h-4 text-red-500"
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
        </button>
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        projectId={projectId}
        scheduleId={scheduleId}
        task={task}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onTaskUpdated={onTaskUpdated}
        onTaskDeleted={onTaskDeleted}
      />
    </>
  );
}
