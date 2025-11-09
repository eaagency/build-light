import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireOrg, hasRole } from "@/lib/auth";
import { Role } from "@/lib/types";
import { captureException } from "@/lib/sentry";

/**
 * GET /api/projects
 * List all projects for the current user's organization
 */
export async function GET() {
  try {
    const userId = await requireAuth();
    const orgId = await requireOrg();

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get projects based on role
    let projects;

    const canViewAll = await hasRole(Role.PROJECT_MANAGER);

    if (canViewAll) {
      // Owners and Project Managers can see all org projects
      projects = await prisma.project.findMany({
        where: {
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
                },
              },
            },
          },
          _count: {
            select: {
              dailyLogs: true,
              documents: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
    } else {
      // Field workers, subcontractors, and clients only see projects they're assigned to
      const projectMembers = await prisma.projectMember.findMany({
        where: {
          userId: user.id,
        },
        include: {
          project: {
            where: {
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
                    },
                  },
                },
              },
              _count: {
                select: {
                  dailyLogs: true,
                  documents: true,
                },
              },
            },
          },
        },
      });

      projects = projectMembers
        .map((pm: any) => pm.project)
        .filter((p: any) => p !== null);
    }

    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error("Get projects error:", error);
    captureException(error, {
      endpoint: "/api/projects",
      method: "GET",
    });
    return NextResponse.json(
      { error: error.message || "Failed to fetch projects" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const orgId = await requireOrg();

    // Only owners and project managers can create projects
    const canCreate = await hasRole(Role.PROJECT_MANAGER);
    if (!canCreate) {
      return NextResponse.json(
        { error: "Insufficient permissions - PROJECT_MANAGER role required" },
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

    // Validation
    if (!name || !address) {
      return NextResponse.json(
        { error: "Name and address are required" },
        { status: 400 }
      );
    }

    // Get user for creating project member
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create project with creator as a member
    const project = await prisma.project.create({
      data: {
        name,
        address,
        description,
        clientName,
        clientEmail,
        clientPhone,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? parseFloat(budget) : null,
        status: status || "PLANNING",
        organizationId: orgId,
        members: {
          create: {
            userId: user.id,
            role: user.role,
          },
        },
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

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    console.error("Create project error:", error);
    captureException(error, {
      endpoint: "/api/projects",
      method: "POST",
    });
    return NextResponse.json(
      { error: error.message || "Failed to create project" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
