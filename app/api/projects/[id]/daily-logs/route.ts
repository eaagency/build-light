/**
 * Daily Logs API Routes
 * POST - Create new daily log
 * GET - List daily logs with filters
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { startOfDay, endOfDay } from "date-fns";
import {
  createDailyLogSchema,
  dailyLogFilterSchema,
} from "@/lib/validation/schemas";
import { enforceRateLimit } from "@/lib/rate-limit";
import { captureException } from "@/lib/sentry";

const prisma = new PrismaClient();

/**
 * POST /api/projects/[id]/daily-logs
 * Create new daily log
 *
 * RBAC: PROJECT_MANAGER+ or FIELD_WORKER
 * Rate Limit: Standard (20/10s)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    const rateLimitResponse = await enforceRateLimit(
      request,
      userId,
      "standard"
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { organization: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check role (PROJECT_MANAGER+ or FIELD_WORKER can create)
    const allowedRoles = ["OWNER", "PROJECT_MANAGER", "FIELD_WORKER"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions. Only project managers and field workers can create daily logs." },
        { status: 403 }
      );
    }

    const { id: projectId } = await context.params;

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createDailyLogSchema.safeParse({
      ...body,
      projectId,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if log already exists for this date (one log per date per project)
    const logDate = new Date(data.date);
    const existingLog = await prisma.dailyLog.findFirst({
      where: {
        projectId,
        date: {
          gte: startOfDay(logDate),
          lt: endOfDay(logDate),
        },
        deletedAt: null,
      },
    });

    if (existingLog) {
      return NextResponse.json(
        {
          error: "A daily log already exists for this date",
          existingLogId: existingLog.id,
        },
        { status: 409 }
      );
    }

    // Verify assigned user exists and has access to project
    const assignedUser = await prisma.user.findUnique({
      where: { id: data.assignedToId },
      include: {
        projectMembers: {
          where: {
            projectId,
          },
        },
      },
    });

    if (!assignedUser) {
      return NextResponse.json(
        { error: "Assigned user not found" },
        { status: 400 }
      );
    }

    if (assignedUser.projectMembers.length === 0) {
      return NextResponse.json(
        { error: "Assigned user is not a member of this project" },
        { status: 400 }
      );
    }

    // Create daily log
    const dailyLog = await prisma.dailyLog.create({
      data: {
        projectId,
        date: logDate,
        weather: data.weather,
        activities: data.activities,
        crewNotes: data.crewNotes || null,
        photos: data.photos || [],
        assignedToId: data.assignedToId,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(dailyLog, { status: 201 });
  } catch (error: any) {
    console.error("Create daily log error:", error);
    captureException(error, {
      context: "daily-logs-create",
      projectId: context.params,
    });

    return NextResponse.json(
      { error: "Failed to create daily log" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/projects/[id]/daily-logs
 * List daily logs with filters
 *
 * RBAC: Any project member
 * Rate Limit: Generous (100/10s)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit
    const rateLimitResponse = await enforceRateLimit(
      request,
      userId,
      "generous"
    );
    if (rateLimitResponse) return rateLimitResponse;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { organization: true },
    });

    if (!user || !user.organizationId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: projectId } = await context.params;

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: user.organizationId,
        deletedAt: null,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      weather: searchParams.get("weather") || undefined,
      createdBy: searchParams.get("createdBy") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
    };

    // Validate filters
    const validationResult = dailyLogFilterSchema.safeParse(filters);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const validFilters = validationResult.data;
    const page = parseInt(validFilters.page);
    const limit = parseInt(validFilters.limit);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      projectId,
      deletedAt: null,
    };

    if (validFilters.startDate || validFilters.endDate) {
      where.date = {};
      if (validFilters.startDate) {
        where.date.gte = new Date(validFilters.startDate);
      }
      if (validFilters.endDate) {
        where.date.lte = new Date(validFilters.endDate);
      }
    }

    if (validFilters.weather) {
      where.weather = validFilters.weather;
    }

    if (validFilters.createdBy) {
      where.createdById = validFilters.createdBy;
    }

    // Get total count
    const total = await prisma.dailyLog.count({ where });

    // Get daily logs
    const logs = await prisma.dailyLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: "desc" }, // Most recent first
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Add photo count to each log
    const logsWithPhotoCount = logs.map((log) => ({
      ...log,
      photoCount: log.photos.length,
    }));

    return NextResponse.json({
      logs: logsWithPhotoCount,
      total,
      page,
      limit,
      hasMore: total > page * limit,
    });
  } catch (error: any) {
    console.error("List daily logs error:", error);
    captureException(error, {
      context: "daily-logs-list",
      projectId: context.params,
    });

    return NextResponse.json(
      { error: "Failed to fetch daily logs" },
      { status: 500 }
    );
  }
}
