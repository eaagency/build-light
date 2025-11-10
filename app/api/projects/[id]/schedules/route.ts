/**
 * Schedule API Routes
 * POST   /api/projects/[id]/schedules - Create new schedule
 * GET    /api/projects/[id]/schedules - List all schedules for project
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { Role } from "@/lib/types";
import { captureException } from "@/lib/sentry";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createScheduleSchema } from "@/lib/validation/schemas";
import { ZodError } from "zod";

/**
 * GET /api/projects/[id]/schedules
 * List all schedules for a project
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Generous for GET requests
    const rateLimitResponse = await enforceRateLimit(req, userId, "generous");
    if (rateLimitResponse) return rateLimitResponse;

    const { id: projectId } = await params;

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

    // Get all schedules for the project with task counts
    const schedules = await prisma.schedule.findMany({
      where: {
        projectId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ schedules });
  } catch (error: any) {
    console.error("List schedules error:", error);
    captureException(error, {
      endpoint: "/api/projects/[id]/schedules",
      method: "GET",
      projectId: (await params).id,
    });
    return NextResponse.json(
      { error: error.message || "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/schedules
 * Create a new schedule for a project
 * Requires PROJECT_MANAGER or higher role
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Standard for POST requests
    const rateLimitResponse = await enforceRateLimit(req, userId, "standard");
    if (rateLimitResponse) return rateLimitResponse;

    const { id: projectId } = await params;

    // Check permissions - only PROJECT_MANAGER+ can create schedules
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

    // Verify project exists and is not deleted
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createScheduleSchema.parse(body);

    // Create the schedule
    const schedule = await prisma.schedule.create({
      data: {
        projectId,
        name: validatedData.name,
        isBaseline: validatedData.isBaseline || false,
        isOnline: validatedData.isOnline || false,
        settings: validatedData.settings || {},
      },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error: any) {
    console.error("Create schedule error:", error);

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
      endpoint: "/api/projects/[id]/schedules",
      method: "POST",
      projectId: (await params).id,
    });

    return NextResponse.json(
      { error: error.message || "Failed to create schedule" },
      { status: 500 }
    );
  }
}
