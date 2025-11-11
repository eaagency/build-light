/**
 * Budget Calculation Utilities
 *
 * Provides functions for calculating budget totals, variances, and alerts.
 */

import { BudgetLineItem, Prisma } from "@prisma/client";

/**
 * Calculate the total cost for a single line item
 * @param quantity - The quantity of the item
 * @param unitCost - The cost per unit
 * @returns The total cost (quantity * unitCost)
 */
export function calculateLineItemTotal(
  quantity: number,
  unitCost: number
): number {
  return quantity * unitCost;
}

/**
 * Calculate the total budget from an array of line items
 * @param lineItems - Array of budget line items
 * @returns The sum of all line item totals
 */
export function calculateBudgetTotal(lineItems: BudgetLineItem[]): number {
  return lineItems.reduce((sum, item) => {
    return sum + Number(item.totalCost);
  }, 0);
}

/**
 * Calculate variance between revised and actual costs
 * @param revised - The revised budget amount
 * @param actual - The actual cost amount
 * @returns The variance (revised - actual)
 *          Positive = under budget, Negative = over budget
 */
export function calculateVariance(revised: number, actual: number): number {
  return revised - actual;
}

/**
 * Calculate variance as a percentage of the revised budget
 * @param variance - The variance amount
 * @param revised - The revised budget amount
 * @returns The variance percentage
 */
export function calculateVariancePercent(
  variance: number,
  revised: number
): number {
  if (revised === 0) return 0;
  return (variance / revised) * 100;
}

/**
 * Check if the budget is over budget
 * @param variance - The variance amount
 * @returns True if over budget (variance is negative)
 */
export function isOverBudget(variance: number): boolean {
  return variance < 0; // Negative variance means over budget
}

/**
 * Check if the variance should trigger an alert
 * Default threshold is -10% (more than 10% over budget)
 * @param variancePercent - The variance percentage
 * @param threshold - The alert threshold (default: -10)
 * @returns True if alert should be triggered
 */
export function shouldAlert(
  variancePercent: number,
  threshold: number = -10
): boolean {
  return variancePercent < threshold;
}

/**
 * Budget summary interface
 */
export interface BudgetSummary {
  originalTotal: number;
  revisedTotal: number;
  actualTotal: number;
  variance: number;
  variancePercent: number;
  isOverBudget: boolean;
  shouldAlert: boolean;
}

/**
 * Calculate a complete budget summary
 * @param originalTotal - The original budget total
 * @param revisedTotal - The revised budget total
 * @param actualTotal - The actual costs total
 * @param alertThreshold - The alert threshold (default: -10)
 * @returns Complete budget summary with all calculations
 */
export function calculateBudgetSummary(
  originalTotal: number,
  revisedTotal: number,
  actualTotal: number,
  alertThreshold: number = -10
): BudgetSummary {
  const variance = calculateVariance(revisedTotal, actualTotal);
  const variancePercent = calculateVariancePercent(variance, revisedTotal);

  return {
    originalTotal,
    revisedTotal,
    actualTotal,
    variance,
    variancePercent,
    isOverBudget: isOverBudget(variance),
    shouldAlert: shouldAlert(variancePercent, alertThreshold),
  };
}

/**
 * Calculate line item variance
 * @param totalCost - The budgeted total cost for the line item
 * @param actualCost - The actual cost for the line item
 * @returns The variance (totalCost - actualCost)
 */
export function calculateLineItemVariance(
  totalCost: number,
  actualCost: number
): number {
  return totalCost - actualCost;
}

/**
 * Calculate totals for a specific budget category
 * @param lineItems - Array of budget line items
 * @param category - The budget category to filter by
 * @returns Object with budgeted and actual totals for the category
 */
export function calculateCategoryTotals(
  lineItems: BudgetLineItem[],
  category: string
): { budgeted: number; actual: number; variance: number } {
  const categoryItems = lineItems.filter((item) => item.category === category);

  const budgeted = categoryItems.reduce(
    (sum, item) => sum + Number(item.totalCost),
    0
  );
  const actual = categoryItems.reduce(
    (sum, item) => sum + Number(item.actualCost),
    0
  );
  const variance = budgeted - actual;

  return { budgeted, actual, variance };
}

/**
 * Get category breakdown for the entire budget
 * @param lineItems - Array of budget line items
 * @returns Object with totals for each category
 */
export function getCategoryBreakdown(
  lineItems: BudgetLineItem[]
): Record<string, { budgeted: number; actual: number; variance: number }> {
  const categories = [
    "LABOR",
    "MATERIALS",
    "SUBCONTRACTORS",
    "EQUIPMENT",
    "PERMITS_FEES",
    "CONTINGENCY",
    "OVERHEAD",
    "PROFIT",
    "OTHER",
  ];

  const breakdown: Record<
    string,
    { budgeted: number; actual: number; variance: number }
  > = {};

  for (const category of categories) {
    breakdown[category] = calculateCategoryTotals(lineItems, category);
  }

  return breakdown;
}
