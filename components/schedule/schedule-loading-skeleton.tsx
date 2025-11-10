"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

type ViewMode = "gantt" | "list" | "calendar";

interface ScheduleLoadingSkeletonProps {
  viewMode?: ViewMode;
}

/**
 * ScheduleLoadingSkeleton Component
 * Loading skeleton for schedule views
 *
 * Features:
 * - Different skeletons for Gantt, List, and Calendar views
 * - Shimmer effect for better perceived performance
 * - Matches layout of actual schedule components
 */
export function ScheduleLoadingSkeleton({
  viewMode = "gantt",
}: ScheduleLoadingSkeletonProps) {
  if (viewMode === "gantt") {
    return <GanttSkeleton />;
  } else if (viewMode === "list") {
    return <ListSkeleton />;
  } else {
    return <CalendarSkeleton />;
  }
}

/**
 * Gantt View Skeleton
 */
function GanttSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton width={100} height={36} />
          <Skeleton width={120} height={36} />
          <Skeleton width={100} height={36} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={80} height={36} />
          <Skeleton width={100} height={36} />
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="p-4">
        {/* Grid Headers */}
        <div className="flex mb-2">
          <div className="w-1/3 pr-4">
            <Skeleton height={32} />
          </div>
          <div className="w-2/3">
            <Skeleton height={32} />
          </div>
        </div>

        {/* Timeline Bars */}
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center mb-3">
            <div className="w-1/3 pr-4">
              <Skeleton height={40} />
            </div>
            <div className="w-2/3">
              <div className="flex items-center">
                <div className="w-1/12" />
                <Skeleton
                  height={28}
                  width={`${20 + (i * 10) % 50}%`}
                  borderRadius={4}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * List View Skeleton
 */
function ListSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton width={120} height={36} />
          <Skeleton width={100} height={36} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={80} height={36} />
          <Skeleton width={100} height={36} />
        </div>
      </div>

      {/* Table Headers */}
      <div className="border-b border-border px-6 py-3">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <Skeleton height={20} />
          </div>
          <div className="col-span-2">
            <Skeleton height={20} />
          </div>
          <div className="col-span-2">
            <Skeleton height={20} />
          </div>
          <div className="col-span-2">
            <Skeleton height={20} />
          </div>
          <div className="col-span-2">
            <Skeleton height={20} />
          </div>
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-border">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="px-6 py-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4">
                <Skeleton height={20} width="80%" />
                <Skeleton height={16} width="60%" style={{ marginTop: 4 }} />
              </div>
              <div className="col-span-2">
                <Skeleton height={24} width={60} borderRadius={12} />
              </div>
              <div className="col-span-2">
                <Skeleton height={20} width="90%" />
              </div>
              <div className="col-span-2">
                <Skeleton height={20} width="90%" />
              </div>
              <div className="col-span-2">
                <Skeleton height={32} width={80} borderRadius={16} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Calendar View Skeleton
 */
function CalendarSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Calendar Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton width={120} height={36} />
          <Skeleton width={150} height={36} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={36} height={36} circle />
          <Skeleton width={36} height={36} circle />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center">
              <Skeleton height={20} />
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {[1, 2, 3, 4, 5].map((week) => (
          <div key={week} className="grid grid-cols-7 gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className="border border-border rounded-lg p-2 min-h-[100px]"
              >
                <Skeleton height={16} width={30} />
                <div className="mt-2 space-y-1">
                  {day % 3 === 0 && <Skeleton height={20} borderRadius={4} />}
                  {day % 2 === 0 && <Skeleton height={20} borderRadius={4} />}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact Loading Spinner
 * For inline loading states
 */
export function ScheduleLoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <svg
          className="animate-spin h-10 w-10 text-accent mx-auto mb-3"
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
        <p className="text-muted-foreground text-sm">Loading schedule...</p>
      </div>
    </div>
  );
}

/**
 * Task Card Skeleton
 * For individual task loading
 */
export function TaskCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <Skeleton height={20} width="70%" />
        <Skeleton height={24} width={24} circle />
      </div>
      <div className="space-y-2">
        <Skeleton height={16} width="40%" />
        <Skeleton height={16} width="60%" />
        <div className="flex items-center gap-2 mt-3">
          <Skeleton height={24} width={60} borderRadius={12} />
          <Skeleton height={24} width={80} borderRadius={12} />
        </div>
      </div>
    </div>
  );
}
