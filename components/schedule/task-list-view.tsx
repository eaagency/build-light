"use client";

import React, { useState, useEffect } from "react";
import { Task } from "@prisma/client";
import { AddTaskButton } from "./add-task-button";
import { TaskQuickActions } from "./task-quick-actions";
import { TaskProgressIndicator, TaskProgressSlider } from "./task-progress-indicator";
import { TaskFilterToolbar } from "./task-filter-toolbar";
import {
  TaskListControls,
  TaskSortHeader,
  TaskBulkSelectCheckbox,
  TaskBulkSelectAllCheckbox,
  sortTasks,
} from "./task-list-controls";
import { PhaseIndicator } from "./phase-selector";
import { TagList } from "./tag-input";
import { TaskFilters, TaskSort, getPhaseLabel } from "@/lib/task-types";
import { format } from "date-fns";

interface TaskListViewProps {
  projectId: string;
  scheduleId: string;
  className?: string;
}

/**
 * TaskListView Component
 * Complete integration example showing all task management components working together
 * Includes filtering, sorting, bulk operations, and quick actions
 */
export function TaskListView({
  projectId,
  scheduleId,
  className = "",
}: TaskListViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort state
  const [filters, setFilters] = useState<TaskFilters>({});
  const [sort, setSort] = useState<TaskSort>({
    field: "startDate",
    direction: "asc",
  });

  // Bulk selection state
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  // Fetch tasks
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
        setTasks(data.tasks || []);
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
  }, [projectId, scheduleId]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...tasks];

    // Apply filters
    if (filters.phases && filters.phases.length > 0) {
      result = result.filter((task) => filters.phases?.includes(task.phase!));
    }

    if (filters.tags && filters.tags.length > 0) {
      result = result.filter((task) =>
        task.tags?.some((tag) => filters.tags?.includes(tag))
      );
    }

    if (filters.assignees && filters.assignees.length > 0) {
      result = result.filter((task) =>
        task.assignees?.some((assignee) => filters.assignees?.includes(assignee))
      );
    }

    if (filters.status) {
      const progressMap = {
        NOT_STARTED: 0,
        IN_PROGRESS: (task: Task) => !task.completed && task.completed !== null,
        COMPLETE: 100,
      };

      if (filters.status === "NOT_STARTED") {
        result = result.filter((task) => !task.completed);
      } else if (filters.status === "COMPLETE") {
        result = result.filter((task) => task.completed);
      } else if (filters.status === "IN_PROGRESS") {
        // For now, consider all non-completed tasks as in progress
        result = result.filter((task) => !task.completed);
      }
    }

    // Apply sorting
    result = sortTasks(result, sort);

    setFilteredTasks(result);
  }, [tasks, filters, sort]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    setSelectedTaskIds(filteredTasks.map((task) => task.id));
  };

  const handleDeselectAll = () => {
    setSelectedTaskIds([]);
  };

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    try {
      // Delete each task
      await Promise.all(
        selectedTaskIds.map((taskId) =>
          fetch(
            `/api/projects/${projectId}/schedules/${scheduleId}/tasks/${taskId}`,
            { method: "DELETE" }
          )
        )
      );

      // Remove deleted tasks from state
      setTasks((prev) => prev.filter((task) => !selectedTaskIds.includes(task.id)));
      setSelectedTaskIds([]);
    } catch (error) {
      console.error("Error deleting tasks:", error);
      alert("Failed to delete some tasks. Please try again.");
    }
  };

  const handleBulkColorChange = async (color: string) => {
    try {
      // Update color for all selected tasks
      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}/tasks/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskIds: selectedTaskIds,
            updates: { color },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update tasks");
      }

      const data = await response.json();

      // Update tasks in state
      setTasks((prev) =>
        prev.map((task) => {
          const updatedTask = data.tasks.find((t: Task) => t.id === task.id);
          return updatedTask || task;
        })
      );

      setSelectedTaskIds([]);
    } catch (error) {
      console.error("Error updating tasks:", error);
      alert("Failed to update task colors. Please try again.");
    }
  };

  const handleBulkPhaseChange = async (phase: any) => {
    // Similar to handleBulkColorChange
    console.log("Bulk phase change:", phase);
  };

  const handleBulkTagAdd = async (tag: string) => {
    // Similar to handleBulkColorChange
    console.log("Bulk tag add:", tag);
  };

  // Quick progress update
  const handleProgressChange = async (taskId: string, progress: number) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/schedules/${scheduleId}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: progress === 100 }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update progress");
      }

      const data = await response.json();

      // Update task in state
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? data.task : task))
      );
    } catch (error) {
      console.error("Error updating progress:", error);
      alert("Failed to update progress. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6BF178] mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#6BF178] text-[#121212] rounded-md hover:bg-[#5ae067]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Filter Toolbar */}
      <TaskFilterToolbar
        projectId={projectId}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Task List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <TaskBulkSelectAllCheckbox
                  totalTasks={filteredTasks.length}
                  selectedCount={selectedTaskIds.length}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <TaskSortHeader
                  field="name"
                  label="Task Name"
                  currentSort={sort}
                  onSort={setSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <TaskSortHeader
                  field="phase"
                  label="Phase"
                  currentSort={sort}
                  onSort={setSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <TaskSortHeader
                  field="startDate"
                  label="Start Date"
                  currentSort={sort}
                  onSort={setSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <TaskSortHeader
                  field="endDate"
                  label="End Date"
                  currentSort={sort}
                  onSort={setSort}
                />
              </th>
              <th className="px-4 py-3 text-left w-64">Progress</th>
              <th className="px-4 py-3 text-left">Tags</th>
              <th className="px-4 py-3 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  No tasks found. {Object.keys(filters).length > 0 ? "Try adjusting your filters." : "Click the + button to add a task."}
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr
                  key={task.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <td className="px-4 py-3">
                    <TaskBulkSelectCheckbox
                      taskId={task.id}
                      isSelected={selectedTaskIds.includes(task.id)}
                      onToggle={handleToggleTask}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {task.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {task.phase && <PhaseIndicator phase={task.phase} />}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(task.startDate), "MMM dd, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(task.endDate), "MMM dd, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <TaskProgressSlider
                      progress={task.completed ? 100 : 0}
                      onChange={(progress) => handleProgressChange(task.id, progress)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <TagList tags={task.tags || []} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <TaskQuickActions
                      projectId={projectId}
                      scheduleId={scheduleId}
                      task={task}
                      onTaskUpdated={(updatedTask) => {
                        setTasks((prev) =>
                          prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
                        );
                      }}
                      onTaskDeleted={(taskId) => {
                        setTasks((prev) => prev.filter((t) => t.id !== taskId));
                      }}
                      onTaskDuplicated={(newTask) => {
                        setTasks((prev) => [...prev, newTask]);
                      }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Task Button (FAB) */}
      <AddTaskButton
        projectId={projectId}
        scheduleId={scheduleId}
        onTaskCreated={(newTask) => {
          setTasks((prev) => [...prev, newTask]);
        }}
      />

      {/* Bulk Actions Toolbar */}
      <TaskListControls
        tasks={filteredTasks}
        selectedTaskIds={selectedTaskIds}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onBulkDelete={handleBulkDelete}
        onBulkColorChange={handleBulkColorChange}
        onBulkPhaseChange={handleBulkPhaseChange}
        onBulkTagAdd={handleBulkTagAdd}
        sort={sort}
        onSortChange={setSort}
      />
    </div>
  );
}
