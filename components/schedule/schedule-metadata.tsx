"use client";

import React, { useMemo } from "react";
import { Task } from "@prisma/client";
import { format, differenceInDays, min, max } from "date-fns";

interface ScheduleMetadataProps {
  tasks: Task[];
  scheduleName: string;
  className?: string;
  compact?: boolean;
}

/**
 * ScheduleMetadata Component
 * Displays schedule statistics and metadata
 *
 * Features:
 * - Total tasks count
 * - Total duration (workdays)
 * - Completion percentage
 * - Start and end dates
 * - Team members assigned
 * - Critical path length (if available)
 * - Phase breakdown
 */
export function ScheduleMetadata({
  tasks,
  scheduleName,
  className = "",
  compact = false,
}: ScheduleMetadataProps) {
  const metadata = useMemo(() => calculateScheduleMetadata(tasks), [tasks]);

  if (compact) {
    return <CompactMetadata metadata={metadata} />;
  }

  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-primary">{scheduleName}</h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            metadata.completionPercentage >= 75
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
              : metadata.completionPercentage >= 25
              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
              : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
          }`}
        >
          {metadata.completionPercentage}% Complete
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          icon={
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
          label="Total Tasks"
          value={metadata.totalTasks.toString()}
        />

        <StatCard
          icon={
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          label="Completed"
          value={metadata.completedTasks.toString()}
        />

        <StatCard
          icon={
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
          }
          label="Duration (days)"
          value={metadata.totalDuration.toString()}
        />

        <StatCard
          icon={
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
          label="Team Members"
          value={metadata.uniqueAssignees.toString()}
        />

        <StatCard
          icon={
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          }
          label="Phases"
          value={metadata.uniquePhases.toString()}
        />

        <StatCard
          icon={
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
          label="Dependencies"
          value={metadata.totalDependencies.toString()}
        />
      </div>

      {/* Date Range */}
      <div className="border-t border-border pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Start Date</p>
            <p className="text-lg font-semibold text-foreground">
              {metadata.startDate
                ? format(metadata.startDate, "MMM dd, yyyy")
                : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">End Date</p>
            <p className="text-lg font-semibold text-foreground">
              {metadata.endDate
                ? format(metadata.endDate, "MMM dd, yyyy")
                : "Not set"}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Overall Progress
          </span>
          <span className="text-sm font-medium text-foreground">
            {metadata.completedTasks} of {metadata.totalTasks} tasks
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="bg-accent h-3 rounded-full transition-all duration-300"
            style={{ width: `${metadata.completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Compact Metadata View
 */
function CompactMetadata({ metadata }: { metadata: ScheduleMetadataData }) {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      <span className="flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        {metadata.totalTasks} tasks
      </span>
      <span className="flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {metadata.completionPercentage}% complete
      </span>
      <span className="flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {metadata.totalDuration} days
      </span>
    </div>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-muted rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

/**
 * Schedule Metadata Data Interface
 */
interface ScheduleMetadataData {
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  totalDuration: number;
  startDate: Date | null;
  endDate: Date | null;
  uniqueAssignees: number;
  uniquePhases: number;
  totalDependencies: number;
}

/**
 * Calculate schedule metadata from tasks
 */
function calculateScheduleMetadata(tasks: Task[]): ScheduleMetadataData {
  if (tasks.length === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      completionPercentage: 0,
      totalDuration: 0,
      startDate: null,
      endDate: null,
      uniqueAssignees: 0,
      uniquePhases: 0,
      totalDependencies: 0,
    };
  }

  const completedTasks = tasks.filter((t) => t.completed).length;
  const completionPercentage = Math.round((completedTasks / tasks.length) * 100);

  const dates = tasks.map((t) => new Date(t.startDate));
  const endDates = tasks.map((t) => new Date(t.endDate));

  const startDate = min(dates);
  const endDate = max(endDates);

  const totalDuration = differenceInDays(endDate, startDate);

  const assigneeSet = new Set<string>();
  tasks.forEach((task) => {
    task.assignees.forEach((assignee) => assigneeSet.add(assignee));
  });

  const phaseSet = new Set<string>();
  tasks.forEach((task) => {
    if (task.phase) {
      phaseSet.add(task.phase);
    }
  });

  const totalDependencies = tasks.reduce(
    (sum, task) => sum + task.dependencies.length,
    0
  );

  return {
    totalTasks: tasks.length,
    completedTasks,
    completionPercentage,
    totalDuration,
    startDate,
    endDate,
    uniqueAssignees: assigneeSet.size,
    uniquePhases: phaseSet.size,
    totalDependencies,
  };
}
