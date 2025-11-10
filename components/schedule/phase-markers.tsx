"use client";

import React, { useMemo } from "react";
import { Task, TaskPhase } from "@prisma/client";
import {
  TASK_PHASE_LABELS,
  TASK_PHASE_COLORS,
  TASK_PHASE_ORDER,
  getPhaseColor,
} from "@/lib/task-types";
import { format } from "date-fns";

interface PhaseMarker {
  phase: TaskPhase;
  startDate: Date;
  endDate: Date;
  taskCount: number;
  color: string;
}

interface PhaseMarkersProps {
  tasks: Task[];
  onPhaseClick?: (phase: TaskPhase) => void;
  className?: string;
}

/**
 * PhaseMarkers Component
 * Visual markers on Gantt timeline showing phase boundaries
 *
 * Features:
 * - Colored vertical bars at phase boundaries
 * - Phase labels at top of timeline
 * - Click to filter tasks by phase
 * - Hover tooltip with phase details
 */
export function PhaseMarkers({
  tasks,
  onPhaseClick,
  className = "",
}: PhaseMarkersProps) {
  // Calculate phase boundaries based on task dates
  const phaseMarkers = useMemo(() => {
    const markers: PhaseMarker[] = [];

    // Group tasks by phase
    const tasksByPhase = new Map<TaskPhase, Task[]>();

    for (const task of tasks) {
      if (!task.phase) continue;

      if (!tasksByPhase.has(task.phase)) {
        tasksByPhase.set(task.phase, []);
      }
      tasksByPhase.get(task.phase)!.push(task);
    }

    // Calculate start/end dates for each phase
    for (const [phase, phaseTasks] of tasksByPhase) {
      if (phaseTasks.length === 0) continue;

      const startDate = new Date(
        Math.min(...phaseTasks.map((t) => new Date(t.startDate).getTime()))
      );
      const endDate = new Date(
        Math.max(...phaseTasks.map((t) => new Date(t.endDate).getTime()))
      );

      markers.push({
        phase,
        startDate,
        endDate,
        taskCount: phaseTasks.length,
        color: getPhaseColor(phase),
      });
    }

    // Sort by start date
    markers.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return markers;
  }, [tasks]);

  if (phaseMarkers.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Phase timeline */}
      <div className="relative h-16 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="absolute inset-0 flex">
          {phaseMarkers.map((marker, index) => {
            // Calculate width as percentage of total project duration
            const projectStart = new Date(
              Math.min(...tasks.map((t) => new Date(t.startDate).getTime()))
            );
            const projectEnd = new Date(
              Math.max(...tasks.map((t) => new Date(t.endDate).getTime()))
            );
            const totalDuration =
              projectEnd.getTime() - projectStart.getTime();
            const markerDuration =
              marker.endDate.getTime() - marker.startDate.getTime();
            const widthPercent = (markerDuration / totalDuration) * 100;

            const offsetPercent =
              ((marker.startDate.getTime() - projectStart.getTime()) /
                totalDuration) *
              100;

            return (
              <button
                key={marker.phase}
                type="button"
                onClick={() => onPhaseClick?.(marker.phase)}
                className="group relative flex flex-col justify-center px-2 py-1 transition-all hover:opacity-90 cursor-pointer"
                style={{
                  width: `${widthPercent}%`,
                  left: `${offsetPercent}%`,
                  backgroundColor: `${marker.color}15`,
                  borderLeft: `3px solid ${marker.color}`,
                  borderRight:
                    index === phaseMarkers.length - 1
                      ? `3px solid ${marker.color}`
                      : "none",
                }}
                title={`${TASK_PHASE_LABELS[marker.phase]}: ${marker.taskCount} tasks`}
              >
                <div className="text-xs font-semibold truncate" style={{ color: marker.color }}>
                  {TASK_PHASE_LABELS[marker.phase]}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {marker.taskCount} task{marker.taskCount !== 1 ? "s" : ""}
                </div>

                {/* Hover tooltip */}
                <div className="absolute top-full left-0 mt-1 hidden group-hover:block z-10 min-w-[200px]">
                  <div className="bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3">
                    <div className="font-semibold mb-1">
                      {TASK_PHASE_LABELS[marker.phase]}
                    </div>
                    <div className="space-y-1 text-gray-300">
                      <div>Start: {format(marker.startDate, "MMM dd, yyyy")}</div>
                      <div>End: {format(marker.endDate, "MMM dd, yyyy")}</div>
                      <div>
                        Duration:{" "}
                        {Math.ceil(
                          (marker.endDate.getTime() - marker.startDate.getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                      </div>
                      <div>{marker.taskCount} tasks</div>
                    </div>
                    {onPhaseClick && (
                      <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400">
                        Click to filter
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Phase legend */}
      <div className="flex flex-wrap gap-2">
        {phaseMarkers.map((marker) => (
          <button
            key={marker.phase}
            type="button"
            onClick={() => onPhaseClick?.(marker.phase)}
            className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-xs"
          >
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: marker.color }}
            />
            <span className="text-gray-700 dark:text-gray-300">
              {TASK_PHASE_LABELS[marker.phase]}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              ({marker.taskCount})
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * PhaseProgressBar Component
 * Horizontal bar showing completion by phase
 *
 * Features:
 * - Each phase segment sized by % of total project duration
 * - Color = phase color
 * - Fill % = average completion of tasks in that phase
 * - Hover tooltip with completion details
 * - Click segment to filter to that phase
 */
export function PhaseProgressBar({
  tasks,
  onPhaseClick,
  className = "",
}: PhaseMarkersProps) {
  // Calculate phase progress
  const phaseProgress = useMemo(() => {
    const progress: Array<{
      phase: TaskPhase;
      durationPercent: number;
      completionPercent: number;
      completedTasks: number;
      totalTasks: number;
      color: string;
    }> = [];

    // Calculate project duration
    if (tasks.length === 0) return progress;

    const projectStart = new Date(
      Math.min(...tasks.map((t) => new Date(t.startDate).getTime()))
    );
    const projectEnd = new Date(
      Math.max(...tasks.map((t) => new Date(t.endDate).getTime()))
    );
    const totalProjectDuration =
      projectEnd.getTime() - projectStart.getTime();

    // Group tasks by phase
    const tasksByPhase = new Map<TaskPhase, Task[]>();

    for (const task of tasks) {
      if (!task.phase) continue;

      if (!tasksByPhase.has(task.phase)) {
        tasksByPhase.set(task.phase, []);
      }
      tasksByPhase.get(task.phase)!.push(task);
    }

    // Calculate progress for each phase
    for (const [phase, phaseTasks] of tasksByPhase) {
      if (phaseTasks.length === 0) continue;

      // Calculate phase duration
      const phaseStart = new Date(
        Math.min(...phaseTasks.map((t) => new Date(t.startDate).getTime()))
      );
      const phaseEnd = new Date(
        Math.max(...phaseTasks.map((t) => new Date(t.endDate).getTime()))
      );
      const phaseDuration = phaseEnd.getTime() - phaseStart.getTime();
      const durationPercent = (phaseDuration / totalProjectDuration) * 100;

      // Calculate completion
      const completedTasks = phaseTasks.filter((t) => t.completed).length;
      const completionPercent = (completedTasks / phaseTasks.length) * 100;

      progress.push({
        phase,
        durationPercent,
        completionPercent,
        completedTasks,
        totalTasks: phaseTasks.length,
        color: getPhaseColor(phase),
      });
    }

    // Sort by phase order
    progress.sort(
      (a, b) =>
        TASK_PHASE_ORDER.indexOf(a.phase) - TASK_PHASE_ORDER.indexOf(b.phase)
    );

    return progress;
  }, [tasks]);

  // Calculate overall project completion
  const overallCompletion = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completedCount = tasks.filter((t) => t.completed).length;
    return Math.round((completedCount / tasks.length) * 100);
  }, [tasks]);

  if (phaseProgress.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Title and overall progress */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Phase Progress
        </h4>
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {overallCompletion}% Complete
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-12 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden flex">
        {phaseProgress.map((phase, index) => (
          <button
            key={phase.phase}
            type="button"
            onClick={() => onPhaseClick?.(phase.phase)}
            className="group relative flex items-center justify-center transition-all hover:opacity-90 cursor-pointer border-r-2 border-white dark:border-gray-900"
            style={{
              width: `${phase.durationPercent}%`,
              backgroundColor: `${phase.color}30`,
            }}
            title={`${TASK_PHASE_LABELS[phase.phase]}: ${phase.completionPercent.toFixed(0)}% complete`}
          >
            {/* Completion fill */}
            <div
              className="absolute inset-0"
              style={{
                width: `${phase.completionPercent}%`,
                backgroundColor: phase.color,
              }}
            />

            {/* Label */}
            <div className="relative z-10 px-2 text-center">
              <div className="text-xs font-semibold text-white drop-shadow-sm">
                {TASK_PHASE_LABELS[phase.phase]}
              </div>
              <div className="text-xs text-white drop-shadow-sm">
                {phase.completedTasks}/{phase.totalTasks}
              </div>
            </div>

            {/* Hover tooltip */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 hidden group-hover:block z-10">
              <div className="bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 whitespace-nowrap">
                <div className="font-semibold mb-1">
                  {TASK_PHASE_LABELS[phase.phase]}
                </div>
                <div className="space-y-1 text-gray-300">
                  <div>
                    Completed: {phase.completedTasks} / {phase.totalTasks} tasks
                  </div>
                  <div>Progress: {phase.completionPercent.toFixed(0)}%</div>
                  <div>
                    Duration: {phase.durationPercent.toFixed(1)}% of project
                  </div>
                </div>
                {onPhaseClick && (
                  <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400">
                    Click to filter
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Detailed progress list */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {phaseProgress.map((phase) => (
          <div
            key={phase.phase}
            className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: phase.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                {TASK_PHASE_LABELS[phase.phase]}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {phase.completedTasks}/{phase.totalTasks} ({phase.completionPercent.toFixed(0)}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
