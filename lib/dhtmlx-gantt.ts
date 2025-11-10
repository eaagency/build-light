/**
 * DHTMLX Gantt Integration for BuildLight
 *
 * Provides data format converters between Prisma Task models and DHTMLX Gantt format.
 *
 * SETUP REQUIRED:
 * 1. Download DHTMLX Gantt trial files from https://dhtmlx.com/docs/products/dhtmlxGantt/
 * 2. Place dhtmlxgantt.js and dhtmlxgantt.css in /public/dhtmlx/
 * 3. Import in your Gantt component using <Script> and <Link> tags
 *
 * IMPORTANT: DHTMLX Gantt requires a commercial license for production use.
 * Trial period: 30 days for evaluation purposes only.
 */

import { Task } from "@prisma/client";
import { calculateWorkdays } from "./task-utils";

// ============================================================================
// DHTMLX GANTT DATA FORMAT
// ============================================================================

/**
 * DHTMLX Gantt task format
 * See: https://docs.dhtmlx.com/gantt/desktop__loading.html
 */
export interface DHXGanttTask {
  id: string | number;
  text: string;
  start_date: string; // Format: "DD-MM-YYYY" or Date object
  end_date: string; // Format: "DD-MM-YYYY" or Date object
  duration: number; // In days
  progress: number; // 0 to 1 (0.5 = 50%)
  parent?: string | number; // Parent task ID for hierarchical structure
  type?: "task" | "project" | "milestone"; // Task type
  color?: string; // Hex color
  open?: boolean; // Expanded state for parent tasks

  // Custom fields (BuildLight specific)
  phase?: string;
  tags?: string[];
  assignees?: string[];
  dependencies?: string[];
  notes?: string;
  completed?: boolean;
}

/**
 * DHTMLX Gantt link format (for task dependencies)
 * See: https://docs.dhtmlx.com/gantt/desktop__loading.html#linksformat
 */
export interface DHXGanttLink {
  id: string | number;
  source: string | number; // Source task ID
  target: string | number; // Target task ID
  type: string | number; // Link type: 0=finish_to_start, 1=start_to_start, 2=finish_to_finish, 3=start_to_finish
}

/**
 * DHTMLX Gantt data structure
 */
