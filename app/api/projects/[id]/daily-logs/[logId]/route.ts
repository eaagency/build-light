/**
 * Daily Log Single Item API Routes
 * GET - Get single daily log
 * PATCH - Update daily log
 * DELETE - Delete daily log (soft delete + remove photos)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";
import { updateDailyLogSchema } from "@/lib/validation/schemas";
import { enforceRateLimit } from "@/lib/rate-limit";
import { captureException } from "@/lib/sentry";
import { deleteMultiplePhotos } from "@/lib/daily-logs/photo-upload";

const prisma = new PrismaClient();

/**
 * GET /api/projects/[id]/daily-logs/[logId]
 * Get single daily log with full details
 *
 * RBAC: Any project member
 * Rate Limit: Generous (100/10s)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; logId: string }> }
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

    const { id: projectId, logId } = await context.params;

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

    // Get daily log
    const dailyLog = await prisma.dailyLog.findFirst({
      where: {
        id: logId,
        projectId,
        deletedAt: null,
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

    if (!dailyLog) {
      return NextResponse.json(
        { error: "Daily log not found" },
        { status: 404 }
      );
    }

    // Add photo count
    const logWithPhotoCount = {
      ...dailyLog,
      photoCount: dailyLog.photos.length,
    };

    return NextResponse.json(logWithPhotoCount);
  } catch (error: any) {
    console.error("Get daily log error:", error);
    captureException(error, {
      context: "daily-logs-get",
      projectId: context.params,
    });

    return NextResponse.json(
      { error: "Failed to fetch daily log" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]/daily-logs/[logId]
 * Update daily log
 *
 * RBAC: PROJECT_MANAGER+ or log creator
 * Rate Limit: Standard (20/10s)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; logId: string }> }
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

    const { id: projectId, logId } = await context.params;

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

    // Get daily log
    const existingLog = await prisma.dailyLog.findFirst({
      where: {
        id: logId,
        projectId,
        deletedAt: null,
      },
    });

    if (!existingLog) {
      return NextResponse.json(
        { error: "Daily log not found" },
        { status: 404 }
      );
    }

    // Check permissions (PROJECT_MANAGER+ or creator can edit)
    const isProjectManager = ["OWNER", "PROJECT_MANAGER"].includes(user.role);
    const isCreator = existingLog.createdById === user.id;

    if (!isProjectManager && !isCreator) {
      return NextResponse.json(
        {
          error:
            "Insufficient permissions. Only project managers and the log creator can update this log.",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateDailyLogSchema.safeParse(body);

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

    // If assignedToId is being updated, verify the new user exists and has access
    if (data.assignedToId) {
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
    }

    // Update daily log
    const updateData: any = {};
    if (data.weather !== undefined) updateData.weather = data.weather;
    if (data.activities !== undefined) updateData.activities = data.activities;
    if (data.crewNotes !== undefined) updateData.crewNotes = data.crewNotes;
    if (data.photos !== undefined) updateData.photos = data.photos;
    if (data.assignedToId !== undefined)
      updateData.assignedToId = data.assignedToId;

    const updatedLog = await prisma.dailyLog.update({
      where: { id: logId },
      data: updateData,
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

    return NextResponse.json(updatedLog);
  } catch (error: any) {
    console.error("Update daily log error:", error);
    captureException(error, {
      context: "daily-logs-update",
      projectId: context.params,
    });

    return NextResponse.json(
      { error: "Failed to update daily log" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/daily-logs/[logId]
 * Delete daily log (soft delete)
 * Also deletes photos from Google Drive
 *
 * RBAC: PROJECT_MANAGER+ or OWNER only
 * Rate Limit: Standard (20/10s)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; logId: string }> }
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

    // Check role (PROJECT_MANAGER+ or OWNER only)
    const allowedRoles = ["OWNER", "PROJECT_MANAGER"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          error:
            "Insufficient permissions. Only owners and project managers can delete daily logs.",
        },
        { status: 403 }
      );
    }

    const { id: projectId, logId } = await context.params;

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

    // Get daily log
    const dailyLog = await prisma.dailyLog.findFirst({
      where: {
        id: logId,
        projectId,
        deletedAt: null,
      },
    });

    if (!dailyLog) {
      return NextResponse.json(
        { error: "Daily log not found" },
        { status: 404 }
      );
    }

    // Soft delete the log
    await prisma.dailyLog.update({
      where: { id: logId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Delete photos from Google Drive (async, don't block response)
    if (dailyLog.photos.length > 0) {
      // Fire and forget - don't wait for photo deletion
      deleteMultiplePhotos(dailyLog.photos).catch((error) => {
        console.error("Failed to delete photos:", error);
        captureException(error, {
          context: "daily-logs-photo-cleanup",
          logId,
          photoCount: dailyLog.photos.length,
        });
      });
    }

    return NextResponse.json({ message: "Daily log deleted successfully" });
  } catch (error: any) {
    console.error("Delete daily log error:", error);
    captureException(error, {
      context: "daily-logs-delete",
      projectId: context.params,
    });

    return NextResponse.json(
      { error: "Failed to delete daily log" },
      { status: 500 }
    );
  }
}
