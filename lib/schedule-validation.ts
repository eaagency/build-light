/**
 * Schedule Validation Utilities
 * Validates task data before saving to prevent errors
 */

import { Task, TaskPhase } from "@prisma/client";
import { isAfter, isBefore, isValid, differenceInDays } from "date-fns";

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate a single task
 */
export function validateTask(
  task: Partial<Task>,
  allTasks: Task[] = []
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Required fields
  if (!task.name || task.name.trim().length === 0) {
    errors.push({
      field: "name",
      message: "Task name is required",
      severity: "error",
    });
  }

  if (task.name && task.name.length > 200) {
    errors.push({
      field: "name",
      message: "Task name must be 200 characters or less",
      severity: "error",
    });
  }

  // Date validation
  if (!task.startDate) {
    errors.push({
      field: "startDate",
      message: "Start date is required",
      severity: "error",
    });
  }

  if (!task.endDate) {
    errors.push({
      field: "endDate",
      message: "End date is required",
      severity: "error",
    });
  }

  if (task.startDate && task.endDate) {
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);

    // Check if dates are valid
    if (!isValid(startDate)) {
      errors.push({
        field: "startDate",
        message: "Start date is not a valid date",
        severity: "error",
      });
    }

    if (!isValid(endDate)) {
      errors.push({
        field: "endDate",
        message: "End date is not a valid date",
        severity: "error",
      });
    }

    // Check if start date is before end date
    if (isValid(startDate) && isValid(endDate)) {
      if (isAfter(startDate, endDate)) {
        errors.push({
          field: "endDate",
          message: "End date must be after start date",
          severity: "error",
        });
      }

      // Warn if task is very long
      const duration = differenceInDays(endDate, startDate);
      if (duration > 90) {
        warnings.push({
          field: "endDate",
          message: `Task duration is ${duration} days. Consider breaking it into smaller tasks.`,
          severity: "warning",
        });
      }

      // Warn if task is very short
      if (duration === 0) {
        warnings.push({
          field: "endDate",
          message: "Task has zero duration (same start and end date)",
          severity: "warning",
        });
      }
    }
  }

  // Phase validation
  if (task.phase) {
    const validPhases = Object.values(TaskPhase);
    if (!validPhases.includes(task.phase)) {
      errors.push({
        field: "phase",
        message: `Invalid phase. Must be one of: ${validPhases.join(", ")}`,
        severity: "error",
      });
    }
  }

  // Dependencies validation
  if (task.dependencies && task.dependencies.length > 0) {
    const taskMap = new Map(allTasks.map((t) => [t.id, t]));

    task.dependencies.forEach((depId) => {
      const dependency = taskMap.get(depId);

      if (!dependency) {
        errors.push({
          field: "dependencies",
          message: `Dependency task with ID ${depId} does not exist`,
          severity: "error",
        });
      } else {
        // Check for circular dependencies
        if (task.id && hasCircularDependency(task.id, depId, allTasks)) {
          errors.push({
            field: "dependencies",
            message: `Circular dependency detected with task: ${dependency.name}`,
            severity: "error",
          });
        }

        // Warn if dependent task starts before dependency ends
        if (
          task.startDate &&
          dependency.endDate &&
          isBefore(new Date(task.startDate), new Date(dependency.endDate))
        ) {
          warnings.push({
            field: "startDate",
            message: `Task starts before dependency "${dependency.name}" ends`,
            severity: "warning",
          });
        }
      }
    });
  }

  // Assignees validation
  if (task.assignees && task.assignees.length > 10) {
    warnings.push({
      field: "assignees",
      message: "Task has more than 10 assignees. Consider splitting the task.",
      severity: "warning",
    });
  }

  // Tags validation
  if (task.tags) {
    if (task.tags.length > 20) {
      errors.push({
        field: "tags",
        message: "Maximum 20 tags allowed per task",
        severity: "error",
      });
    }

    task.tags.forEach((tag) => {
      if (tag.length > 50) {
        errors.push({
          field: "tags",
          message: `Tag "${tag}" exceeds 50 characters`,
          severity: "error",
        });
      }
    });
  }

  // Color validation
  if (task.color) {
    const hexColorRegex = /^#[0-9A-F]{6}$/i;
    if (!hexColorRegex.test(task.color)) {
      errors.push({
        field: "color",
        message: "Color must be a valid hex color (e.g., #FF5733)",
        severity: "error",
      });
    }
  }

  // Notes validation
  if (task.notes && task.notes.length > 5000) {
    errors.push({
      field: "notes",
      message: "Notes must be 5000 characters or less",
      severity: "error",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate multiple tasks (batch validation)
 */
export function validateTasks(tasks: Partial<Task>[]): ValidationResult {
  const allErrors: ValidationError[] = [];
  const allWarnings: ValidationError[] = [];

  // Check for duplicate task names
  const nameMap = new Map<string, number>();
  tasks.forEach((task, index) => {
    if (task.name) {
      const count = nameMap.get(task.name) || 0;
      nameMap.set(task.name, count + 1);
    }
  });

  nameMap.forEach((count, name) => {
    if (count > 1) {
      allWarnings.push({
        field: "name",
        message: `Duplicate task name: "${name}" appears ${count} times`,
        severity: "warning",
      });
    }
  });

  // Validate each task
  tasks.forEach((task, index) => {
    const result = validateTask(task, tasks as Task[]);
    result.errors.forEach((error) => {
      allErrors.push({
        ...error,
        field: `Task ${index + 1}: ${error.field}`,
      });
    });
    result.warnings.forEach((warning) => {
      allWarnings.push({
        ...warning,
        field: `Task ${index + 1}: ${warning.field}`,
      });
    });
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Check for circular dependencies
 */
function hasCircularDependency(
  taskId: string,
  dependencyId: string,
  allTasks: Task[]
): boolean {
  const taskMap = new Map(allTasks.map((t) => [t.id, t]));
  const visited = new Set<string>();

  function dfs(currentId: string): boolean {
    if (currentId === taskId) {
      return true; // Circular dependency found
    }

    if (visited.has(currentId)) {
      return false; // Already visited, no cycle
    }

    visited.add(currentId);

    const currentTask = taskMap.get(currentId);
    if (!currentTask || !currentTask.dependencies) {
      return false;
    }

    for (const depId of currentTask.dependencies) {
      if (dfs(depId)) {
        return true;
      }
    }

    return false;
  }

  return dfs(dependencyId);
}

/**
 * Validate schedule settings
 */
export function validateScheduleSettings(settings: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (settings.workdayStart && settings.workdayEnd) {
    const start = parseInt(settings.workdayStart);
    const end = parseInt(settings.workdayEnd);

    if (start < 0 || start > 23) {
      errors.push({
        field: "workdayStart",
        message: "Workday start must be between 0 and 23",
        severity: "error",
      });
    }

    if (end < 0 || end > 23) {
      errors.push({
        field: "workdayEnd",
        message: "Workday end must be between 0 and 23",
        severity: "error",
      });
    }

    if (start >= end) {
      errors.push({
        field: "workdayEnd",
        message: "Workday end must be after workday start",
        severity: "error",
      });
    }
  }

  if (settings.weekends && Array.isArray(settings.weekends)) {
    const validDays = [0, 1, 2, 3, 4, 5, 6];
    settings.weekends.forEach((day: number) => {
      if (!validDays.includes(day)) {
        errors.push({
          field: "weekends",
          message: `Invalid weekend day: ${day}. Must be 0-6 (Sunday-Saturday)`,
          severity: "error",
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string {
  const messages: string[] = [];

  if (result.errors.length > 0) {
    messages.push("Errors:");
    result.errors.forEach((error) => {
      messages.push(`  • ${error.field}: ${error.message}`);
    });
  }

  if (result.warnings.length > 0) {
    if (messages.length > 0) messages.push("");
    messages.push("Warnings:");
    result.warnings.forEach((warning) => {
      messages.push(`  • ${warning.field}: ${warning.message}`);
    });
  }

  return messages.join("\n");
}
