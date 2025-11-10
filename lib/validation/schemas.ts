/**
 * Zod Validation Schemas for BuildLight API
 *
 * Provides type-safe validation for Schedule and Task operations.
 * All schemas match the Prisma schema structure.
 */

import { z } from "zod";
import { TaskPhase, Weather } from "@prisma/client";

// ============================================================================
// SCHEDULE VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for creating a new schedule
 */
export const createScheduleSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name must be 200 characters or less"),
  isBaseline: z.boolean().optional().default(false),
  isOnline: z.boolean().optional().default(false),
  settings: z.record(z.any()).optional(), // JSON settings object
});

/**
 * Schema for updating an existing schedule
 * All fields are optional for partial updates
 */
export const updateScheduleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  isBaseline: z.boolean().optional(),
  isOnline: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
});

// ============================================================================
// TASK VALIDATION SCHEMAS
// ============================================================================

/**
 * Task Phase enum from Prisma schema
 */
export const TaskPhaseEnum = z.nativeEnum(TaskPhase);

/**
 * Schema for creating a new task
 */
export const createTaskSchema = z.object({
  name: z.string().min(1, "Task name is required").max(200, "Task name must be 200 characters or less"),
  startDate: z.string().datetime("Invalid start date format"),
  endDate: z.string().datetime("Invalid end date format"),
  phase: TaskPhaseEnum.optional(),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed").optional().default([]),
  assignees: z.array(z.string().cuid("Invalid user ID format")).max(10, "Maximum 10 assignees allowed").optional().default([]),
  dependencies: z.array(z.string().cuid("Invalid task ID format")).max(20, "Maximum 20 dependencies allowed").optional().default([]),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex code (e.g., #FF5733)").optional(),
  notes: z.string().max(5000, "Notes must be 5000 characters or less").optional(),
  completed: z.boolean().optional().default(false),
}).refine(
  (data) => {
    // Validate that endDate is after startDate
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  },
  {
    message: "End date must be equal to or after start date",
    path: ["endDate"],
  }
);

/**
 * Schema for updating an existing task
 * All fields are optional for partial updates
 */
export const updateTaskSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  phase: TaskPhaseEnum.optional(),
  tags: z.array(z.string()).max(10).optional(),
  assignees: z.array(z.string().cuid()).max(10).optional(),
  dependencies: z.array(z.string().cuid()).max(20).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  notes: z.string().max(5000).optional(),
  completed: z.boolean().optional(),
}).refine(
  (data) => {
    // Only validate date relationship if both are provided
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end >= start;
    }
    return true;
  },
  {
    message: "End date must be equal to or after start date",
    path: ["endDate"],
  }
);

/**
 * Schema for bulk task updates
 * Allows updating multiple tasks at once with the same changes
 */
export const bulkUpdateTasksSchema = z.object({
  taskIds: z.array(z.string().cuid()).min(1, "At least one task ID is required").max(100, "Maximum 100 tasks per bulk update"),
  updates: z.object({
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
    tags: z.array(z.string()).max(10).optional(),
    phase: TaskPhaseEnum.optional(),
    completed: z.boolean().optional(),
  }).refine(
    (data) => {
      // At least one field must be provided
      return data.color !== undefined || data.tags !== undefined || data.phase !== undefined || data.completed !== undefined;
    },
    {
      message: "At least one update field (color, tags, phase, or completed) must be provided",
    }
  ),
});

// ============================================================================
// QUERY PARAMETER SCHEMAS
// ============================================================================

/**
 * Schema for filtering tasks by query parameters
 */
export const taskFilterSchema = z.object({
  phase: TaskPhaseEnum.optional(),
  assignee: z.string().cuid().optional(),
  tags: z.string().optional(), // Comma-separated tags
  completed: z.enum(["true", "false"]).optional(),
});

/**
 * Schema for pagination parameters
 */
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).refine((val) => val <= 100, "Maximum limit is 100").optional().default("50"),
});

// ============================================================================
// DAILY LOG VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema for creating a new daily log
 * Enforces one log per date per project
 */
export const createDailyLogSchema = z
  .object({
    projectId: z.string().cuid("Invalid project ID"),
    date: z.string().datetime("Invalid date format"),
    weather: z.nativeEnum(Weather, {
      errorMap: () => ({ message: "Invalid weather condition" }),
    }),
    activities: z
      .string()
      .min(1, "Activities are required")
      .max(5000, "Activities must be 5000 characters or less"),
    crewNotes: z
      .string()
      .max(2000, "Crew notes must be 2000 characters or less")
      .optional(),
    photos: z
      .array(z.string().url("Invalid photo URL"))
      .max(50, "Maximum 50 photos per log")
      .optional()
      .default([]),
    assignedToId: z.string().cuid("Invalid assigned user ID"),
  })
  .refine(
    (data) => {
      const logDate = new Date(data.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      return logDate <= today;
    },
    {
      message: "Date cannot be in the future",
      path: ["date"],
    }
  );

/**
 * Schema for updating an existing daily log
 * Note: date and projectId cannot be updated (immutable)
 */
export const updateDailyLogSchema = z.object({
  weather: z
    .nativeEnum(Weather, {
      errorMap: () => ({ message: "Invalid weather condition" }),
    })
    .optional(),
  activities: z
    .string()
    .min(1, "Activities cannot be empty")
    .max(5000, "Activities must be 5000 characters or less")
    .optional(),
  crewNotes: z
    .string()
    .max(2000, "Crew notes must be 2000 characters or less")
    .optional(),
  photos: z
    .array(z.string().url("Invalid photo URL"))
    .max(50, "Maximum 50 photos per log")
    .optional(),
  assignedToId: z.string().cuid("Invalid assigned user ID").optional(),
});

/**
 * Schema for filtering daily logs by query parameters
 */
export const dailyLogFilterSchema = z.object({
  startDate: z.string().datetime("Invalid start date format").optional(),
  endDate: z.string().datetime("Invalid end date format").optional(),
  weather: z
    .nativeEnum(Weather, {
      errorMap: () => ({ message: "Invalid weather condition" }),
    })
    .optional(),
  createdBy: z.string().cuid("Invalid user ID").optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1, "Page must be at least 1"))
    .optional()
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number()
        .min(1, "Limit must be at least 1")
        .max(100, "Limit cannot exceed 100")
    )
    .optional()
    .default("50"),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

// Export TypeScript types inferred from schemas
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type BulkUpdateTasksInput = z.infer<typeof bulkUpdateTasksSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type CreateDailyLogInput = z.infer<typeof createDailyLogSchema>;
export type UpdateDailyLogInput = z.infer<typeof updateDailyLogSchema>;
export type DailyLogFilterInput = z.infer<typeof dailyLogFilterSchema>;
