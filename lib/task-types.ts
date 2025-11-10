/**
 * Task Management Types and Utilities
 * Shared interfaces and helper functions for task creation, editing, and management
 */

import { Task, TaskPhase } from "@prisma/client";

// ============================================================================
// TASK TYPES
// ============================================================================

/**
 * Task with all relations populated
 */
export interface TaskWithRelations extends Task {
  // Add any additional relations here as needed
}

/**
 * Form data for creating a new task
 */
export interface CreateTaskFormData {
  name: string;
  description?: string;
  phase: TaskPhase;
  startDate: Date;
  endDate?: Date;
  duration?: number; // In workdays
  assignees: string[]; // User IDs
  tags: string[];
  color?: string;
  dependencies: TaskDependency[];
  progress?: number;
}

/**
 * Form data for editing an existing task
 */
export interface EditTaskFormData extends CreateTaskFormData {
  id: string;
  completed: boolean;
}

/**
 * Task dependency structure
 */
export interface TaskDependency {
  taskId: string;
  type: "START_TO_START" | "FINISH_TO_START";
}

/**
 * Bulk update data
 */
export interface BulkUpdateData {
  taskIds: string[];
  updates: {
    color?: string;
    tags?: string[];
    phase?: TaskPhase;
    completed?: boolean;
  };
}

/**
 * Task filter options
 */
export interface TaskFilters {
  phases?: TaskPhase[];
  tags?: string[];
  assignees?: string[];
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE";
}

/**
 * Task sort options
 */
export type TaskSortField = "name" | "startDate" | "endDate" | "phase" | "progress" | "duration";
export type TaskSortDirection = "asc" | "desc";

export interface TaskSort {
  field: TaskSortField;
  direction: TaskSortDirection;
}

// ============================================================================
// PHASE CONFIGURATION
// ============================================================================

/**
 * Phase colors for visual identification
 * Maps TaskPhase enum to hex colors
 */
export const TASK_PHASE_COLORS: Record<TaskPhase, string> = {
  PLANNING: "#9CA3AF",
  DESIGN: "#F59E0B",
  PERMITS: "#DC2626",
  FOUNDATION: "#2563EB",
  FRAMING: "#059669",
  ELECTRICAL: "#7C3AED",
  PLUMBING: "#EC4899",
  HVAC: "#06B6D4",
  INSULATION: "#8B5CF6",
  DRYWALL: "#10B981",
  FINISHING: "#F97316",
  LANDSCAPING: "#14B8A6",
  INSPECTION: "#6366F1",
  CLOSEOUT: "#EF4444",
};

/**
 * Phase display names (user-friendly)
 */
export const TASK_PHASE_LABELS: Record<TaskPhase, string> = {
  PLANNING: "Planning",
  DESIGN: "Design",
  PERMITS: "Permits",
  FOUNDATION: "Foundation",
  FRAMING: "Framing",
  ELECTRICAL: "Electrical",
  PLUMBING: "Plumbing",
  HVAC: "HVAC",
  INSULATION: "Insulation",
  DRYWALL: "Drywall",
  FINISHING: "Finishing",
  LANDSCAPING: "Landscaping",
  INSPECTION: "Inspection",
  CLOSEOUT: "Closeout",
};

/**
 * Phase order for sorting
 */
export const TASK_PHASE_ORDER: TaskPhase[] = [
  "PLANNING",
  "DESIGN",
  "PERMITS",
  "FOUNDATION",
  "FRAMING",
  "ELECTRICAL",
  "PLUMBING",
  "HVAC",
  "INSULATION",
  "DRYWALL",
  "FINISHING",
  "LANDSCAPING",
  "INSPECTION",
  "CLOSEOUT",
];

// ============================================================================
// COMMON TAGS
// ============================================================================

/**
 * Suggested tags for quick selection
 */
export const COMMON_TASK_TAGS = [
  "Invoice-Driver",
  "Designer",
  "Inspection",
  "Delivery",
  "Milestone",
  "Critical",
  "Permit-Required",
  "Weather-Dependent",
  "Client-Approval",
  "Long-Lead",
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get phase color for a task
 */
export function getPhaseColor(phase: TaskPhase | null | undefined): string {
  if (!phase) return "#9CA3AF"; // Default gray
  return TASK_PHASE_COLORS[phase] || "#9CA3AF";
}

/**
 * Get phase label for display
 */
export function getPhaseLabel(phase: TaskPhase | null | undefined): string {
  if (!phase) return "No Phase";
  return TASK_PHASE_LABELS[phase] || phase;
}

/**
 * Get phase index for sorting
 */
export function getPhaseOrder(phase: TaskPhase): number {
  return TASK_PHASE_ORDER.indexOf(phase);
}

/**
 * Get task status based on progress
 */
export function getTaskStatus(progress: number): "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE" {
  if (progress === 0) return "NOT_STARTED";
  if (progress === 100) return "COMPLETE";
  return "IN_PROGRESS";
}

/**
 * Get status color
 */
export function getStatusColor(status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETE"): string {
  switch (status) {
    case "NOT_STARTED":
      return "#9CA3AF"; // Gray
    case "IN_PROGRESS":
      return "#6BF178"; // BuildLight Green
    case "COMPLETE":
      return "#059669"; // Dark Green
  }
}

/**
 * Format task duration for display
 */
export function formatDuration(days: number): string {
  if (days === 1) return "1 day";
  return `${days} days`;
}

/**
 * Validate task name
 */
export function validateTaskName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: "Task name is required" };
  }
  if (name.length > 200) {
    return { valid: false, error: "Task name must be 200 characters or less" };
  }
  return { valid: true };
}

/**
 * Validate task dates
 */
export function validateTaskDates(
  startDate: Date | null,
  endDate: Date | null
): { valid: boolean; error?: string } {
  if (!startDate) {
    return { valid: false, error: "Start date is required" };
  }
  if (endDate && endDate < startDate) {
    return { valid: false, error: "End date must be after start date" };
  }
  return { valid: true };
}

/**
 * Validate dependencies
 */
export function validateDependencies(
  dependencies: TaskDependency[]
): { valid: boolean; error?: string } {
  if (dependencies.length > 20) {
    return { valid: false, error: "Maximum 20 dependencies allowed" };
  }

  // Check for duplicate dependencies
  const taskIds = dependencies.map(d => d.taskId);
  const uniqueTaskIds = new Set(taskIds);
  if (taskIds.length !== uniqueTaskIds.size) {
    return { valid: false, error: "Duplicate dependencies not allowed" };
  }

  return { valid: true };
}

/**
 * Validate tags
 */
export function validateTags(tags: string[]): { valid: boolean; error?: string } {
  if (tags.length > 10) {
    return { valid: false, error: "Maximum 10 tags allowed" };
  }
  return { valid: true };
}

/**
 * Validate assignees
 */
export function validateAssignees(assignees: string[]): { valid: boolean; error?: string } {
  if (assignees.length > 10) {
    return { valid: false, error: "Maximum 10 assignees allowed" };
  }
  return { valid: true };
}
