/**
 * Budget API Routes
 * POST   /api/projects/[id]/budget - Create budget for project
 * GET    /api/projects/[id]/budget - Get budget for project
 * PATCH  /api/projects/[id]/budget - Update budget (revised only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { Role } from "@/lib/types";
import { captureException } from "@/lib/sentry";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  createBudgetSchema,
  updateBudgetSchema,
} from "@/lib/validation/schemas";
import {
  calculateLineItemTotal,
  calculateBudgetSummary,
} from "@/lib/budget/calculations";
import { ZodError } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * GET /api/projects/[id]/budget
 * Get budget for a project with all line items
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

    // Get budget with all line items
    const budget = await prisma.budget.findUnique({
      where: {
        projectId,
        deletedAt: null,
      },
      include: {
        lineItems: {
          where: {
            deletedAt: null,
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!budget) {
      return NextResponse.json(
        { error: "Budget not found for this project" },
        { status: 404 }
      );
    }

    // Calculate summary
    const summary = calculateBudgetSummary(
      Number(budget.originalTotal),
      Number(budget.revisedTotal),
      Number(budget.actualTotal)
    );

    // Separate original and revised line items
    const originalLineItems = budget.lineItems.filter(
      (item) => item.type === "original"
    );
    const revisedLineItems = budget.lineItems.filter(
      (item) => item.type === "revised"
    );

    return NextResponse.json({
      budget: {
        id: budget.id,
        projectId: budget.projectId,
        originalTotal: Number(budget.originalTotal),
        revisedTotal: Number(budget.revisedTotal),
        actualTotal: Number(budget.actualTotal),
        variance: Number(budget.variance),
        variancePercent: Number(budget.variancePercent),
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        originalLineItems: originalLineItems.map((item) => ({
          id: item.id,
          category: item.category,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
          actualCost: Number(item.actualCost),
          variance: Number(item.variance),
          notes: item.notes,
          sortOrder: item.sortOrder,
        })),
        revisedLineItems: revisedLineItems.map((item) => ({
          id: item.id,
          category: item.category,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
          actualCost: Number(item.actualCost),
          variance: Number(item.variance),
          notes: item.notes,
          sortOrder: item.sortOrder,
        })),
        summary,
      },
    });
  } catch (error: any) {
    console.error("Get budget error:", error);
    captureException(error, {
      endpoint: "/api/projects/[id]/budget",
      method: "GET",
      projectId: (await params).id,
    });
    return NextResponse.json(
      { error: error.message || "Failed to fetch budget" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/budget
 * Create a new budget for a project
 * Sets original budget (immutable) and initial revised budget
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

    // Check permissions - only PROJECT_MANAGER+ can create budgets
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

    // Check if budget already exists for this project
    const existingBudget = await prisma.budget.findUnique({
      where: {
        projectId,
      },
    });

    if (existingBudget) {
      return NextResponse.json(
        { error: "Budget already exists for this project" },
        { status: 409 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = createBudgetSchema.parse(body);

    // Calculate line item totals
    const lineItemsWithTotals = validatedData.lineItems.map(
      (item, index) => ({
        ...item,
        totalCost: calculateLineItemTotal(item.quantity, item.unitCost),
        type: "original",
        sortOrder: index,
      })
    );

    // Calculate total budget
    const totalBudget = lineItemsWithTotals.reduce(
      (sum, item) => sum + item.totalCost,
      0
    );

    // Create budget with line items in a transaction
    const budget = await prisma.$transaction(async (tx) => {
      // Create the budget
      const newBudget = await tx.budget.create({
        data: {
          projectId,
          originalTotal: new Decimal(totalBudget),
          revisedTotal: new Decimal(totalBudget), // Initially same as original
          actualTotal: new Decimal(0),
          variance: new Decimal(totalBudget),
          variancePercent: new Decimal(100),
        },
      });

      // Create original line items
      const originalLineItems = await Promise.all(
        lineItemsWithTotals.map((item) =>
          tx.budgetLineItem.create({
            data: {
              budgetId: newBudget.id,
              category: item.category,
              description: item.description,
              quantity: new Decimal(item.quantity),
              unit: item.unit,
              unitCost: new Decimal(item.unitCost),
              totalCost: new Decimal(item.totalCost),
              type: "original",
              sortOrder: item.sortOrder,
              notes: item.notes,
              actualCost: new Decimal(0),
              variance: new Decimal(item.totalCost),
            },
          })
        )
      );

      // Create revised line items (initially same as original)
      const revisedLineItems = await Promise.all(
        lineItemsWithTotals.map((item) =>
          tx.budgetLineItem.create({
            data: {
              budgetId: newBudget.id,
              category: item.category,
              description: item.description,
              quantity: new Decimal(item.quantity),
              unit: item.unit,
              unitCost: new Decimal(item.unitCost),
              totalCost: new Decimal(item.totalCost),
              type: "revised",
              sortOrder: item.sortOrder,
              notes: item.notes,
              actualCost: new Decimal(0),
              variance: new Decimal(item.totalCost),
            },
          })
        )
      );

      return {
        ...newBudget,
        originalLineItems,
        revisedLineItems,
      };
    });

    return NextResponse.json(
      {
        budget: {
          id: budget.id,
          projectId: budget.projectId,
          originalTotal: Number(budget.originalTotal),
          revisedTotal: Number(budget.revisedTotal),
          actualTotal: Number(budget.actualTotal),
          variance: Number(budget.variance),
          variancePercent: Number(budget.variancePercent),
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt,
          originalLineItems: budget.originalLineItems.map((item) => ({
            id: item.id,
            category: item.category,
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            unitCost: Number(item.unitCost),
            totalCost: Number(item.totalCost),
            actualCost: Number(item.actualCost),
            variance: Number(item.variance),
            notes: item.notes,
            sortOrder: item.sortOrder,
          })),
          revisedLineItems: budget.revisedLineItems.map((item) => ({
            id: item.id,
            category: item.category,
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            unitCost: Number(item.unitCost),
            totalCost: Number(item.totalCost),
            actualCost: Number(item.actualCost),
            variance: Number(item.variance),
            notes: item.notes,
            sortOrder: item.sortOrder,
          })),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create budget error:", error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    captureException(error, {
      endpoint: "/api/projects/[id]/budget",
      method: "POST",
      projectId: (await params).id,
    });
    return NextResponse.json(
      { error: error.message || "Failed to create budget" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/projects/[id]/budget
 * Update budget line items (revised budget only)
 * Original budget remains immutable
 * Requires PROJECT_MANAGER or higher role
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

    const { id: projectId } = await params;

    // Check permissions - only PROJECT_MANAGER+ can update budgets
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

    // Get existing budget
    const budget = await prisma.budget.findUnique({
      where: {
        projectId,
        deletedAt: null,
      },
      include: {
        lineItems: {
          where: {
            type: "revised",
            deletedAt: null,
          },
        },
      },
    });

    if (!budget) {
      return NextResponse.json(
        { error: "Budget not found for this project" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateBudgetSchema.parse(body);

    // Update line items and recalculate totals
    const updatedBudget = await prisma.$transaction(async (tx) => {
      // Update each line item
      const updatedLineItems = await Promise.all(
        validatedData.lineItems.map(async (item) => {
          const existingItem = budget.lineItems.find((li) => li.id === item.id);

          if (!existingItem) {
            throw new Error(`Line item ${item.id} not found`);
          }

          // Calculate new values
          const quantity = item.quantity ?? Number(existingItem.quantity);
          const unitCost = item.unitCost ?? Number(existingItem.unitCost);
          const totalCost = calculateLineItemTotal(quantity, unitCost);
          const actualCost = Number(existingItem.actualCost);
          const variance = totalCost - actualCost;

          return tx.budgetLineItem.update({
            where: { id: item.id },
            data: {
              category: item.category,
              description: item.description,
              quantity: item.quantity !== undefined ? new Decimal(item.quantity) : undefined,
              unit: item.unit,
              unitCost: item.unitCost !== undefined ? new Decimal(item.unitCost) : undefined,
              totalCost: new Decimal(totalCost),
              variance: new Decimal(variance),
              notes: item.notes,
            },
          });
        })
      );

      // Recalculate revised total
      const revisedTotal = updatedLineItems.reduce(
        (sum, item) => sum + Number(item.totalCost),
        0
      );

      // Recalculate actual total
      const actualTotal = updatedLineItems.reduce(
        (sum, item) => sum + Number(item.actualCost),
        0
      );

      // Calculate variance
      const variance = revisedTotal - actualTotal;
      const variancePercent =
        revisedTotal > 0 ? (variance / revisedTotal) * 100 : 0;

      // Update budget totals
      const updatedBudgetRecord = await tx.budget.update({
        where: { id: budget.id },
        data: {
          revisedTotal: new Decimal(revisedTotal),
          actualTotal: new Decimal(actualTotal),
          variance: new Decimal(variance),
          variancePercent: new Decimal(variancePercent),
        },
        include: {
          lineItems: {
            where: {
              deletedAt: null,
            },
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          },
        },
      });

      return updatedBudgetRecord;
    });

    // Calculate summary
    const summary = calculateBudgetSummary(
      Number(updatedBudget.originalTotal),
      Number(updatedBudget.revisedTotal),
      Number(updatedBudget.actualTotal)
    );

    // Separate original and revised line items
    const originalLineItems = updatedBudget.lineItems.filter(
      (item) => item.type === "original"
    );
    const revisedLineItems = updatedBudget.lineItems.filter(
      (item) => item.type === "revised"
    );

    return NextResponse.json({
      budget: {
        id: updatedBudget.id,
        projectId: updatedBudget.projectId,
        originalTotal: Number(updatedBudget.originalTotal),
        revisedTotal: Number(updatedBudget.revisedTotal),
        actualTotal: Number(updatedBudget.actualTotal),
        variance: Number(updatedBudget.variance),
        variancePercent: Number(updatedBudget.variancePercent),
        createdAt: updatedBudget.createdAt,
        updatedAt: updatedBudget.updatedAt,
        originalLineItems: originalLineItems.map((item) => ({
          id: item.id,
          category: item.category,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
          actualCost: Number(item.actualCost),
          variance: Number(item.variance),
          notes: item.notes,
          sortOrder: item.sortOrder,
        })),
        revisedLineItems: revisedLineItems.map((item) => ({
          id: item.id,
          category: item.category,
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          unitCost: Number(item.unitCost),
          totalCost: Number(item.totalCost),
          actualCost: Number(item.actualCost),
          variance: Number(item.variance),
          notes: item.notes,
          sortOrder: item.sortOrder,
        })),
        summary,
      },
    });
  } catch (error: any) {
    console.error("Update budget error:", error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    captureException(error, {
      endpoint: "/api/projects/[id]/budget",
      method: "PATCH",
      projectId: (await params).id,
    });
    return NextResponse.json(
      { error: error.message || "Failed to update budget" },
      { status: 500 }
    );
  }
}
