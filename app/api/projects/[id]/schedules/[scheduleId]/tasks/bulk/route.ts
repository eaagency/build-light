/**
 * Bulk Task Operations API Route
 * POST /api/projects/[id]/schedules/[scheduleId]/tasks/bulk - Bulk update multiple tasks
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { Role } from "@/lib/types";
import { captureException } from "@/lib/sentry";
import { enforceRateLimit } from "@/lib/rate-limit";
import { bulkUpdateTasksSchema } from "@/lib/validation/schemas";
import { ZodError } from "zod";

/**
 * POST /api/projects/[id]/schedules/[scheduleId]/tasks/bulk
 * Bulk update multiple tasks at once
 * Useful for changing color, tags, phase, or completed status for multiple tasks
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Standard for POST requests
    const rateLimitResponse = await enforceRateLimit(req, userId, "standard");
    if (rateLimitResponse) return rateLimitResponse;

    const { id: projectId, scheduleId } = await params;

    // Check permissions - PROJECT_MANAGER+ can bulk update tasks
    const canUpdate = await hasRole(Role.PROJECT_MANAGER);
    if (!canUpdate) {
      return NextResponse.json(
        { error: "Insufficient permissions - PROJECT_MANAGER role required" },
        { status: 403 }
      );
    }

    // Get user to verify project access
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        projectMembers: {
          where: { projectId },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify project access
    const isMember = user.projectMembers.length > 0;
    if (!isMember && !(await hasRole(Role.OWNER))) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Verify schedule exists and belongs to project
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        projectId,
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = bulkUpdateTasksSchema.parse(body);

    // Verify all task IDs exist and belong to this schedule
    const existingTasks = await prisma.task.findMany({
      where: {
        id: { in: validatedData.taskIds },
        scheduleId,
      },
    });

    if (existingTasks.length !== validatedData.taskIds.length) {
      const foundIds = existingTasks.map((t) => t.id);
      const missingIds = validatedData.taskIds.filter(
        (id) => !foundIds.includes(id)
      );
      return NextResponse.json(
        {
          error: `Tasks not found or don't belong to this schedule: ${missingIds.join(", ")}`,
        },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (validatedData.updates.color !== undefined) {
      updateData.color = validatedData.updates.color;
    }
    if (validatedData.updates.tags !== undefined) {
      updateData.tags = validatedData.updates.tags;
    }
    if (validatedData.updates.phase !== undefined) {
      updateData.phase = validatedData.updates.phase;
    }
    if (validatedData.updates.completed !== undefined) {
      updateData.completed = validatedData.updates.completed;
    }

    // Perform bulk update
    const result = await prisma.task.updateMany({
      where: {
        id: { in: validatedData.taskIds },
        scheduleId,
      },
      data: updateData,
    });

    // Fetch updated tasks to return
    const updatedTasks = await prisma.task.findMany({
      where: {
        id: { in: validatedData.taskIds },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return NextResponse.json({
      message: `Successfully updated ${result.count} tasks`,
      count: result.count,
      tasks: updatedTasks,
    });
  } catch (error: any) {
    console.error("Bulk update tasks error:", error);

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
      endpoint: "/api/projects/[id]/schedules/[scheduleId]/tasks/bulk",
      method: "POST",
      projectId: (await params).id,
      scheduleId: (await params).scheduleId,
    });

    return NextResponse.json(
      { error: error.message || "Failed to bulk update tasks" },
      { status: 500 }
    );
  }
}
