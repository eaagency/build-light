/**
 * Task Utilities for BuildLight
 *
 * Provides workday calculations, dependency validation, and task management utilities.
 */

import {
  addBusinessDays,
  differenceInBusinessDays,
  isWeekend,
  format,
  parseISO,
} from "date-fns";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * US Federal Holidays for 2025-2026
 * Format: MM-DD
 */
export const US_HOLIDAYS = [
  // 2025
  "01-01", // New Year's Day
  "01-20", // Martin Luther King Jr. Day
  "02-17", // Presidents' Day
  "05-26", // Memorial Day
  "07-04", // Independence Day
  "09-01", // Labor Day
  "10-13", // Columbus Day
  "11-11", // Veterans Day
  "11-27", // Thanksgiving
  "12-25", // Christmas Day
  // 2026
  "01-01", // New Year's Day
  "01-19", // Martin Luther King Jr. Day
  "02-16", // Presidents' Day
  "05-25", // Memorial Day
  "07-03", // Independence Day (observed)
  "09-07", // Labor Day
  "10-12", // Columbus Day
  "11-11", // Veterans Day
  "11-26", // Thanksgiving
  "12-25", // Christmas Day
];

/**
 * Default phase colors for construction phases
 * Matches TaskPhase enum from Prisma schema
 */
export const PHASE_COLORS: Record<string, string> = {
  PLANNING: "#9CA3AF", // Gray
  DESIGN: "#F59E0B", // Amber
  PERMITS: "#DC2626", // Red
  FOUNDATION: "#2563EB", // Blue
  FRAMING: "#059669", // Green
  ELECTRICAL: "#7C3AED", // Purple
  PLUMBING: "#EC4899", // Pink
  HVAC: "#06B6D4", // Cyan
  INSULATION: "#8B5CF6", // Violet
  DRYWALL: "#10B981", // Emerald
  FINISHING: "#F97316", // Orange
  LANDSCAPING: "#14B8A6", // Teal
  INSPECTION: "#6366F1", // Indigo
  CLOSEOUT: "#EF4444", // Red
};

// ============================================================================
// WORKDAY CALCULATIONS
// ============================================================================

/**
 * Check if a date is a US holiday
 */
export function isUSHoliday(date: Date): boolean {
  const monthDay = format(date, "MM-dd");
  return US_HOLIDAYS.includes(monthDay);
}

/**
 * Check if a date is a workday (not weekend, not holiday)
 */
export function isWorkday(date: Date): boolean {
  return !isWeekend(date) && !isUSHoliday(date);
}

/**
 * Calculate the number of workdays between two dates
 * Excludes weekends and US holidays
 *
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Number of workdays
 */
export function calculateWorkdays(startDate: Date, endDate: Date): number {
  // Start with business days (excludes weekends)
  let workdays = differenceInBusinessDays(endDate, startDate) + 1; // +1 to include end date

  // Subtract holidays that fall on weekdays
  const start = new Date(startDate);
  const end = new Date(endDate);

  let currentDate = new Date(start);
  while (currentDate <= end) {
    if (!isWeekend(currentDate) && isUSHoliday(currentDate)) {
      workdays--;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return Math.max(0, workdays);
}

/**
 * Add workdays to a date (excluding weekends and holidays)
 *
 * @param startDate - Starting date
 * @param workdays - Number of workdays to add
 * @returns New date after adding workdays
 */
export function addWorkdays(startDate: Date, workdays: number): Date {
  let date = new Date(startDate);
  let remaining = workdays;

  while (remaining > 0) {
    date = addBusinessDays(date, 1);

    // Check if this date is a holiday
    if (!isUSHoliday(date)) {
      remaining--;
    }
  }

  return date;
}

/**
 * Calculate end date from start date and duration in workdays
 *
 * @param startDate - Task start date
 * @param durationInWorkdays - Duration in workdays
 * @returns End date
 */
export function calculateEndDate(
  startDate: Date,
  durationInWorkdays: number
): Date {
  if (durationInWorkdays <= 0) {
    return startDate;
  }

  // Subtract 1 because start date counts as first workday
  return addWorkdays(startDate, durationInWorkdays - 1);
}

// ============================================================================
// DEPENDENCY VALIDATION
// ============================================================================

/**
 * Task with dependencies for validation
 */
export interface TaskWithDependencies {
  id: string;
  dependencies: string[];
}

/**
 * Detect circular dependencies in a task graph
 *
 * @param taskId - Task ID to check
 * @param tasks - All tasks with their dependencies
 * @param visited - Set of visited task IDs (for recursion)
 * @param recursionStack - Set of tasks in current recursion path
 * @returns true if circular dependency detected, false otherwise
 */
export function hasCircularDependency(
  taskId: string,
  tasks: TaskWithDependencies[],
  visited: Set<string> = new Set(),
  recursionStack: Set<string> = new Set()
): boolean {
  // Add current task to recursion stack
  visited.add(taskId);
  recursionStack.add(taskId);

  // Find the task
  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    // Task not found, no circular dependency
    recursionStack.delete(taskId);
    return false;
  }

  // Check all dependencies
  for (const depId of task.dependencies || []) {
    // If dependency is in recursion stack, we have a cycle
    if (recursionStack.has(depId)) {
      return true;
    }

    // If not visited, recursively check
    if (!visited.has(depId)) {
      if (hasCircularDependency(depId, tasks, visited, recursionStack)) {
        return true;
      }
    }
  }

  // Remove from recursion stack after checking all dependencies
  recursionStack.delete(taskId);
  return false;
}

/**
 * Validate all task dependencies in a schedule
 * Checks for circular dependencies and invalid task IDs
 *
 * @param tasks - All tasks in the schedule
 * @returns Validation result
 */
export function validateTaskDependencies(
  tasks: TaskWithDependencies[]
): {
  valid: boolean;
  error?: string;
  circularPath?: string[];
} {
  const taskIds = new Set(tasks.map((t) => t.id));

  // Check for invalid dependency IDs
  for (const task of tasks) {
    for (const depId of task.dependencies || []) {
      if (!taskIds.has(depId)) {
        return {
          valid: false,
          error: `Task "${task.id}" has invalid dependency "${depId}" - task does not exist`,
        };
      }
    }
  }

  // Check for circular dependencies
  for (const task of tasks) {
    if (hasCircularDependency(task.id, tasks)) {
      return {
        valid: false,
        error: `Circular dependency detected involving task "${task.id}"`,
        circularPath: findCircularPath(task.id, tasks),
      };
    }
  }

  return { valid: true };
}

/**
 * Find the circular dependency path for error reporting
 *
 * @param startTaskId - Starting task ID
 * @param tasks - All tasks
 * @returns Array of task IDs forming the cycle
 */
function findCircularPath(
  startTaskId: string,
  tasks: TaskWithDependencies[]
): string[] {
  const path: string[] = [];
  const visited = new Set<string>();

  function dfs(taskId: string): boolean {
    if (path.includes(taskId)) {
      // Found cycle, trim path to only include cycle
      const cycleStart = path.indexOf(taskId);
      return true;
    }

    if (visited.has(taskId)) {
      return false;
    }

    visited.add(taskId);
    path.push(taskId);

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      for (const depId of task.dependencies || []) {
        if (dfs(depId)) {
          return true;
        }
      }
    }

    path.pop();
    return false;
  }

  dfs(startTaskId);
  return path;
}

