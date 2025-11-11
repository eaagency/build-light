/**
 * Budget Line Items API Routes
 * POST   /api/projects/[id]/budget/line-items - Add new line item to revised budget
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { Role } from "@/lib/types";
import { captureException } from "@/lib/sentry";
import { enforceRateLimit } from "@/lib/rate-limit";
import { budgetLineItemSchema } from "@/lib/validation/schemas";
import { calculateLineItemTotal } from "@/lib/budget/calculations";
import { ZodError } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * POST /api/projects/[id]/budget/line-items
 * Add a new line item to the revised budget
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

    // Check permissions - only PROJECT_MANAGER+ can add line items
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
          orderBy: {
            sortOrder: "desc",
          },
          take: 1,
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
    const validatedData = budgetLineItemSchema.parse(body);

    // Calculate line item total
    const totalCost = calculateLineItemTotal(
      validatedData.quantity,
      validatedData.unitCost
    );

    // Get the highest sort order for new item
    const maxSortOrder =
      budget.lineItems.length > 0 ? budget.lineItems[0].sortOrder : 0;
    const newSortOrder = maxSortOrder + 1;

    // Add line item and update budget totals in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the new line item
      const newLineItem = await tx.budgetLineItem.create({
        data: {
          budgetId: budget.id,
          category: validatedData.category,
          description: validatedData.description,
          quantity: new Decimal(validatedData.quantity),
          unit: validatedData.unit,
          unitCost: new Decimal(validatedData.unitCost),
          totalCost: new Decimal(totalCost),
          type: "revised",
          sortOrder: newSortOrder,
          notes: validatedData.notes,
          actualCost: new Decimal(0),
          variance: new Decimal(totalCost),
        },
      });

      // Recalculate revised total
      const allRevisedItems = await tx.budgetLineItem.findMany({
        where: {
          budgetId: budget.id,
          type: "revised",
          deletedAt: null,
        },
      });

      const revisedTotal = allRevisedItems.reduce(
        (sum, item) => sum + Number(item.totalCost),
        0
      );

      const actualTotal = allRevisedItems.reduce(
        (sum, item) => sum + Number(item.actualCost),
        0
      );

      // Calculate variance
      const variance = revisedTotal - actualTotal;
      const variancePercent =
        revisedTotal > 0 ? (variance / revisedTotal) * 100 : 0;

      // Update budget totals
      const updatedBudget = await tx.budget.update({
        where: { id: budget.id },
        data: {
          revisedTotal: new Decimal(revisedTotal),
          actualTotal: new Decimal(actualTotal),
          variance: new Decimal(variance),
          variancePercent: new Decimal(variancePercent),
        },
      });

      return {
        lineItem: newLineItem,
        budget: updatedBudget,
      };
    });

    return NextResponse.json(
      {
        lineItem: {
          id: result.lineItem.id,
          category: result.lineItem.category,
          description: result.lineItem.description,
          quantity: Number(result.lineItem.quantity),
          unit: result.lineItem.unit,
          unitCost: Number(result.lineItem.unitCost),
          totalCost: Number(result.lineItem.totalCost),
          actualCost: Number(result.lineItem.actualCost),
          variance: Number(result.lineItem.variance),
          notes: result.lineItem.notes,
          sortOrder: result.lineItem.sortOrder,
        },
        budget: {
          id: result.budget.id,
          projectId: result.budget.projectId,
          originalTotal: Number(result.budget.originalTotal),
          revisedTotal: Number(result.budget.revisedTotal),
          actualTotal: Number(result.budget.actualTotal),
          variance: Number(result.budget.variance),
          variancePercent: Number(result.budget.variancePercent),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Add line item error:", error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    captureException(error, {
      endpoint: "/api/projects/[id]/budget/line-items",
      method: "POST",
      projectId: (await params).id,
    });
    return NextResponse.json(
      { error: error.message || "Failed to add line item" },
      { status: 500 }
    );
  }
}
