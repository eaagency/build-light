/**
 * Budget Line Item API Routes
 * PATCH  /api/projects/[id]/budget/line-items/[itemId] - Update line item
 * DELETE /api/projects/[id]/budget/line-items/[itemId] - Delete line item (revised only)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { Role } from "@/lib/types";
import { captureException } from "@/lib/sentry";
import { enforceRateLimit } from "@/lib/rate-limit";
import { updateLineItemSchema } from "@/lib/validation/schemas";
import { calculateLineItemTotal } from "@/lib/budget/calculations";
import { ZodError } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * PATCH /api/projects/[id]/budget/line-items/[itemId]
 * Update a single line item in the revised budget
 * Requires PROJECT_MANAGER or higher role
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Standard for PATCH requests
    const rateLimitResponse = await enforceRateLimit(req, userId, "standard");
    if (rateLimitResponse) return rateLimitResponse;

    const { id: projectId, itemId } = await params;

    // Check permissions - only PROJECT_MANAGER+ can update line items
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

    // Get the line item
    const lineItem = await prisma.budgetLineItem.findUnique({
      where: {
        id: itemId,
        deletedAt: null,
      },
      include: {
        budget: true,
      },
    });

    if (!lineItem) {
      return NextResponse.json(
        { error: "Line item not found" },
        { status: 404 }
      );
    }

    // Verify the line item belongs to the correct project
    if (lineItem.budget.projectId !== projectId) {
      return NextResponse.json(
        { error: "Line item does not belong to this project" },
        { status: 403 }
      );
    }

    // Only allow updating revised budget line items
    if (lineItem.type === "original") {
      return NextResponse.json(
        { error: "Cannot update original budget line items - original budget is immutable" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateLineItemSchema.parse(body);

    // Update line item and recalculate totals
    const result = await prisma.$transaction(async (tx) => {
      // Calculate new values
      const quantity = validatedData.quantity ?? Number(lineItem.quantity);
      const unitCost = validatedData.unitCost ?? Number(lineItem.unitCost);
      const totalCost = calculateLineItemTotal(quantity, unitCost);
      const actualCost = Number(lineItem.actualCost);
      const variance = totalCost - actualCost;

      // Update the line item
      const updatedLineItem = await tx.budgetLineItem.update({
        where: { id: itemId },
        data: {
          category: validatedData.category,
          description: validatedData.description,
          quantity: validatedData.quantity !== undefined ? new Decimal(validatedData.quantity) : undefined,
          unit: validatedData.unit,
          unitCost: validatedData.unitCost !== undefined ? new Decimal(validatedData.unitCost) : undefined,
          totalCost: new Decimal(totalCost),
          variance: new Decimal(variance),
          notes: validatedData.notes,
        },
      });

      // Recalculate revised total
      const allRevisedItems = await tx.budgetLineItem.findMany({
        where: {
          budgetId: lineItem.budgetId,
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
      const budgetVariance = revisedTotal - actualTotal;
      const variancePercent =
        revisedTotal > 0 ? (budgetVariance / revisedTotal) * 100 : 0;

      // Update budget totals
      const updatedBudget = await tx.budget.update({
        where: { id: lineItem.budgetId },
        data: {
          revisedTotal: new Decimal(revisedTotal),
          actualTotal: new Decimal(actualTotal),
          variance: new Decimal(budgetVariance),
          variancePercent: new Decimal(variancePercent),
        },
      });

      return {
        lineItem: updatedLineItem,
        budget: updatedBudget,
      };
    });

    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error("Update line item error:", error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    captureException(error, {
      endpoint: "/api/projects/[id]/budget/line-items/[itemId]",
      method: "PATCH",
      projectId: (await params).id,
      itemId: (await params).itemId,
    });
    return NextResponse.json(
      { error: error.message || "Failed to update line item" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]/budget/line-items/[itemId]
 * Soft delete a line item from the revised budget
 * Cannot delete from original budget (immutable)
 * Requires PROJECT_MANAGER or higher role
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const userId = await requireAuth();

    // Rate limiting: Standard for DELETE requests
    const rateLimitResponse = await enforceRateLimit(req, userId, "standard");
    if (rateLimitResponse) return rateLimitResponse;

    const { id: projectId, itemId } = await params;

    // Check permissions - only PROJECT_MANAGER+ can delete line items
    const canDelete = await hasRole(Role.PROJECT_MANAGER);
    if (!canDelete) {
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

    // Get the line item
    const lineItem = await prisma.budgetLineItem.findUnique({
      where: {
        id: itemId,
        deletedAt: null,
      },
      include: {
        budget: true,
      },
    });

    if (!lineItem) {
      return NextResponse.json(
        { error: "Line item not found" },
        { status: 404 }
      );
    }

    // Verify the line item belongs to the correct project
    if (lineItem.budget.projectId !== projectId) {
      return NextResponse.json(
        { error: "Line item does not belong to this project" },
        { status: 403 }
      );
    }

    // Only allow deleting revised budget line items
    if (lineItem.type === "original") {
      return NextResponse.json(
        { error: "Cannot delete original budget line items - original budget is immutable" },
        { status: 403 }
      );
    }

    // Soft delete line item and recalculate totals
    const result = await prisma.$transaction(async (tx) => {
      // Soft delete the line item
      await tx.budgetLineItem.update({
        where: { id: itemId },
        data: {
          deletedAt: new Date(),
        },
      });

      // Recalculate revised total
      const allRevisedItems = await tx.budgetLineItem.findMany({
        where: {
          budgetId: lineItem.budgetId,
          type: "revised",
          deletedAt: null, // Only count non-deleted items
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
        where: { id: lineItem.budgetId },
        data: {
          revisedTotal: new Decimal(revisedTotal),
          actualTotal: new Decimal(actualTotal),
          variance: new Decimal(variance),
          variancePercent: new Decimal(variancePercent),
        },
      });

      return {
        budget: updatedBudget,
      };
    });

    return NextResponse.json({
      message: "Line item deleted successfully",
      budget: {
        id: result.budget.id,
        projectId: result.budget.projectId,
        originalTotal: Number(result.budget.originalTotal),
        revisedTotal: Number(result.budget.revisedTotal),
        actualTotal: Number(result.budget.actualTotal),
        variance: Number(result.budget.variance),
        variancePercent: Number(result.budget.variancePercent),
      },
    });
  } catch (error: any) {
    console.error("Delete line item error:", error);
    captureException(error, {
      endpoint: "/api/projects/[id]/budget/line-items/[itemId]",
      method: "DELETE",
      projectId: (await params).id,
      itemId: (await params).itemId,
    });
    return NextResponse.json(
      { error: error.message || "Failed to delete line item" },
      { status: 500 }
    );
  }
}
