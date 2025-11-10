"use client";

import React, { useState, useEffect } from "react";
import { validateAssignees } from "@/lib/task-types";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface TeamMemberSelectorProps {
  projectId: string;
  value: string[]; // Array of user IDs
  onChange: (assignees: string[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * TeamMemberSelector Component
 * Multi-select dropdown for assigning team members to tasks
 * Shows avatar, name, and role for each member
 */
export function TeamMemberSelector({
  projectId,
  value = [],
  onChange,
  disabled = false,
  className = "",
}: TeamMemberSelectorProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch project members
  useEffect(() => {
    async function fetchMembers() {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}/members`);

        if (!response.ok) {
          throw new Error("Failed to fetch team members");
        }

        const data = await response.json();
        setMembers(data.members || []);
      } catch (err: any) {
        console.error("Error fetching team members:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (projectId) {
      fetchMembers();
    }
  }, [projectId]);

  const toggleMember = (memberId: string) => {
    const newAssignees = value.includes(memberId)
      ? value.filter((id) => id !== memberId)
      : [...value, memberId];

    const validation = validateAssignees(newAssignees);
    if (!validation.valid) {
      setError(validation.error || "Invalid assignees");
      return;
    }

    onChange(newAssignees);
    setError(null);
  };

  const removeMember = (memberId: string) => {
    onChange(value.filter((id) => id !== memberId));
  };

  const selectedMembers = members.filter((m) => value.includes(m.id));
  const unselectedMembers = members.filter((m) => !value.includes(m.id));

  if (loading) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Assignees
        </label>
        <div className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md">
          <p className="text-sm text-gray-500">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Assignees
        <span className="text-xs text-gray-500 ml-2">
          ({value.length} selected)
        </span>
      </label>

      {/* Selected members display */}
      {selectedMembers.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-2 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#6BF178] text-[#121212] flex items-center justify-center text-xs font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name */}
              <span className="text-gray-700 dark:text-gray-300">
                {member.name}
              </span>

              {/* Remove button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeMember(member.id)}
                  className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full p-1 transition-colors"
                  aria-label={`Remove ${member.name}`}
                >
                  <svg
                    className="w-3 h-3 text-gray-500"
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
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => !disabled && setShowDropdown(!showDropdown)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-left bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-between"
      >
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {selectedMembers.length === 0
            ? "Select team members..."
            : "Add more team members..."}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {/* Dropdown menu */}
      {showDropdown && (
        <>
          {/* Backdrop to close dropdown */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown content */}
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-64 overflow-y-auto">
            {unselectedMembers.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                All team members are already assigned
              </div>
            ) : (
              <div className="p-2">
                {unselectedMembers.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      toggleMember(member.id);
                      // Keep dropdown open for multi-select
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#6BF178] text-[#121212] flex items-center justify-center text-sm font-medium">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name and role */}
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {member.role}
                      </p>
                    </div>

                    {/* Checkmark if selected */}
                    {value.includes(member.id) && (
                      <svg
                        className="w-5 h-5 text-[#6BF178]"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * AssigneeList Component
 * Display-only list of assignees with avatars (for read-only views)
 */
export function AssigneeList({
  assignees,
  maxDisplay = 5,
}: {
  assignees: TeamMember[];
  maxDisplay?: number;
}) {
  if (assignees.length === 0) return null;

  const displayAssignees = assignees.slice(0, maxDisplay);
  const remainingCount = assignees.length - maxDisplay;

  return (
    <div className="flex items-center -space-x-2">
      {displayAssignees.map((assignee) => (
        <div
          key={assignee.id}
          className="relative"
          title={`${assignee.name} (${assignee.role})`}
        >
          {assignee.avatarUrl ? (
            <img
              src={assignee.avatarUrl}
              alt={assignee.name}
              className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-[#6BF178] text-[#121212] flex items-center justify-center text-xs font-medium">
              {assignee.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
