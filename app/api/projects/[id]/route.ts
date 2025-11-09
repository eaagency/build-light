import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireOrg, hasRole } from "@/lib/auth";
import { Role } from "@/lib/types";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/projects/[id]
 * Get a single project by ID
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

    const orgId = await requireOrg();
    const { id } = await params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get project
    const project = await prisma.project.findFirst({
      where: {
        id,
        organizationId: orgId,
        deletedAt: null,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
        schedules: {
          include: {
            tasks: true,
          },
        },
        dailyLogs: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            date: "desc",
          },
        },
        documents: {
          include: {
            uploadedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user has access to this project
    const canViewAll = await hasRole(Role.PROJECT_MANAGER);
    const isMember = project.members.some((m: any) => m.userId === user.id);

    if (!canViewAll && !isMember) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error("Get project error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch project" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]
 * Update a project
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Standard for PATCH requests
    const rateLimitResponse = await enforceRateLimit(req, userId, "standard");
    if (rateLimitResponse) return rateLimitResponse;

    const orgId = await requireOrg();
    const { id } = await params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get project to check permissions
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        organizationId: orgId,
        deletedAt: null,
      },
      include: {
        members: true,
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check permissions - must be project manager or assigned to project as PM
    const canEditAll = await hasRole(Role.PROJECT_MANAGER);
    const isProjectManager = existingProject.members.some(
      (m: any) => m.userId === user.id && m.role === Role.PROJECT_MANAGER
    );

    if (!canEditAll && !isProjectManager) {
      return NextResponse.json(
        { error: "Insufficient permissions to edit this project" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      address,
      description,
      clientName,
      clientEmail,
      clientPhone,
      startDate,
      endDate,
      budget,
      status,
    } = body;

    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(description !== undefined && { description }),
        ...(clientName !== undefined && { clientName }),
        ...(clientEmail !== undefined && { clientEmail }),
        ...(clientPhone !== undefined && { clientPhone }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(budget !== undefined && {
          budget: budget ? parseFloat(budget) : null,
        }),
        ...(status && { status }),
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ project });
  } catch (error: any) {
    console.error("Update project error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update project" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Soft delete a project
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Strict for DELETE requests (sensitive operation)
    const rateLimitResponse = await enforceRateLimit(req, userId, "strict");
    if (rateLimitResponse) return rateLimitResponse;

    const orgId = await requireOrg();
    const { id } = await params;

    // Only owners can delete projects
    const isOwner = await hasRole(Role.OWNER);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Insufficient permissions - OWNER role required" },
        { status: 403 }
      );
    }

    // Get project to ensure it exists
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        organizationId: orgId,
        deletedAt: null,
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Soft delete the project
    await prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    console.error("Delete project error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete project" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
