/**
 * Task API Routes
 * POST /api/projects/[id]/schedules/[scheduleId]/tasks - Create new task
 * GET  /api/projects/[id]/schedules/[scheduleId]/tasks - List all tasks
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { Role } from "@/lib/types";
import { captureException } from "@/lib/sentry";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createTaskSchema, taskFilterSchema } from "@/lib/validation/schemas";
import {
  validateTaskDependencies,
  parseDate,
  PHASE_COLORS,
} from "@/lib/task-utils";
import { ZodError } from "zod";

/**
 * GET /api/projects/[id]/schedules/[scheduleId]/tasks
 * List all tasks for a schedule with filtering options
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

    // Parse query parameters for filtering
    const { searchParams } = new URL(req.url);
    const filters: any = {};

    // Apply filters if provided
    const phase = searchParams.get("phase");
    if (phase) filters.phase = phase;

    const assignee = searchParams.get("assignee");
    if (assignee) filters.assignees = { has: assignee };

    const tags = searchParams.get("tags");
    if (tags) {
      const tagArray = tags.split(",");
      filters.tags = { hasSome: tagArray };
    }

    const completed = searchParams.get("completed");
    if (completed) filters.completed = completed === "true";

    // Get all tasks for the schedule
    const tasks = await prisma.task.findMany({
      where: {
        scheduleId,
        ...filters,
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("List tasks error:", error);
    captureException(error, {
      endpoint: "/api/projects/[id]/schedules/[scheduleId]/tasks",
      method: "GET",
      projectId: (await params).id,
      scheduleId: (await params).scheduleId,
    });
    return NextResponse.json(
      { error: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/schedules/[scheduleId]/tasks
 * Create a new task
 * Validates dependencies and auto-assigns colors by phase
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

    // Check permissions - PROJECT_MANAGER+ can create tasks
    const canCreate = await hasRole(Role.PROJECT_MANAGER);
    if (!canCreate) {
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
    const validatedData = createTaskSchema.parse(body);

    // Parse dates
    const startDate = parseDate(validatedData.startDate);
    const endDate = parseDate(validatedData.endDate);

    // If dependencies are provided, validate them
    if (validatedData.dependencies && validatedData.dependencies.length > 0) {
      // Get all existing tasks in the schedule
      const existingTasks = await prisma.task.findMany({
        where: { scheduleId },
        select: { id: true, dependencies: true },
      });

      // Create a simulated task list including the new task
      const simulatedTasks = [
        ...existingTasks,
        {
          id: "temp-new-task",
          dependencies: validatedData.dependencies,
        },
      ];

      // Validate dependencies (check for circular references and invalid IDs)
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
      const invalidDeps = validatedData.dependencies.filter(
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

    // Auto-assign color based on phase if not provided
    let color = validatedData.color;
    if (!color && validatedData.phase) {
      color = PHASE_COLORS[validatedData.phase] || undefined;
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        scheduleId,
        name: validatedData.name,
        startDate,
        endDate,
        phase: validatedData.phase,
        tags: validatedData.tags || [],
        assignees: validatedData.assignees || [],
        dependencies: validatedData.dependencies || [],
        color,
        notes: validatedData.notes,
        completed: validatedData.completed || false,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error("Create task error:", error);

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
      endpoint: "/api/projects/[id]/schedules/[scheduleId]/tasks",
      method: "POST",
      projectId: (await params).id,
      scheduleId: (await params).scheduleId,
    });

    return NextResponse.json(
      { error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}
