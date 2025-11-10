"use client";

import React, { useState } from "react";
import { CreateTaskModal } from "./create-task-modal";

interface AddTaskButtonProps {
  projectId: string;
  scheduleId: string;
  onTaskCreated?: (task: any) => void;
  className?: string;
}

/**
 * AddTaskButton Component
 * Floating Action Button (FAB) in bottom-right corner
 * Opens CreateTaskModal when clicked
 * BuildLight Green (#6BF178) background with plus icon
 */
export function AddTaskButton({
  projectId,
  scheduleId,
  onTaskCreated,
  className = "",
}: AddTaskButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskCreated = (task: any) => {
    setIsModalOpen(false);
    if (onTaskCreated) {
      onTaskCreated(task);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#6BF178] rounded-full shadow-lg hover:shadow-xl hover:bg-[#5ae067] active:scale-95 transition-all duration-200 flex items-center justify-center group ${className}`}
        aria-label="Add new task"
        title="Add new task"
      >
        {/* Plus icon */}
        <svg
          className="w-6 h-6 text-[#121212] group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            d="M12 4v16m8-8H4"
          />
        </svg>

        {/* Pulse animation on hover */}
        <span className="absolute inset-0 rounded-full bg-[#6BF178] opacity-0 group-hover:opacity-30 group-hover:animate-ping" />
      </button>

      {/* Create Task Modal */}
      <CreateTaskModal
        projectId={projectId}
        scheduleId={scheduleId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </>
  );
}

/**
 * AddTaskButtonWithTooltip Component
 * Extended version with tooltip on hover
 */
export function AddTaskButtonWithTooltip({
  projectId,
  scheduleId,
  onTaskCreated,
  className = "",
}: AddTaskButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleTaskCreated = (task: any) => {
    setIsModalOpen(false);
    if (onTaskCreated) {
      onTaskCreated(task);
    }
  };

  return (
    <>
      {/* Floating Action Button with Tooltip */}
      <div className="fixed bottom-6 right-6 z-40">
        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-md shadow-lg whitespace-nowrap animate-fade-in">
            Add New Task
            {/* Arrow */}
            <div className="absolute top-full right-6 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsModalOpen(true)}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className={`w-14 h-14 bg-[#6BF178] rounded-full shadow-lg hover:shadow-xl hover:bg-[#5ae067] active:scale-95 transition-all duration-200 flex items-center justify-center group ${className}`}
          aria-label="Add new task"
        >
          {/* Plus icon */}
          <svg
            className="w-6 h-6 text-[#121212] group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>

          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-[#6BF178] opacity-0 group-hover:opacity-30 group-hover:animate-ping" />
        </button>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        projectId={projectId}
        scheduleId={scheduleId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </>
  );
}

/**
 * AddTaskInlineButton Component
 * Inline button version (not floating) for use in toolbars or headers
 */
export function AddTaskInlineButton({
  projectId,
  scheduleId,
  onTaskCreated,
  className = "",
}: AddTaskButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskCreated = (task: any) => {
    setIsModalOpen(false);
    if (onTaskCreated) {
      onTaskCreated(task);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`px-4 py-2 bg-[#6BF178] text-[#121212] rounded-md hover:bg-[#5ae067] active:scale-95 transition-all duration-200 flex items-center gap-2 font-medium shadow-sm ${className}`}
      >
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
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Task
      </button>

      {/* Create Task Modal */}
      <CreateTaskModal
        projectId={projectId}
        scheduleId={scheduleId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </>
  );
}
