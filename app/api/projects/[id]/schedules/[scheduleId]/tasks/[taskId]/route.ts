/**
 * Single Task API Routes
 * PATCH  /api/projects/[id]/schedules/[scheduleId]/tasks/[taskId] - Update task
 * DELETE /api/projects/[id]/schedules/[scheduleId]/tasks/[taskId] - Delete task
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { Role } from "@/lib/types";
import { captureException } from "@/lib/sentry";
import { enforceRateLimit } from "@/lib/rate-limit";
import { updateTaskSchema } from "@/lib/validation/schemas";
import { validateTaskDependencies, parseDate, PHASE_COLORS } from "@/lib/task-utils";
import { ZodError } from "zod";

/**
 * PATCH /api/projects/[id]/schedules/[scheduleId]/tasks/[taskId]
 * Update a task
 * Validates dependencies and recalculates dependent tasks if dates change
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string; taskId: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Standard for PATCH requests
    const rateLimitResponse = await enforceRateLimit(req, userId, "standard");
    if (rateLimitResponse) return rateLimitResponse;

    const { id: projectId, scheduleId, taskId } = await params;

    // Check permissions - PROJECT_MANAGER+ can update tasks
    const canUpdate = await hasRole(Role.PROJECT_MANAGER);
    if (!canUpdate) {
      return NextResponse.json(
        { error: "Insufficient permissions - PROJECT_MANAGER role required" },
        { status: 403 }
      );
    }

    // Verify task exists and belongs to the schedule/project
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        scheduleId,
        schedule: {
          projectId,
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateTaskSchema.parse(body);

    // Parse dates if provided
    let startDate = validatedData.startDate
      ? parseDate(validatedData.startDate)
      : undefined;
    let endDate = validatedData.endDate
      ? parseDate(validatedData.endDate)
      : undefined;

    // If dependencies are being updated, validate them
    if (validatedData.dependencies !== undefined) {
      // Get all existing tasks in the schedule
      const existingTasks = await prisma.task.findMany({
        where: { scheduleId },
        select: { id: true, dependencies: true },
      });

      // Update the dependencies for this task in the simulation
      const simulatedTasks = existingTasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            dependencies: validatedData.dependencies || [],
          };
        }
        return t;
      });

      // Validate dependencies
      const validation = validateTaskDependencies(simulatedTasks);
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: validation.error,
            circularPath: validation.circularPath,
          },
          { status: 400 }
        );
      }

      // Verify all dependency task IDs exist
      const existingTaskIds = existingTasks.map((t) => t.id);
      const invalidDeps = (validatedData.dependencies || []).filter(
        (depId) => !existingTaskIds.includes(depId)
      );

      if (invalidDeps.length > 0) {
        return NextResponse.json(
          {
            error: `Invalid dependency task IDs: ${invalidDeps.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    // Auto-assign color based on phase if phase is changing and no color provided
    let color = validatedData.color;
    if (validatedData.phase && !color && !existingTask.color) {
      color = PHASE_COLORS[validatedData.phase] || undefined;
    }

    // Build update data
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;
    if (validatedData.phase !== undefined) updateData.phase = validatedData.phase;
    if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
    if (validatedData.assignees !== undefined) updateData.assignees = validatedData.assignees;
    if (validatedData.dependencies !== undefined)
      updateData.dependencies = validatedData.dependencies;
    if (color) updateData.color = color;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
    if (validatedData.completed !== undefined) updateData.completed = validatedData.completed;

    // Update the task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error("Update task error:", error);

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    captureException(error, {
      endpoint: "/api/projects/[id]/schedules/[scheduleId]/tasks/[taskId]",
      method: "PATCH",
      projectId: (await params).id,
      scheduleId: (await params).scheduleId,
      taskId: (await params).taskId,
    });

    return NextResponse.json(
      { error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/schedules/[scheduleId]/tasks/[taskId]
 * Delete a task
 * Removes task from dependencies of other tasks
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string; taskId: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Strict for DELETE requests (sensitive operation)
    const rateLimitResponse = await enforceRateLimit(req, userId, "strict");
    if (rateLimitResponse) return rateLimitResponse;

    const { id: projectId, scheduleId, taskId } = await params;

    // Check permissions - PROJECT_MANAGER+ can delete tasks
    const canDelete = await hasRole(Role.PROJECT_MANAGER);
    if (!canDelete) {
      return NextResponse.json(
        { error: "Insufficient permissions - PROJECT_MANAGER role required" },
        { status: 403 }
      );
    }

    // Verify task exists and belongs to the schedule/project
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        scheduleId,
        schedule: {
          projectId,
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Find all tasks that depend on this task and remove the dependency
    const dependentTasks = await prisma.task.findMany({
      where: {
        scheduleId,
        dependencies: {
          has: taskId,
        },
      },
    });

    // Update dependent tasks to remove this dependency
    for (const depTask of dependentTasks) {
      await prisma.task.update({
        where: { id: depTask.id },
        data: {
          dependencies: depTask.dependencies.filter((dep) => dep !== taskId),
        },
      });
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({
      message: "Task deleted successfully",
      taskId,
      updatedDependents: dependentTasks.length,
    });
  } catch (error: any) {
    console.error("Delete task error:", error);
    captureException(error, {
      endpoint: "/api/projects/[id]/schedules/[scheduleId]/tasks/[taskId]",
      method: "DELETE",
      projectId: (await params).id,
      scheduleId: (await params).scheduleId,
      taskId: (await params).taskId,
    });
    return NextResponse.json(
      { error: error.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}
