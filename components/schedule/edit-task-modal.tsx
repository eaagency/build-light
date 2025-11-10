"use client";

import React, { useState, useEffect } from "react";
import { Task, TaskPhase } from "@prisma/client";
import { PhaseSelector } from "./phase-selector";
import { TagInput } from "./tag-input";
import { TeamMemberSelector } from "./team-member-selector";
import { DateRangePicker } from "./date-range-picker";
import { TaskDependencySelector } from "./task-dependency-selector";
import {
  EditTaskFormData,
  TaskDependency,
  validateTaskName,
  validateTaskDates,
  getTaskStatus,
  getStatusColor,
} from "@/lib/task-types";

interface EditTaskModalProps {
  projectId: string;
  scheduleId: string;
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
}

/**
 * EditTaskModal Component
 * Modal for editing existing tasks with pre-populated data
 * Includes progress slider, status indicator, and delete functionality
 */
export function EditTaskModal({
  projectId,
  scheduleId,
  task,
  isOpen,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}: EditTaskModalProps) {
  const [formData, setFormData] = useState<Partial<EditTaskFormData>>({});
  const [progress, setProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initialize form data from task
  useEffect(() => {
    if (task) {
      setFormData({
        id: task.id,
        name: task.name,
        description: "",
        phase: task.phase as TaskPhase,
        startDate: new Date(task.startDate),
        endDate: new Date(task.endDate),
        assignees: task.assignees || [],
        tags: task.tags || [],
        color: task.color || undefined,
        dependencies: (task.dependencies || []).map((dep) => ({
          taskId: dep,
          type: "FINISH_TO_START" as const,
        })),
        notes: task.notes || "",
        completed: task.completed || false,
      });
      // Calculate progress from completed status (0 or 100)
      setProgress(task.completed ? 100 : 0);
    }
  }, [task]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    const nameValidation = validateTaskName(formData.name || "");
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error || "Invalid name";
    }

    // Validate dates
    const dateValidation = validateTaskDates(
      formData.startDate || null,
      formData.endDate || null
    );
    if (!dateValidation.valid) {
      newErrors.dates = dateValidation.error || "Invalid dates";
    }

    // Validate phase
    if (!formData.phase) {
      newErrors.phase = "Phase is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare data for API
      const taskData = {
        name: formData.name!,
        startDate: formData.startDate!.toISOString(),
        endDate: formData.endDate!.toISOString(),
        phase: formData.phase!,
        tags: formData.tags || [],
        assignees: formData.assignees || [],
        dependencies: (formData.dependencies || []).map((d) => d.taskId),
        color: formData.color,
        notes: formData.notes || undefined,
        completed: progress === 100,
      };

      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update task");
      }

      const data = await response.json();

      // Call success callback
      if (onTaskUpdated) {
        onTaskUpdated(data.task);
      }

      // Close modal
      handleClose();
    } catch (err: any) {
      console.error("Error updating task:", err);
      setSubmitError(err.message || "Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setSubmitError(null);

    try {
      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}/tasks/${task.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete task");
      }

      // Call success callback
      if (onTaskDeleted) {
        onTaskDeleted(task.id);
      }

      // Close modal
      handleClose();
    } catch (err: any) {
      console.error("Error deleting task:", err);
      setSubmitError(err.message || "Failed to delete task");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setShowDeleteConfirm(false);
    setErrors({});
    setSubmitError(null);
    onClose();
  };

  if (!isOpen) return null;

  const status = getTaskStatus(progress);
  const statusColor = getStatusColor(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Task
              </h2>
              {/* Status indicator */}
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {status === "NOT_STARTED" && "Not Started"}
                  {status === "IN_PROGRESS" && "In Progress"}
                  {status === "COMPLETE" && "Complete"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {/* Progress Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Progress: {progress}%
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6BF178]"
                />
                {/* Progress bar visualization */}
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-md overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: statusColor,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Task Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) {
                    setErrors({ ...errors, name: "" });
                  }
                }}
                placeholder="e.g., Install electrical wiring"
                maxLength={200}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6BF178] focus:border-[#6BF178] dark:bg-gray-800 dark:text-white"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Phase Selector */}
            <PhaseSelector
              value={formData.phase || null}
              onChange={(phase, color) => {
                setFormData({
                  ...formData,
                  phase: phase!,
                  color: formData.color || color,
                });
                if (errors.phase) {
                  setErrors({ ...errors, phase: "" });
                }
              }}
              required
            />
            {errors.phase && (
              <p className="text-xs text-red-500">{errors.phase}</p>
            )}

            {/* Date Range Picker */}
            <DateRangePicker
              startDate={formData.startDate || null}
              endDate={formData.endDate || null}
              onStartDateChange={(date) => {
                setFormData({ ...formData, startDate: date || new Date() });
                if (errors.dates) {
                  setErrors({ ...errors, dates: "" });
                }
              }}
              onEndDateChange={(date) => {
                setFormData({ ...formData, endDate: date });
                if (errors.dates) {
                  setErrors({ ...errors, dates: "" });
                }
              }}
            />
            {errors.dates && (
              <p className="text-xs text-red-500">{errors.dates}</p>
            )}

            {/* Assignees */}
            <TeamMemberSelector
              projectId={projectId}
              value={formData.assignees || []}
              onChange={(assignees) =>
                setFormData({ ...formData, assignees })
              }
            />

            {/* Tags */}
            <TagInput
              value={formData.tags || []}
              onChange={(tags) => setFormData({ ...formData, tags })}
            />

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Custom Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color || "#6BF178"}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="w-16 h-10 rounded border border-gray-300 dark:border-gray-700 cursor-pointer"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.color || "Using phase color"}
                </span>
                {formData.color && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, color: undefined })}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Reset to phase color
                  </button>
                )}
              </div>
            </div>

            {/* Dependencies */}
            <TaskDependencySelector
              projectId={projectId}
              scheduleId={scheduleId}
              currentTaskId={task.id}
              value={formData.dependencies || []}
              onChange={(dependencies) =>
                setFormData({ ...formData, dependencies })
              }
            />

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes or details..."
                rows={3}
                maxLength={2000}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#6BF178] focus:border-[#6BF178] dark:bg-gray-800 dark:text-white resize-none"
              />
            </div>
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="mx-6 mb-4 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">
                {submitError}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
            {/* Delete button (left side) */}
            <div>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting || isDeleting}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900 border border-red-300 dark:border-red-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Delete Task
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Are you sure?
                  </span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDeleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Save and Cancel buttons (right side) */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isDeleting}
                className="px-4 py-2 text-sm font-medium text-[#121212] bg-[#6BF178] rounded-md hover:bg-[#5ae067] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
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
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
