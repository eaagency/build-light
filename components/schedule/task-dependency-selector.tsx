"use client";

import React, { useState, useEffect } from "react";
import { TaskDependency, validateDependencies } from "@/lib/task-types";
import { hasCircularDependency } from "@/lib/task-utils";

interface Task {
  id: string;
  name: string;
  phase: string | null;
  dependencies: string[];
}

interface TaskDependencySelectorProps {
  projectId: string;
  scheduleId: string;
  currentTaskId?: string; // For editing existing tasks
  value: TaskDependency[];
  onChange: (dependencies: TaskDependency[]) => void;
  disabled?: boolean;
  className?: string;
  maxDependencies?: number;
}

type DependencyType = "START_TO_START" | "FINISH_TO_START";

/**
 * TaskDependencySelector Component
 * Allows selecting up to 3 predecessor tasks with dependency type
 * Validates for circular dependencies using DFS algorithm
 */
export function TaskDependencySelector({
  projectId,
  scheduleId,
  currentTaskId,
  value = [],
  onChange,
  disabled = false,
  className = "",
  maxDependencies = 3,
}: TaskDependencySelectorProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [circularPath, setCircularPath] = useState<string[] | null>(null);

  // Fetch all tasks in the schedule
  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/projects/${projectId}/schedules/${scheduleId}/tasks`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const data = await response.json();
        // Filter out current task if editing
        const filteredTasks = currentTaskId
          ? data.tasks.filter((t: Task) => t.id !== currentTaskId)
          : data.tasks;

        setTasks(filteredTasks);
      } catch (err: any) {
        console.error("Error fetching tasks:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (projectId && scheduleId) {
      fetchTasks();
    }
  }, [projectId, scheduleId, currentTaskId]);

  // Validate dependencies whenever they change
  useEffect(() => {
    if (value.length === 0) {
      setError(null);
      setCircularPath(null);
      return;
    }

    // Basic validation (max count, duplicates)
    const validation = validateDependencies(value);
    if (!validation.valid) {
      setError(validation.error || "Invalid dependencies");
      setCircularPath(null);
      return;
    }

    // Circular dependency validation
    const simulatedTasks = tasks.map((t) => ({
      id: t.id,
      dependencies: t.id === currentTaskId ? value.map((d) => d.taskId) : t.dependencies,
    }));

    // Add current task if creating new
    if (!currentTaskId) {
      simulatedTasks.push({
        id: "temp-new-task",
        dependencies: value.map((d) => d.taskId),
      });
    }

    // Check for circular dependencies
    const taskToCheck = currentTaskId || "temp-new-task";
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    if (hasCircularDependency(taskToCheck, simulatedTasks, visited, recursionStack)) {
      setError("Circular dependency detected!");
      setCircularPath(Array.from(recursionStack));
    } else {
      setError(null);
      setCircularPath(null);
    }
  }, [value, tasks, currentTaskId]);

  const addDependency = () => {
    if (value.length >= maxDependencies) {
      setError(`Maximum ${maxDependencies} dependencies allowed`);
      return;
    }

    const newDependency: TaskDependency = {
      taskId: "",
      type: "FINISH_TO_START",
    };

    onChange([...value, newDependency]);
  };

  const removeDependency = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
    setError(null);
    setCircularPath(null);
  };

  const updateDependencyTask = (index: number, taskId: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], taskId };
    onChange(updated);
  };

  const updateDependencyType = (index: number, type: DependencyType) => {
    const updated = [...value];
    updated[index] = { ...updated[index], type };
    onChange(updated);
  };

  // Get available tasks for selection (exclude already selected)
  const getAvailableTasks = (currentIndex: number) => {
    const selectedIds = value
      .map((d, i) => (i !== currentIndex ? d.taskId : null))
      .filter(Boolean);
    return tasks.filter((t) => !selectedIds.includes(t.id));
  };

  const getTaskName = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    return task ? task.name : "Unknown Task";
  };

  if (loading) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Dependencies
        </label>
        <div className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md">
          <p className="text-sm text-gray-500">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Dependencies
        </label>
        <div className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md">
          <p className="text-sm text-gray-500">
            No other tasks available. Add more tasks to create dependencies.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Dependencies
        <span className="text-xs text-gray-500 ml-2">
          ({value.length}/{maxDependencies})
        </span>
      </label>

      <div className="space-y-3">
        {/* Existing dependencies */}
        {value.map((dependency, index) => (
          <div
            key={index}
            className="p-3 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900"
          >
            <div className="flex items-start gap-2 mb-2">
              <div className="flex-1">
                {/* Task selector */}
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Predecessor Task
                </label>
                <select
                  value={dependency.taskId}
                  onChange={(e) => updateDependencyTask(index, e.target.value)}
                  disabled={disabled}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6BF178] focus:border-[#6BF178] disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Select a task...</option>
                  {getAvailableTasks(index).map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.name} {task.phase && `(${task.phase})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Remove button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeDependency(index)}
                  className="mt-6 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded transition-colors"
                  aria-label="Remove dependency"
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
                </button>
              )}
            </div>

            {/* Dependency type */}
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                Dependency Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`dep-type-${index}`}
                    value="FINISH_TO_START"
                    checked={dependency.type === "FINISH_TO_START"}
                    onChange={(e) =>
                      updateDependencyType(index, e.target.value as DependencyType)
                    }
                    disabled={disabled}
                    className="text-[#6BF178] focus:ring-[#6BF178]"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Finish-to-Start
                    <span className="block text-xs text-gray-500">
                      This task starts when predecessor finishes
                    </span>
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`dep-type-${index}`}
                    value="START_TO_START"
                    checked={dependency.type === "START_TO_START"}
                    onChange={(e) =>
                      updateDependencyType(index, e.target.value as DependencyType)
                    }
                    disabled={disabled}
                    className="text-[#6BF178] focus:ring-[#6BF178]"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Start-to-Start
                    <span className="block text-xs text-gray-500">
                      Both tasks can start at the same time
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        ))}

        {/* Add dependency button */}
        {value.length < maxDependencies && !disabled && (
          <button
            type="button"
            onClick={addDependency}
            className="w-full px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-md text-sm text-gray-600 dark:text-gray-400 hover:border-[#6BF178] hover:text-[#6BF178] transition-colors flex items-center justify-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Dependency
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-md">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                {error}
              </p>
              {circularPath && circularPath.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-red-700 dark:text-red-300 mb-1">
                    Circular path detected:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {circularPath.map((taskId, i) => (
                      <React.Fragment key={i}>
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-800 rounded">
                          {getTaskName(taskId)}
                        </span>
                        {i < circularPath.length - 1 && (
                          <span className="text-red-600">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      {!error && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Dependencies help organize task order. Maximum {maxDependencies}{" "}
          dependencies per task.
        </p>
      )}
    </div>
  );
}

/**
 * DependencyList Component
 * Display-only list of dependencies (for read-only views)
 */
export function DependencyList({
  dependencies,
  tasks,
}: {
  dependencies: TaskDependency[];
  tasks: Task[];
}) {
  if (dependencies.length === 0) {
    return (
      <p className="text-sm text-gray-500">No dependencies</p>
    );
  }

  const getTaskName = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    return task ? task.name : "Unknown Task";
  };

  return (
    <div className="space-y-2">
      {dependencies.map((dep, index) => (
        <div
          key={index}
          className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
        >
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
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
          <span>{getTaskName(dep.taskId)}</span>
          <span className="text-xs text-gray-500">
            ({dep.type === "FINISH_TO_START" ? "Finish-to-Start" : "Start-to-Start"})
          </span>
        </div>
      ))}
    </div>
  );
}
