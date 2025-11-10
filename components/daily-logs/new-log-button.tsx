"use client";

import React from "react";

interface NewDailyLogButtonProps {
  onClick: () => void;
  mobile?: boolean;
}

/**
 * NewDailyLogButton Component
 * Button to open daily log creation modal
 *
 * Features:
 * - Desktop: Regular button in header
 * - Mobile: FAB (Floating Action Button) bottom-right
 * - BuildLight Green color
 */
export function NewDailyLogButton({ onClick, mobile = false }: NewDailyLogButtonProps) {
  if (mobile) {
    // Mobile: Floating Action Button
    return (
      <button
        type="button"
        onClick={onClick}
        className="fixed bottom-6 right-6 md:hidden w-14 h-14 bg-[#6BF178] text-gray-900 rounded-full shadow-lg hover:bg-[#5DE068] active:scale-95 transition-transform flex items-center justify-center z-30"
        aria-label="Create Daily Log"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    );
  }

  // Desktop: Regular button
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden md:flex items-center gap-2 px-4 py-2 bg-[#6BF178] text-gray-900 rounded-lg hover:bg-[#5DE068] font-medium transition-colors"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      New Daily Log
    </button>
  );
}
