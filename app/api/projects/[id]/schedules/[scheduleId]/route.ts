/**
 * Single Schedule API Routes
 * GET    /api/projects/[id]/schedules/[scheduleId] - Get schedule with all tasks
 * PATCH  /api/projects/[id]/schedules/[scheduleId] - Update schedule
 * DELETE /api/projects/[id]/schedules/[scheduleId] - Delete schedule (soft delete)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { Role } from "@/lib/types";
import { captureException } from "@/lib/sentry";
import { enforceRateLimit } from "@/lib/rate-limit";
import { updateScheduleSchema } from "@/lib/validation/schemas";
import { ZodError } from "zod";

/**
 * GET /api/projects/[id]/schedules/[scheduleId]
 * Get a single schedule with all tasks and dependencies
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Generous for GET requests
    const rateLimitResponse = await enforceRateLimit(req, userId, "generous");
    if (rateLimitResponse) return rateLimitResponse;

    const { id: projectId, scheduleId } = await params;

    // Get user to check project access
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

    // Check if user has access to this project
    const canViewAll = await hasRole(Role.PROJECT_MANAGER);
    const isMember = user.projectMembers.length > 0;

    if (!canViewAll && !isMember) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Get schedule with all tasks
    const schedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        projectId,
      },
      include: {
        tasks: {
          orderBy: {
            startDate: "asc",
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ schedule });
  } catch (error: any) {
    console.error("Get schedule error:", error);
    captureException(error, {
      endpoint: "/api/projects/[id]/schedules/[scheduleId]",
      method: "GET",
      projectId: (await params).id,
      scheduleId: (await params).scheduleId,
    });
    return NextResponse.json(
      { error: error.message || "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]/schedules/[scheduleId]
 * Update a schedule
 * Requires PROJECT_MANAGER or higher role
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Standard for PATCH requests
    const rateLimitResponse = await enforceRateLimit(req, userId, "standard");
    if (rateLimitResponse) return rateLimitResponse;

    const { id: projectId, scheduleId } = await params;

    // Check permissions - only PROJECT_MANAGER+ can update schedules
    const canUpdate = await hasRole(Role.PROJECT_MANAGER);
    if (!canUpdate) {
      return NextResponse.json(
        { error: "Insufficient permissions - PROJECT_MANAGER role required" },
        { status: 403 }
      );
    }

    // Verify schedule exists and belongs to project
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        projectId,
      },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateScheduleSchema.parse(body);

    // Update the schedule
    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.isBaseline !== undefined && {
          isBaseline: validatedData.isBaseline,
        }),
        ...(validatedData.isOnline !== undefined && {
          isOnline: validatedData.isOnline,
        }),
        ...(validatedData.settings !== undefined && {
          settings: validatedData.settings,
        }),
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json({ schedule });
  } catch (error: any) {
    console.error("Update schedule error:", error);

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
      endpoint: "/api/projects/[id]/schedules/[scheduleId]",
      method: "PATCH",
      projectId: (await params).id,
      scheduleId: (await params).scheduleId,
    });

    return NextResponse.json(
      { error: error.message || "Failed to update schedule" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/schedules/[scheduleId]
 * Delete a schedule (soft delete with cascade to tasks)
 * Requires OWNER role
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Strict for DELETE requests (sensitive operation)
    const rateLimitResponse = await enforceRateLimit(req, userId, "strict");
    if (rateLimitResponse) return rateLimitResponse;

    const { id: projectId, scheduleId } = await params;

    // Only OWNER can delete schedules
    const isOwner = await hasRole(Role.OWNER);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Insufficient permissions - OWNER role required" },
        { status: 403 }
      );
    }

    // Verify schedule exists and belongs to project
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        id: scheduleId,
        projectId,
      },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    // Delete the schedule (cascades to tasks via Prisma schema)
    await prisma.schedule.delete({
      where: { id: scheduleId },
    });

    return NextResponse.json({
      message: "Schedule deleted successfully",
      scheduleId,
    });
  } catch (error: any) {
    console.error("Delete schedule error:", error);
    captureException(error, {
      endpoint: "/api/projects/[id]/schedules/[scheduleId]",
      method: "DELETE",
      projectId: (await params).id,
      scheduleId: (await params).scheduleId,
    });
    return NextResponse.json(
      { error: error.message || "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