/**
 * Get all tasks that depend on a given task (reverse dependencies)
 *
 * @param taskId - Task ID to find dependents for
 * @param tasks - All tasks in schedule
 * @returns Array of task IDs that depend on this task
 */
export function getDependentTasks(
  taskId: string,
  tasks: TaskWithDependencies[]
): string[] {
  return tasks
    .filter((task) => task.dependencies?.includes(taskId))
    .map((task) => task.id);
}

/**
 * Topologically sort tasks by dependencies
 * Returns tasks in order such that dependencies come before dependents
 *
 * @param tasks - Tasks to sort
 * @returns Sorted tasks array
 */
export function topologicalSortTasks(
  tasks: TaskWithDependencies[]
): TaskWithDependencies[] {
  const sorted: TaskWithDependencies[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();

  function visit(task: TaskWithDependencies): void {
    if (temp.has(task.id)) {
      throw new Error("Circular dependency detected");
    }
    if (visited.has(task.id)) {
      return;
    }

    temp.add(task.id);

    // Visit all dependencies first
    for (const depId of task.dependencies || []) {
      const depTask = tasks.find((t) => t.id === depId);
      if (depTask) {
        visit(depTask);
      }
    }

    temp.delete(task.id);
    visited.add(task.id);
    sorted.push(task);
  }

  for (const task of tasks) {
    if (!visited.has(task.id)) {
      visit(task);
    }
  }

  return sorted;
}

// ============================================================================
// TASK DATE CALCULATIONS
// ============================================================================

/**
 * Calculate task start date based on dependencies
 * Returns the latest end date of all dependency tasks
 *
 * @param dependencies - Dependency task IDs
 * @param allTasks - All tasks with dates
 * @returns Calculated start date or null if no dependencies
 */
export function calculateTaskStartDate(
  dependencies: string[],
  allTasks: Array<{ id: string; endDate: Date }>
): Date | null {
  if (!dependencies || dependencies.length === 0) {
    return null;
  }

  const depTasks = allTasks.filter((t) => dependencies.includes(t.id));
  if (depTasks.length === 0) {
    return null;
  }

  // Find the latest end date among dependencies
  const latestEndDate = depTasks.reduce((latest, task) => {
    return task.endDate > latest ? task.endDate : latest;
  }, depTasks[0].endDate);

  // Task can start the next workday after the latest dependency ends
  return addWorkdays(latestEndDate, 1);
}

// ============================================================================
// TASK FORMATTING
// ============================================================================

/**
 * Format task for API response
 * Converts Prisma Task to API-friendly format
 */
export function formatTaskForAPI(task: any): any {
  return {
    ...task,
    duration: calculateWorkdays(
      new Date(task.startDate),
      new Date(task.endDate)
    ),
    startDate: task.startDate.toISOString(),
    endDate: task.endDate.toISOString(),
  };
}

/**
 * Parse date string to Date object with error handling
 */
export function parseDate(dateString: string): Date {
  try {
    return parseISO(dateString);
  } catch (error) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
}
