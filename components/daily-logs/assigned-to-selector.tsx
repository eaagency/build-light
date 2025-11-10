"use client";

import React from "react";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface AssignedToSelectorProps {
  value: string | null;
  onChange: (userId: string) => void;
  teamMembers: TeamMember[];
  error?: string;
  disabled?: boolean;
}

/**
 * AssignedToSelector Component
 * Dropdown for selecting PM/Lead responsible for log
 *
 * Features:
 * - Shows only PROJECT_MANAGER and FIELD_WORKER roles
 * - Displays name, role badge
 * - Required field
 */
export function AssignedToSelector({
  value,
  onChange,
  teamMembers,
  error,
  disabled = false,
}: AssignedToSelectorProps) {
  // Filter to PM and Field Worker roles only
  const eligibleMembers = teamMembers.filter((member) =>
    ["PROJECT_MANAGER", "FIELD_WORKER", "OWNER"].includes(member.role)
  );

  return (
    <div className="space-y-2">
      <label
        htmlFor="assigned-to"
        className="block text-sm font-medium text-gray-900 dark:text-white"
      >
        Project Manager / Lead <span className="text-red-500">*</span>
      </label>

      <select
        id="assigned-to"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 text-base bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#6BF178] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontSize: "16px" }} // Prevent iOS zoom
      >
        <option value="">Select a team member...</option>
        {eligibleMembers.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name || member.email} ({member.role.replace("_", " ")})
          </option>
        ))}
      </select>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Select the project manager or lead responsible for this daily log
      </p>
    </div>
  );
}
