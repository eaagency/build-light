"use client";

import React, { useState, useRef, KeyboardEvent } from "react";
import { COMMON_TASK_TAGS, validateTags } from "@/lib/task-types";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  className?: string;
  maxTags?: number;
}

/**
 * TagInput Component
 * Multi-select tag input with common tag suggestions and custom tag support
 * Max 10 tags per task
 */
export function TagInput({
  value = [],
  onChange,
  disabled = false,
  className = "",
  maxTags = 10,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter suggestions based on input and already selected tags
  const filteredSuggestions = COMMON_TASK_TAGS.filter(
    (tag) =>
      !value.includes(tag) &&
      tag.toLowerCase().includes(inputValue.toLowerCase())
  );

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;

    // Check if tag already exists (case-insensitive)
    if (value.some((t) => t.toLowerCase() === trimmedTag.toLowerCase())) {
      setError("Tag already exists");
      return;
    }

    const newTags = [...value, trimmedTag];
    const validation = validateTags(newTags);

    if (!validation.valid) {
      setError(validation.error || "Invalid tags");
      return;
    }

    onChange(newTags);
    setInputValue("");
    setError(null);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      // Remove last tag on backspace if input is empty
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setInputValue("");
    }
  };

  const handleSuggestionClick = (tag: string) => {
    addTag(tag);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const isMaxTagsReached = value.length >= maxTags;

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Tags
        <span className="text-xs text-gray-500 ml-2">
          ({value.length}/{maxTags})
        </span>
      </label>

      <div className="min-h-[42px] px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-[#6BF178] focus-within:border-[#6BF178] dark:bg-gray-800">
        {/* Selected tags */}
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[#6BF178] text-[#121212] rounded-full"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:bg-[#121212] hover:text-[#6BF178] rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${tag} tag`}
                >
                  <svg
                    className="w-3 h-3"
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
            </span>
          ))}
        </div>

        {/* Input field */}
        {!isMaxTagsReached && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay to allow clicking suggestions
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            disabled={disabled}
            placeholder={value.length === 0 ? "Type a tag and press Enter..." : "Add another tag..."}
            className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm dark:text-white placeholder-gray-400"
          />
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {/* Tag suggestions dropdown */}
      {showSuggestions && inputValue && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
          <div className="p-2">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">
              Suggested tags:
            </p>
            {filteredSuggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSuggestionClick(tag)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors dark:text-white"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Common tags (show when input is empty) */}
      {!showSuggestions && value.length === 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Common tags:
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_TASK_TAGS.slice(0, 5).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                disabled={disabled || isMaxTagsReached}
                className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-300"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Max tags reached message */}
      {isMaxTagsReached && (
        <p className="mt-1 text-xs text-gray-500">
          Maximum {maxTags} tags reached
        </p>
      )}
    </div>
  );
}

/**
 * TagList Component
 * Display-only list of tags (for read-only views)
 */
export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
