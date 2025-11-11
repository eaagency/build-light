"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  isToday,
  isYesterday,
  isThisWeek,
  isSameWeek,
  subWeeks,
  startOfWeek,
  isBefore,
  isSameDay,
  startOfDay,
} from "date-fns";
import { DailyLogWithRelations } from "@/lib/api/daily-logs";
import { DailyLogCard } from "./daily-log-card";
import { LogDateMarker } from "./log-date-marker";
import { EmptyState } from "./empty-state";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface DailyLogsTimelineProps {
  /**
   * Daily logs to display
   */
  logs: DailyLogWithRelations[];
  /**
   * Is currently loading logs
   */
  isLoading?: boolean;
  /**
   * Has more logs to load
   */
  hasMore?: boolean;
  /**
   * Load more callback for infinite scroll
   */
  onLoadMore?: () => void;
  /**
   * Current user ID
   */
  currentUserId?: string;
  /**
   * Team members for permission checks
   */
  teamMembers: TeamMember[];
  /**
   * Edit log handler
   */
  onEdit?: (log: DailyLogWithRelations) => void;
  /**
   * Delete log handler
   */
  onDelete?: (log: DailyLogWithRelations) => void;
  /**
   * Photo click handler
   */
  onPhotoClick?: (photoUrl: string, index: number, log: DailyLogWithRelations) => void;
  /**
   * Card click handler (for detail view)
   */
  onCardClick?: (log: DailyLogWithRelations) => void;
  /**
   * Is loading more (for infinite scroll)
   */
  isLoadingMore?: boolean;
  /**
   * No results state (after filtering)
   */
  noResults?: boolean;
  /**
   * Clear filters handler
   */
  onClearFilters?: () => void;
}

interface GroupedLogs {
  period: string;
  logs: DailyLogWithRelations[];
}

function groupLogsByPeriod(logs: DailyLogWithRelations[]): GroupedLogs[] {
  const today = startOfDay(new Date());
  const groups: Map<string, DailyLogWithRelations[]> = new Map();

  logs.forEach((log) => {
    const logDate = new Date(log.date);
    let period: string;

    if (isToday(logDate)) {
      period = "Today";
    } else if (isYesterday(logDate)) {
      period = "Yesterday";
    } else if (
      isThisWeek(logDate) &&
      !isToday(logDate) &&
      !isYesterday(logDate)
    ) {
      period = "This Week";
    } else if (isSameWeek(logDate, subWeeks(today, 1))) {
      period = "Last Week";
    } else {
      period = "Earlier";
    }

    if (!groups.has(period)) {
      groups.set(period, []);
    }
    groups.get(period)!.push(log);
  });

  // Convert to array and order periods
  const periodOrder = ["Today", "Yesterday", "This Week", "Last Week", "Earlier"];
  return periodOrder
    .filter((period) => groups.has(period))
    .map((period) => ({
      period,
      logs: groups.get(period)!,
    }));
}

export function DailyLogsTimeline({
  logs,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  currentUserId,
  teamMembers,
  onEdit,
  onDelete,
  onPhotoClick,
  onCardClick,
  isLoadingMore = false,
  noResults = false,
  onClearFilters,
}: DailyLogsTimelineProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Infinite scroll
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore || !onLoadMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, isLoadingMore, onLoadMore]);

  // Check if user can edit/delete log
  const canEditLog = useCallback(
    (log: DailyLogWithRelations): boolean => {
      if (!currentUserId) return false;
      // Can edit if created by user or if user is assigned
      return (
        log.createdById === currentUserId || log.assignedToId === currentUserId
      );
    },
    [currentUserId]
  );

  const canDeleteLog = useCallback(
    (log: DailyLogWithRelations): boolean => {
      if (!currentUserId) return false;
      // Can delete if created by user
      return log.createdById === currentUserId;
    },
    [currentUserId]
  );

  // Loading skeleton
  if (isLoading && logs.length === 0) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="hidden md:block w-48">
              <Skeleton width={150} height={20} />
            </div>
            <div className="w-4">
              <Skeleton circle width={16} height={16} />
            </div>
            <div className="flex-1">
              <Skeleton height={200} className="rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // No results after filtering
  if (noResults && logs.length === 0) {
    return (
      <EmptyState
        type="no-results"
        onAction={onClearFilters}
        actionText="Clear Filters"
      />
    );
  }

  // Empty state (no logs at all)
  if (logs.length === 0) {
    return null; // Parent component should show empty state with "Create" button
  }

  const groupedLogs = groupLogsByPeriod(logs);

  return (
    <div className="space-y-8">
      {groupedLogs.map((group, groupIndex) => (
        <div key={group.period} className="space-y-6">
          {/* Period Header */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block w-48"></div>
            <h3 className="text-lg font-semibold text-gray-900">
              {group.period}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({group.logs.length})
              </span>
            </h3>
          </div>

          {/* Logs in this period */}
          {group.logs.map((log, logIndex) => {
            const isFirstInPeriod = logIndex === 0;
            const isLastInPeriod = logIndex === group.logs.length - 1;
            const isLastOverall =
              groupIndex === groupedLogs.length - 1 && isLastInPeriod;

            // Check if this is a new date (different from previous log)
            const previousLog = logIndex > 0 ? group.logs[logIndex - 1] : null;
            const isNewDate =
              !previousLog ||
              !isSameDay(new Date(log.date), new Date(previousLog.date));

            return (
              <div key={log.id}>
                {/* Date marker (only show for new dates) */}
                {isNewDate && (
                  <div className="mb-4">
                    <LogDateMarker
                      date={new Date(log.date)}
                      isFirst={groupIndex === 0 && logIndex === 0}
                      isLast={isLastOverall}
                    />
                  </div>
                )}

                {/* Log card */}
                <div className="flex gap-4">
                  {/* Desktop: Empty space for date column */}
                  <div className="hidden md:block w-48"></div>

                  {/* Timeline connector */}
                  <div className="relative flex justify-center">
                    <div className="w-0.5 bg-gray-300 absolute top-0 bottom-0"></div>
                  </div>

                  {/* Card */}
                  <div className="flex-1 pb-6">
                    <DailyLogCard
                      log={log}
                      currentUserId={currentUserId}
                      canEdit={canEditLog(log)}
                      canDelete={canDeleteLog(log)}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onPhotoClick={(photoUrl, index) => onPhotoClick?.(photoUrl, index, log)}
                      onClick={onCardClick}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={observerTarget} className="py-8">
          {isLoadingMore && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 text-gray-600">
                <svg
                  className="animate-spin h-5 w-5"
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
                <span className="text-sm">Loading more logs...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* End of logs message */}
      {!hasMore && logs.length > 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No more logs to load
        </div>
      )}
    </div>
  );
}
