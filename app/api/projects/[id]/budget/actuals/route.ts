/**
 * Budget Actuals API Routes
 * POST   /api/projects/[id]/budget/actuals - Update actual costs for line items
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hasRole } from "@/lib/auth";
import { Role } from "@/lib/types";
import { captureException } from "@/lib/sentry";
import { enforceRateLimit } from "@/lib/rate-limit";
import { updateActualsSchema } from "@/lib/validation/schemas";
import { calculateBudgetSummary } from "@/lib/budget/calculations";
import { ZodError } from "zod";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * POST /api/projects/[id]/budget/actuals
 * Update actual costs for a budget line item
 * Recalculates variance and triggers alerts if over budget
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

    // Check permissions - only PROJECT_MANAGER+ can update actuals
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

    // Parse and validate request body
    const body = await req.json();
    const validatedData = updateActualsSchema.parse(body);

    // Get the line item
    const lineItem = await prisma.budgetLineItem.findUnique({
      where: {
        id: validatedData.lineItemId,
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

    // Update actuals and recalculate variance
    const result = await prisma.$transaction(async (tx) => {
      // Calculate line item variance
      const totalCost = Number(lineItem.totalCost);
      const actualCost = validatedData.actualCost;
      const lineItemVariance = totalCost - actualCost;

      // Update the line item actual cost and variance
      const updatedLineItem = await tx.budgetLineItem.update({
        where: { id: validatedData.lineItemId },
        data: {
          actualCost: new Decimal(actualCost),
          variance: new Decimal(lineItemVariance),
        },
      });

      // Get all revised line items to recalculate budget totals
      const allRevisedItems = await tx.budgetLineItem.findMany({
        where: {
          budgetId: lineItem.budgetId,
          type: "revised",
          deletedAt: null,
        },
      });

      // Recalculate budget totals
      const revisedTotal = allRevisedItems.reduce(
        (sum, item) => sum + Number(item.totalCost),
        0
      );

      const actualTotal = allRevisedItems.reduce(
        (sum, item) =>
          sum +
          Number(
            item.id === validatedData.lineItemId
              ? actualCost
              : item.actualCost
          ),
        0
      );

      // Calculate budget variance
      const budgetVariance = revisedTotal - actualTotal;
      const variancePercent =
        revisedTotal > 0 ? (budgetVariance / revisedTotal) * 100 : 0;

      // Update budget totals
      const updatedBudget = await tx.budget.update({
        where: { id: lineItem.budgetId },
        data: {
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

    // Calculate summary with alerts
    const summary = calculateBudgetSummary(
      Number(result.budget.originalTotal),
      Number(result.budget.revisedTotal),
      Number(result.budget.actualTotal)
    );

    // Check if alert should be triggered
    const alertTriggered = summary.shouldAlert;
    const alertMessage = alertTriggered
      ? `Budget alert: Project is ${Math.abs(summary.variancePercent).toFixed(
          1
        )}% over budget`
      : null;

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
      summary,
      alert: alertTriggered
        ? {
            triggered: true,
            message: alertMessage,
            variancePercent: summary.variancePercent,
          }
        : {
            triggered: false,
            message: null,
            variancePercent: summary.variancePercent,
          },
    });
  } catch (error: any) {
    console.error("Update actuals error:", error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    captureException(error, {
      endpoint: "/api/projects/[id]/budget/actuals",
      method: "POST",
      projectId: (await params).id,
    });
    return NextResponse.json(
      { error: error.message || "Failed to update actual costs" },
      { status: 500 }
    );
  }
}