export interface DHXGanttData {
  data: DHXGanttTask[];
  links: DHXGanttLink[];
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert Prisma Task to DHTMLX Gantt format
 *
 * @param task - Prisma Task model
 * @returns DHXGanttTask format
 */
export function taskToDHXGantt(task: Task): DHXGanttTask {
  // Calculate duration in workdays
  const duration = calculateWorkdays(
    new Date(task.startDate),
    new Date(task.endDate)
  );

  // Calculate progress (BuildLight uses completed boolean, DHTMLX uses 0-1 scale)
  const progress = task.completed ? 1 : 0;

  // Format dates for DHTMLX (expects "DD-MM-YYYY" or Date object)
  const startDate = formatDateForDHX(new Date(task.startDate));
  const endDate = formatDateForDHX(new Date(task.endDate));

  return {
    id: task.id,
    text: task.name,
    start_date: startDate,
    end_date: endDate,
    duration,
    progress,
    type: "task",
    color: task.color || undefined,
    phase: task.phase || undefined,
    tags: task.tags,
    assignees: task.assignees,
    dependencies: task.dependencies,
    notes: task.notes || undefined,
    completed: task.completed,
  };
}

/**
 * Convert array of Prisma Tasks to DHTMLX Gantt data structure
 * Includes both tasks and dependency links
 *
 * @param tasks - Array of Prisma Task models
 * @returns DHXGanttData with tasks and links
 */
export function tasksToDHXGantt(tasks: Task[]): DHXGanttData {
  const data: DHXGanttTask[] = tasks.map(taskToDHXGantt);
  const links: DHXGanttLink[] = [];

  // Create dependency links
  tasks.forEach((task) => {
    if (task.dependencies && task.dependencies.length > 0) {
      task.dependencies.forEach((depId, index) => {
        links.push({
          id: `${task.id}_${depId}_${index}`,
          source: depId,
          target: task.id,
          type: 0, // finish_to_start (most common in construction)
        });
      });
    }
  });

  return { data, links };
}

/**
 * Convert DHTMLX Gantt task back to Prisma Task format
 * Used when saving changes from the Gantt chart
 *
 * @param dhxTask - DHTMLX Gantt task
 * @returns Partial Task data for Prisma update
 */
export function dhxGanttToTask(dhxTask: DHXGanttTask): Partial<Task> {
  // Parse dates from DHTMLX format
  const startDate = parseDHXDate(dhxTask.start_date);
  const endDate = parseDHXDate(dhxTask.end_date);

  // Convert progress back to completed boolean
  const completed = dhxTask.progress >= 1;

  return {
    name: dhxTask.text,
    startDate,
    endDate,
    phase: dhxTask.phase as any,
    tags: dhxTask.tags || [],
    assignees: dhxTask.assignees || [],
    dependencies: dhxTask.dependencies || [],
    color: dhxTask.color || null,
    notes: dhxTask.notes || null,
    completed,
  };
}

// ============================================================================
// DATE FORMATTING UTILITIES
// ============================================================================

/**
 * Format Date object to DHTMLX Gantt format
 * DHTMLX accepts: "DD-MM-YYYY", "DD-MM-YYYY HH:mm", or Date object
 *
 * @param date - JavaScript Date object
 * @returns Formatted date string "DD-MM-YYYY"
 */
export function formatDateForDHX(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Parse DHTMLX date string to JavaScript Date
 * Handles both "DD-MM-YYYY" format and Date objects
 *
 * @param dhxDate - DHTMLX date string or Date object
 * @returns JavaScript Date object
 */
export function parseDHXDate(dhxDate: string | Date): Date {
  if (dhxDate instanceof Date) {
    return dhxDate;
  }

  // Parse "DD-MM-YYYY" format
  const parts = dhxDate.split("-");
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JavaScript months are 0-indexed
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }

  // Fallback to ISO string parsing
  return new Date(dhxDate);
}

// ============================================================================
// GANTT CONFIGURATION
// ============================================================================

/**
 * Default DHTMLX Gantt configuration for BuildLight
 * Apply this configuration when initializing the Gantt chart
 *
 * @example
 * ```typescript
 * import gantt from 'dhtmlx-gantt';
 * import { getDefaultGanttConfig } from '@/lib/dhtmlx-gantt';
 *
 * // Apply configuration
 * Object.assign(gantt.config, getDefaultGanttConfig());
 * gantt.init('gantt_here');
 * ```
 */
export function getDefaultGanttConfig() {
  return {
    // Date format
    date_format: "%d-%m-%Y",
    xml_date: "%d-%m-%Y",

    // Work time settings (Monday-Friday, exclude weekends)
    work_time: true,
    correct_work_time: true,
    skip_off_time: true,

    // Grid columns
    columns: [
      { name: "text", label: "Task Name", tree: true, width: 250 },
      { name: "start_date", label: "Start Date", align: "center", width: 100 },
      { name: "duration", label: "Days", align: "center", width: 60 },
      { name: "phase", label: "Phase", align: "center", width: 120 },
    ],

    // UI settings
    show_errors: true,
    show_progress: true,
    readonly: false,
    drag_progress: true,
    drag_links: true,
    drag_resize: true,
    drag_move: true,

    // Scale settings
    scale_unit: "week",
    date_scale: "Week %W",
    subscales: [
      { unit: "day", step: 1, date: "%d %M" }
    ],

    // Auto scheduling
    auto_scheduling: true,
    auto_scheduling_strict: true,

    // Task types
    types: {
      task: "task",
      project: "project",
      milestone: "milestone"
    },

    // Links (dependencies)
    links: {
      finish_to_start: "0",
      start_to_start: "1",
      finish_to_finish: "2",
      start_to_finish: "3"
    },
  };
}

/**
 * Initialize DHTMLX Gantt with BuildLight configuration
 * Call this function when the Gantt component mounts
 *
 * NOTE: Requires DHTMLX Gantt files to be loaded in the page
 *
 * @param containerId - ID of the DOM element to render Gantt in
 * @returns Configuration object for reference
 */
export function initializeBuildLightGantt(containerId: string): any {
  // Check if dhtmlx-gantt is loaded
  if (typeof window === "undefined" || !(window as any).gantt) {
    console.error("DHTMLX Gantt library not loaded. Please add dhtmlxgantt.js to your page.");
    return null;
  }

  const gantt = (window as any).gantt;

  // Apply BuildLight configuration
  const config = getDefaultGanttConfig();
  Object.assign(gantt.config, config);

  // Set work time (Monday-Friday only)
  gantt.setWorkTime({ hours: [8, 17] }); // 8 AM to 5 PM
  gantt.setWorkTime({ day: 0, hours: false }); // Sunday - no work
  gantt.setWorkTime({ day: 6, hours: false }); // Saturday - no work

  // Initialize Gantt chart
  gantt.init(containerId);

  return config;
}

// ============================================================================
// USAGE EXAMPLE (for reference)
// ============================================================================

/**
 * Example: Loading tasks into DHTMLX Gantt
 *
 * ```typescript
 * import { tasksToDHXGantt, initializeBuildLightGantt } from '@/lib/dhtmlx-gantt';
 *
 * // In your component
 * useEffect(() => {
 *   // Initialize Gantt
 *   initializeBuildLightGantt('gantt_here');
 *
 *   // Fetch tasks from API
 *   const response = await fetch(`/api/projects/${projectId}/schedules/${scheduleId}/tasks`);
 *   const { tasks } = await response.json();
 *
 *   // Convert to DHTMLX format
 *   const ganttData = tasksToDHXGantt(tasks);
 *
 *   // Load into Gantt
 *   gantt.parse(ganttData);
 * }, [projectId, scheduleId]);
 *
 * // Handle Gantt events
 * gantt.attachEvent("onAfterTaskUpdate", (id, task) => {
 *   // Convert back to Prisma format
 *   const updatedTask = dhxGanttToTask(task);
 *
 *   // Save to API
 *   await fetch(`/api/projects/${projectId}/schedules/${scheduleId}/tasks/${id}`, {
 *     method: 'PATCH',
 *     body: JSON.stringify(updatedTask),
 *   });
 * });
 * ```
 */
