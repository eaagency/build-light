/**
 * Budget Category Utilities
 *
 * Provides category metadata, labels, icons, and colors for budget categories.
 */

import { BudgetCategory } from "@prisma/client";

/**
 * Budget category metadata interface
 */
export interface BudgetCategoryMetadata {
  value: BudgetCategory;
  label: string;
  icon: string;
  color: string;
  description: string;
}

/**
 * Complete list of budget categories with metadata
 */
export const BUDGET_CATEGORIES: BudgetCategoryMetadata[] = [
  {
    value: BudgetCategory.LABOR,
    label: "Labor",
    icon: "👷",
    color: "#3B82F6",
    description: "Direct labor costs including wages and benefits",
  },
  {
    value: BudgetCategory.MATERIALS,
    label: "Materials",
    icon: "🧱",
    color: "#10B981",
    description: "Construction materials and supplies",
  },
  {
    value: BudgetCategory.SUBCONTRACTORS,
    label: "Subcontractors",
    icon: "🔧",
    color: "#F59E0B",
    description: "Subcontractor services and fees",
  },
  {
    value: BudgetCategory.EQUIPMENT,
    label: "Equipment",
    icon: "🚜",
    color: "#8B5CF6",
    description: "Equipment rental and purchase costs",
  },
  {
    value: BudgetCategory.PERMITS_FEES,
    label: "Permits & Fees",
    icon: "📋",
    color: "#EF4444",
    description: "Building permits, inspection fees, and regulatory costs",
  },
  {
    value: BudgetCategory.CONTINGENCY,
    label: "Contingency",
    icon: "💰",
    color: "#14B8A6",
    description: "Contingency fund for unexpected costs",
  },
  {
    value: BudgetCategory.OVERHEAD,
    label: "Overhead",
    icon: "🏢",
    color: "#6366F1",
    description: "Overhead costs and administrative expenses",
  },
  {
    value: BudgetCategory.PROFIT,
    label: "Profit",
    icon: "📈",
    color: "#6BF178",
    description: "Profit margin",
  },
  {
    value: BudgetCategory.OTHER,
    label: "Other",
    icon: "📦",
    color: "#9CA3AF",
    description: "Miscellaneous costs not covered by other categories",
  },
];

/**
 * Get the display label for a budget category
 * @param category - The budget category enum value
 * @returns The human-readable label
 */
export function getCategoryLabel(category: BudgetCategory): string {
  const metadata = BUDGET_CATEGORIES.find((c) => c.value === category);
  return metadata?.label || category;
}

/**
 * Get the icon for a budget category
 * @param category - The budget category enum value
 * @returns The emoji icon
 */
export function getCategoryIcon(category: BudgetCategory): string {
  const metadata = BUDGET_CATEGORIES.find((c) => c.value === category);
  return metadata?.icon || "📦";
}

/**
 * Get the color for a budget category
 * @param category - The budget category enum value
 * @returns The hex color code
 */
export function getCategoryColor(category: BudgetCategory): string {
  const metadata = BUDGET_CATEGORIES.find((c) => c.value === category);
  return metadata?.color || "#9CA3AF";
}

/**
 * Get the description for a budget category
 * @param category - The budget category enum value
 * @returns The category description
 */
export function getCategoryDescription(category: BudgetCategory): string {
  const metadata = BUDGET_CATEGORIES.find((c) => c.value === category);
  return metadata?.description || "";
}

/**
 * Get all category metadata for a specific category
 * @param category - The budget category enum value
 * @returns Complete metadata object or default metadata
 */
export function getCategoryMetadata(
  category: BudgetCategory
): BudgetCategoryMetadata {
  const metadata = BUDGET_CATEGORIES.find((c) => c.value === category);
  return (
    metadata || {
      value: category,
      label: category,
      icon: "📦",
      color: "#9CA3AF",
      description: "",
    }
  );
}

/**
 * Get a list of all category values
 * @returns Array of BudgetCategory enum values
 */
export function getAllCategories(): BudgetCategory[] {
  return BUDGET_CATEGORIES.map((c) => c.value);
}

/**
 * Validate if a string is a valid budget category
 * @param value - The string to validate
 * @returns True if valid budget category
 */
export function isValidCategory(value: string): value is BudgetCategory {
  return getAllCategories().includes(value as BudgetCategory);
}
