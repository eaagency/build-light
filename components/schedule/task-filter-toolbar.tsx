"use client";

import React, { useState, useEffect } from "react";
import { TaskPhase } from "@prisma/client";
import { TaskFilters } from "@/lib/task-types";
import { TASK_PHASE_LABELS, TASK_PHASE_ORDER, getPhaseColor } from "@/lib/task-types";

interface TaskFilterToolbarProps {
  projectId: string;
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  className?: string;
}

interface TeamMember {
  id: string;
  name: string;
}

/**
 * TaskFilterToolbar Component
 * Comprehensive filtering toolbar for tasks
 * Filters: Phase, Tags, Assignee, Status (OR logic within each category)
 * State persists when switching views
 */
export function TaskFilterToolbar({
  projectId,
  filters,
  onFiltersChange,
  className = "",
}: TaskFilterToolbarProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch team members for assignee filter
  useEffect(() => {
    async function fetchTeamMembers() {
      try {
        const response = await fetch(`/api/projects/${projectId}/members`);
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data.members || []);
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    }

    if (projectId) {
      fetchTeamMembers();
    }
  }, [projectId]);

  // Calculate active filter count
  const activeFilterCount =
    (filters.phases?.length || 0) +
    (filters.tags?.length || 0) +
    (filters.assignees?.length || 0) +
    (filters.status ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  // Toggle phase filter
  const togglePhase = (phase: TaskPhase) => {
    const currentPhases = filters.phases || [];
    const newPhases = currentPhases.includes(phase)
      ? currentPhases.filter((p) => p !== phase)
      : [...currentPhases, phase];

    onFiltersChange({
      ...filters,
      phases: newPhases.length > 0 ? newPhases : undefined,
    });
  };

  // Toggle tag filter
  const toggleTag = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    onFiltersChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  // Toggle assignee filter
  const toggleAssignee = (assigneeId: string) => {
    const currentAssignees = filters.assignees || [];
    const newAssignees = currentAssignees.includes(assigneeId)
      ? currentAssignees.filter((a) => a !== assigneeId)
      : [...currentAssignees, assigneeId];

    onFiltersChange({
      ...filters,
      assignees: newAssignees.length > 0 ? newAssignees : undefined,
    });
  };

  // Set status filter
  const setStatus = (status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE" | undefined) => {
    onFiltersChange({
      ...filters,
      status,
    });
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({
      phases: undefined,
      tags: undefined,
      assignees: undefined,
      status: undefined,
    });
  };

  return (
    <div className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Compact filter bar (always visible) */}
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Filter toggle button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-colors ${
              hasActiveFilters
                ? "border-[#6BF178] bg-[#6BF178] bg-opacity-10 text-[#6BF178]"
                : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
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
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="text-sm font-medium">Filter</span>
            {hasActiveFilters && (
              <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-[#6BF178] text-[#121212]">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              {filters.phases?.map((phase) => (
                <span
                  key={phase}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded-full"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getPhaseColor(phase) }}
                  />
                  {TASK_PHASE_LABELS[phase]}
                  <button
                    type="button"
                    onClick={() => togglePhase(phase)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}

              {filters.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}

              {filters.assignees?.map((assigneeId) => {
                const member = teamMembers.find((m) => m.id === assigneeId);
                return member ? (
                  <span
                    key={assigneeId}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded-full"
                  >
                    {member.name}
                    <button
                      type="button"
                      onClick={() => toggleAssignee(assigneeId)}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}

              {filters.status && (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded-full">
                  {filters.status === "NOT_STARTED" && "Not Started"}
                  {filters.status === "IN_PROGRESS" && "In Progress"}
                  {filters.status === "COMPLETE" && "Complete"}
                  <button
                    type="button"
                    onClick={() => setStatus(undefined)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Clear all button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expanded filter panel */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Phase filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phase
            </label>
            <div className="flex flex-wrap gap-2">
              {TASK_PHASE_ORDER.map((phase) => {
                const isSelected = filters.phases?.includes(phase) || false;
                return (
                  <button
                    key={phase}
                    type="button"
                    onClick={() => togglePhase(phase)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors ${
                      isSelected
                        ? "border-[#6BF178] bg-[#6BF178] bg-opacity-10 text-[#6BF178]"
                        : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getPhaseColor(phase) }}
                    />
                    {TASK_PHASE_LABELS[phase]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(["NOT_STARTED", "IN_PROGRESS", "COMPLETE"] as const).map((status) => {
                const isSelected = filters.status === status;
                const labels = {
                  NOT_STARTED: "Not Started",
                  IN_PROGRESS: "In Progress",
                  COMPLETE: "Complete",
                };
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatus(isSelected ? undefined : status)}
                    className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                      isSelected
                        ? "border-[#6BF178] bg-[#6BF178] bg-opacity-10 text-[#6BF178]"
                        : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {labels[status]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assignee filter */}
          {teamMembers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assignee
              </label>
              <div className="flex flex-wrap gap-2">
                {teamMembers.map((member) => {
                  const isSelected = filters.assignees?.includes(member.id) || false;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleAssignee(member.id)}
                      className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                        isSelected
                          ? "border-[#6BF178] bg-[#6BF178] bg-opacity-10 text-[#6BF178]"
                          : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      {member.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
