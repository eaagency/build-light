/**
 * useScheduleKeyboardShortcuts Hook
 * Manages keyboard shortcuts for schedule operations
 */

import { useEffect, useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";

export interface ScheduleKeyboardShortcutsHandlers {
  onNew?: () => void;
  onDelete?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onToggleCriticalPath?: () => void;
  onToggleBaseline?: () => void;
  onExport?: () => void;
  onSearch?: () => void;
  onSelectAll?: () => void;
  onEscape?: () => void;
}

export interface KeyboardShortcut {
  keys: string;
  description: string;
  action: string;
}

/**
 * useScheduleKeyboardShortcuts Hook
 * Sets up keyboard shortcuts for schedule operations
 */
export function useScheduleKeyboardShortcuts(
  handlers: ScheduleKeyboardShortcutsHandlers,
  enabled: boolean = true
) {
  const options = { enabled };

  // Create new task: Ctrl/Cmd + N
  useHotkeys(
    "ctrl+n, cmd+n",
    (e) => {
      e.preventDefault();
      handlers.onNew?.();
    },
    options,
    [handlers.onNew]
  );

  // Delete selected task: Delete or Backspace
  useHotkeys(
    "del, backspace",
    (e) => {
      // Only trigger if not in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      e.preventDefault();
      handlers.onDelete?.();
    },
    options,
    [handlers.onDelete]
  );

  // Undo: Ctrl/Cmd + Z
  useHotkeys(
    "ctrl+z, cmd+z",
    (e) => {
      e.preventDefault();
      handlers.onUndo?.();
    },
    options,
    [handlers.onUndo]
  );

  // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
  useHotkeys(
    "ctrl+shift+z, cmd+shift+z, ctrl+y, cmd+y",
    (e) => {
      e.preventDefault();
      handlers.onRedo?.();
    },
    options,
    [handlers.onRedo]
  );

  // Save: Ctrl/Cmd + S
  useHotkeys(
    "ctrl+s, cmd+s",
    (e) => {
      e.preventDefault();
      handlers.onSave?.();
    },
    options,
    [handlers.onSave]
  );

  // Toggle critical path: Ctrl/Cmd + K
  useHotkeys(
    "ctrl+k, cmd+k",
    (e) => {
      e.preventDefault();
      handlers.onToggleCriticalPath?.();
    },
    options,
    [handlers.onToggleCriticalPath]
  );

  // Toggle baseline: Ctrl/Cmd + B
  useHotkeys(
    "ctrl+b, cmd+b",
    (e) => {
      e.preventDefault();
      handlers.onToggleBaseline?.();
    },
    options,
    [handlers.onToggleBaseline]
  );

  // Export: Ctrl/Cmd + E
  useHotkeys(
    "ctrl+e, cmd+e",
    (e) => {
      e.preventDefault();
      handlers.onExport?.();
    },
    options,
    [handlers.onExport]
  );

  // Search: Ctrl/Cmd + F
  useHotkeys(
    "ctrl+f, cmd+f",
    (e) => {
      e.preventDefault();
      handlers.onSearch?.();
    },
    options,
    [handlers.onSearch]
  );

  // Select all: Ctrl/Cmd + A
  useHotkeys(
    "ctrl+a, cmd+a",
    (e) => {
      // Only trigger if not in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      e.preventDefault();
      handlers.onSelectAll?.();
    },
    options,
    [handlers.onSelectAll]
  );

  // Escape: Clear selection / Close modal
  useHotkeys(
    "esc",
    (e) => {
      handlers.onEscape?.();
    },
    options,
    [handlers.onEscape]
  );
}

/**
 * Get list of available keyboard shortcuts
 */
export function getScheduleKeyboardShortcuts(): KeyboardShortcut[] {
  const isMac =
    typeof navigator !== "undefined" &&
    navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const modifier = isMac ? "⌘" : "Ctrl";

  return [
    {
      keys: `${modifier} + N`,
      description: "Create new task",
      action: "new",
    },
    {
      keys: "Delete",
      description: "Delete selected task",
      action: "delete",
    },
    {
      keys: `${modifier} + Z`,
      description: "Undo last action",
      action: "undo",
    },
    {
      keys: `${modifier} + Shift + Z`,
      description: "Redo last action",
      action: "redo",
    },
    {
      keys: `${modifier} + S`,
      description: "Save changes",
      action: "save",
    },
    {
      keys: `${modifier} + K`,
      description: "Toggle critical path",
      action: "toggleCriticalPath",
    },
    {
      keys: `${modifier} + B`,
      description: "Toggle baseline view",
      action: "toggleBaseline",
    },
    {
      keys: `${modifier} + E`,
      description: "Export schedule",
      action: "export",
    },
    {
      keys: `${modifier} + F`,
      description: "Search tasks",
      action: "search",
    },
    {
      keys: `${modifier} + A`,
      description: "Select all tasks",
      action: "selectAll",
    },
    {
      keys: "Esc",
      description: "Clear selection / Close modal",
      action: "escape",
    },
  ];
}

/**
 * Keyboard Shortcuts Help Component
 */
export function KeyboardShortcutsHelp() {
  const shortcuts = getScheduleKeyboardShortcuts();

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-lg font-semibold text-primary mb-3">
        Keyboard Shortcuts
      </h3>
      <div className="space-y-2">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.action}
            className="flex items-center justify-between py-2 border-b border-border last:border-0"
          >
            <span className="text-sm text-foreground">
              {shortcut.description}
            </span>
            <kbd className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-mono">
              {shortcut.keys}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Keyboard Shortcuts Button (opens help modal)
 */
export function KeyboardShortcutsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
      title="Keyboard Shortcuts"
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
          d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <span className="hidden sm:inline">Shortcuts</span>
    </button>
  );
}

/**
 * Keyboard Shortcuts Modal
 */
export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Keyboard Shortcuts
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          {/* Content */}
          <KeyboardShortcutsHelp />

          {/* Footer */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
