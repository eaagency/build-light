/**
 * useScheduleUndoRedo Hook
 * Manages undo/redo functionality for schedule operations
 *
 * Based on the Command Pattern
 */

import { useState, useCallback, useRef } from "react";
import { Task } from "@prisma/client";

/**
 * Command interface
 * Each command represents a reversible action
 */
export interface Command {
  execute(): void;
  undo(): void;
  description: string;
}

/**
 * Command types
 */
export type CommandType =
  | "create"
  | "update"
  | "delete"
  | "move"
  | "dependency"
  | "bulk";

/**
 * Hook state
 */
interface UndoRedoState {
  past: Command[];
  future: Command[];
  maxHistorySize: number;
}

/**
 * Hook return type
 */
interface UseScheduleUndoRedoReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  execute: (command: Command) => void;
  clear: () => void;
  getHistory: () => string[];
}

/**
 * useScheduleUndoRedo Hook
 */
export function useScheduleUndoRedo(
  maxHistorySize: number = 10
): UseScheduleUndoRedoReturn {
  const [state, setState] = useState<UndoRedoState>({
    past: [],
    future: [],
    maxHistorySize,
  });

  /**
   * Execute a command and add it to history
   */
  const execute = useCallback(
    (command: Command) => {
      // Execute the command
      command.execute();

      // Add to history
      setState((prev) => {
        const newPast = [...prev.past, command];

        // Limit history size
        if (newPast.length > maxHistorySize) {
          newPast.shift();
        }

        return {
          ...prev,
          past: newPast,
          future: [], // Clear future when new command is executed
        };
      });
    },
    [maxHistorySize]
  );

  /**
   * Undo the last command
   */
  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;

      const command = prev.past[prev.past.length - 1];
      command.undo();

      return {
        ...prev,
        past: prev.past.slice(0, -1),
        future: [command, ...prev.future],
      };
    });
  }, []);

  /**
   * Redo the last undone command
   */
  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;

      const command = prev.future[0];
      command.execute();

      return {
        ...prev,
        past: [...prev.past, command],
        future: prev.future.slice(1),
      };
    });
  }, []);

  /**
   * Clear history
   */
  const clear = useCallback(() => {
    setState((prev) => ({
      ...prev,
      past: [],
      future: [],
    }));
  }, []);

  /**
   * Get history descriptions
   */
  const getHistory = useCallback(() => {
    return state.past.map((cmd) => cmd.description);
  }, [state.past]);

  return {
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    undo,
    redo,
    execute,
    clear,
    getHistory,
  };
}

/**
 * Command factory functions
 */

/**
 * Create Task Command
 */
export function createTaskCommand(
  task: Partial<Task>,
  onCreate: (task: Partial<Task>) => void,
  onDelete: (taskId: string) => void
): Command {
  let createdTaskId: string | null = null;

  return {
    execute: () => {
      onCreate(task);
      // Note: In real implementation, onCreate should return the created task ID
    },
    undo: () => {
      if (createdTaskId) {
        onDelete(createdTaskId);
      }
    },
    description: `Create task: ${task.name}`,
  };
}

/**
 * Update Task Command
 */
export function updateTaskCommand(
  taskId: string,
  oldData: Partial<Task>,
  newData: Partial<Task>,
  onUpdate: (taskId: string, data: Partial<Task>) => void
): Command {
  return {
    execute: () => {
      onUpdate(taskId, newData);
    },
    undo: () => {
      onUpdate(taskId, oldData);
    },
    description: `Update task: ${oldData.name || taskId}`,
  };
}

/**
 * Delete Task Command
 */
export function deleteTaskCommand(
  task: Task,
  onDelete: (taskId: string) => void,
  onCreate: (task: Partial<Task>) => void
): Command {
  return {
    execute: () => {
      onDelete(task.id);
    },
    undo: () => {
      onCreate(task);
    },
    description: `Delete task: ${task.name}`,
  };
}

/**
 * Move Task Command (change dates)
 */
export function moveTaskCommand(
  taskId: string,
  taskName: string,
  oldDates: { startDate: Date; endDate: Date },
  newDates: { startDate: Date; endDate: Date },
  onUpdate: (taskId: string, data: Partial<Task>) => void
): Command {
  return {
    execute: () => {
      onUpdate(taskId, {
        startDate: newDates.startDate,
        endDate: newDates.endDate,
      });
    },
    undo: () => {
      onUpdate(taskId, {
        startDate: oldDates.startDate,
        endDate: oldDates.endDate,
      });
    },
    description: `Move task: ${taskName}`,
  };
}

/**
 * Add Dependency Command
 */
export function addDependencyCommand(
  taskId: string,
  taskName: string,
  dependencyId: string,
  onUpdate: (taskId: string, data: Partial<Task>) => void,
  getCurrentDependencies: (taskId: string) => string[]
): Command {
  const oldDependencies = getCurrentDependencies(taskId);
  const newDependencies = [...oldDependencies, dependencyId];

  return {
    execute: () => {
      onUpdate(taskId, { dependencies: newDependencies });
    },
    undo: () => {
      onUpdate(taskId, { dependencies: oldDependencies });
    },
    description: `Add dependency to: ${taskName}`,
  };
}

/**
 * Remove Dependency Command
 */
export function removeDependencyCommand(
  taskId: string,
  taskName: string,
  dependencyId: string,
  onUpdate: (taskId: string, data: Partial<Task>) => void,
  getCurrentDependencies: (taskId: string) => string[]
): Command {
  const oldDependencies = getCurrentDependencies(taskId);
  const newDependencies = oldDependencies.filter((id) => id !== dependencyId);

  return {
    execute: () => {
      onUpdate(taskId, { dependencies: newDependencies });
    },
    undo: () => {
      onUpdate(taskId, { dependencies: oldDependencies });
    },
    description: `Remove dependency from: ${taskName}`,
  };
}

/**
 * Bulk Update Command
 */
export function bulkUpdateCommand(
  tasks: Array<{ id: string; oldData: Partial<Task>; newData: Partial<Task> }>,
  onUpdate: (taskId: string, data: Partial<Task>) => void
): Command {
  return {
    execute: () => {
      tasks.forEach(({ id, newData }) => {
        onUpdate(id, newData);
      });
    },
    undo: () => {
      tasks.forEach(({ id, oldData }) => {
        onUpdate(id, oldData);
      });
    },
    description: `Bulk update ${tasks.length} tasks`,
  };
}

/**
 * Bulk Delete Command
 */
export function bulkDeleteCommand(
  tasks: Task[],
  onDelete: (taskId: string) => void,
  onCreate: (task: Partial<Task>) => void
): Command {
  return {
    execute: () => {
      tasks.forEach((task) => {
        onDelete(task.id);
      });
    },
    undo: () => {
      tasks.forEach((task) => {
        onCreate(task);
      });
    },
    description: `Bulk delete ${tasks.length} tasks`,
  };
}
