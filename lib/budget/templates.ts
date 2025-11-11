/**
 * Budget Template Utilities
 *
 * Provides pre-defined budget templates for common construction project types.
 */

import { BudgetCategory } from "@prisma/client";

/**
 * Budget template line item interface
 */
export interface BudgetTemplateLineItem {
  category: BudgetCategory;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

/**
 * Budget template interface
 */
export interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  lineItems: BudgetTemplateLineItem[];
}

/**
 * Residential Remodel Budget Template
 * Standard template for home remodeling projects
 */
export const RESIDENTIAL_REMODEL_TEMPLATE: BudgetTemplate = {
  id: "residential-remodel",
  name: "Residential Remodel",
  description: "Standard budget template for home remodeling projects",
  lineItems: [
    // Labor
    {
      category: BudgetCategory.LABOR,
      description: "General Labor",
      quantity: 40,
      unit: "hours",
      unitCost: 50,
    },
    {
      category: BudgetCategory.LABOR,
      description: "Skilled Labor",
      quantity: 60,
      unit: "hours",
      unitCost: 75,
    },
    {
      category: BudgetCategory.LABOR,
      description: "Project Management",
      quantity: 20,
      unit: "hours",
      unitCost: 100,
    },

    // Materials
    {
      category: BudgetCategory.MATERIALS,
      description: "Lumber",
      quantity: 1,
      unit: "lot",
      unitCost: 2000,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Drywall",
      quantity: 20,
      unit: "sheets",
      unitCost: 15,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Paint & Supplies",
      quantity: 1,
      unit: "lot",
      unitCost: 500,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Flooring Materials",
      quantity: 500,
      unit: "sq ft",
      unitCost: 4,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Hardware & Fixtures",
      quantity: 1,
      unit: "lot",
      unitCost: 800,
    },

    // Subcontractors
    {
      category: BudgetCategory.SUBCONTRACTORS,
      description: "Electrical Work",
      quantity: 1,
      unit: "job",
      unitCost: 3000,
    },
    {
      category: BudgetCategory.SUBCONTRACTORS,
      description: "Plumbing Work",
      quantity: 1,
      unit: "job",
      unitCost: 2500,
    },
    {
      category: BudgetCategory.SUBCONTRACTORS,
      description: "HVAC Work",
      quantity: 1,
      unit: "job",
      unitCost: 4000,
    },

    // Equipment
    {
      category: BudgetCategory.EQUIPMENT,
      description: "Tool Rental",
      quantity: 1,
      unit: "month",
      unitCost: 500,
    },
    {
      category: BudgetCategory.EQUIPMENT,
      description: "Scaffolding Rental",
      quantity: 2,
      unit: "weeks",
      unitCost: 200,
    },

    // Permits & Fees
    {
      category: BudgetCategory.PERMITS_FEES,
      description: "Building Permit",
      quantity: 1,
      unit: "ea",
      unitCost: 500,
    },
    {
      category: BudgetCategory.PERMITS_FEES,
      description: "Inspection Fees",
      quantity: 1,
      unit: "ea",
      unitCost: 300,
    },

    // Contingency (typically 10% of subtotal)
    {
      category: BudgetCategory.CONTINGENCY,
      description: "Contingency Reserve (10%)",
      quantity: 1,
      unit: "lot",
      unitCost: 2500,
    },

    // Overhead (typically 5-10% of subtotal)
    {
      category: BudgetCategory.OVERHEAD,
      description: "Overhead & Administrative (5%)",
      quantity: 1,
      unit: "lot",
      unitCost: 1250,
    },

    // Profit (typically 10-20% of subtotal)
    {
      category: BudgetCategory.PROFIT,
      description: "Profit Margin (15%)",
      quantity: 1,
      unit: "lot",
      unitCost: 3750,
    },
  ],
};

/**
 * New Construction Budget Template
 * Template for new home construction projects
 */
export const NEW_CONSTRUCTION_TEMPLATE: BudgetTemplate = {
  id: "new-construction",
  name: "New Construction",
  description: "Budget template for new home construction projects",
  lineItems: [
    // Labor
    {
      category: BudgetCategory.LABOR,
      description: "Foundation Labor",
      quantity: 80,
      unit: "hours",
      unitCost: 60,
    },
    {
      category: BudgetCategory.LABOR,
      description: "Framing Labor",
      quantity: 120,
      unit: "hours",
      unitCost: 65,
    },
    {
      category: BudgetCategory.LABOR,
      description: "Finish Carpentry",
      quantity: 100,
      unit: "hours",
      unitCost: 70,
    },
    {
      category: BudgetCategory.LABOR,
      description: "Project Management",
      quantity: 40,
      unit: "hours",
      unitCost: 100,
    },

    // Materials
    {
      category: BudgetCategory.MATERIALS,
      description: "Concrete & Foundation",
      quantity: 1,
      unit: "lot",
      unitCost: 8000,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Lumber & Framing",
      quantity: 1,
      unit: "lot",
      unitCost: 15000,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Roofing Materials",
      quantity: 2000,
      unit: "sq ft",
      unitCost: 5,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Windows & Doors",
      quantity: 1,
      unit: "lot",
      unitCost: 8000,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Siding & Exterior",
      quantity: 1,
      unit: "lot",
      unitCost: 6000,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Insulation",
      quantity: 1,
      unit: "lot",
      unitCost: 3000,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Drywall",
      quantity: 100,
      unit: "sheets",
      unitCost: 15,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Flooring",
      quantity: 2000,
      unit: "sq ft",
      unitCost: 5,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Paint & Finishes",
      quantity: 1,
      unit: "lot",
      unitCost: 2000,
    },

    // Subcontractors
    {
      category: BudgetCategory.SUBCONTRACTORS,
      description: "Excavation & Site Work",
      quantity: 1,
      unit: "job",
      unitCost: 5000,
    },
    {
      category: BudgetCategory.SUBCONTRACTORS,
      description: "Electrical Installation",
      quantity: 1,
      unit: "job",
      unitCost: 12000,
    },
    {
      category: BudgetCategory.SUBCONTRACTORS,
      description: "Plumbing Installation",
      quantity: 1,
      unit: "job",
      unitCost: 10000,
    },
    {
      category: BudgetCategory.SUBCONTRACTORS,
      description: "HVAC Installation",
      quantity: 1,
      unit: "job",
      unitCost: 15000,
    },
    {
      category: BudgetCategory.SUBCONTRACTORS,
      description: "Drywall Installation",
      quantity: 1,
      unit: "job",
      unitCost: 8000,
    },

    // Equipment
    {
      category: BudgetCategory.EQUIPMENT,
      description: "Heavy Equipment Rental",
      quantity: 3,
      unit: "months",
      unitCost: 2000,
    },
    {
      category: BudgetCategory.EQUIPMENT,
      description: "Tool & Equipment Rental",
      quantity: 6,
      unit: "months",
      unitCost: 800,
    },

    // Permits & Fees
    {
      category: BudgetCategory.PERMITS_FEES,
      description: "Building Permit",
      quantity: 1,
      unit: "ea",
      unitCost: 2000,
    },
    {
      category: BudgetCategory.PERMITS_FEES,
      description: "Impact Fees",
      quantity: 1,
      unit: "ea",
      unitCost: 3000,
    },
    {
      category: BudgetCategory.PERMITS_FEES,
      description: "Inspection Fees",
      quantity: 1,
      unit: "ea",
      unitCost: 800,
    },

    // Contingency
    {
      category: BudgetCategory.CONTINGENCY,
      description: "Contingency Reserve (10%)",
      quantity: 1,
      unit: "lot",
      unitCost: 15000,
    },

    // Overhead
    {
      category: BudgetCategory.OVERHEAD,
      description: "Overhead & Administrative (5%)",
      quantity: 1,
      unit: "lot",
      unitCost: 7500,
    },

    // Profit
    {
      category: BudgetCategory.PROFIT,
      description: "Profit Margin (15%)",
      quantity: 1,
      unit: "lot",
      unitCost: 22500,
    },
  ],
};

/**
 * Commercial Build-Out Budget Template
 * Template for commercial interior build-out projects
 */
export const COMMERCIAL_BUILDOUT_TEMPLATE: BudgetTemplate = {
  id: "commercial-buildout",
  name: "Commercial Build-Out",
  description: "Budget template for commercial interior build-out projects",
  lineItems: [
    // Labor
    {
      category: BudgetCategory.LABOR,
      description: "General Labor",
      quantity: 100,
      unit: "hours",
      unitCost: 55,
    },
    {
      category: BudgetCategory.LABOR,
      description: "Skilled Trades",
      quantity: 80,
      unit: "hours",
      unitCost: 80,
    },

    // Materials
    {
      category: BudgetCategory.MATERIALS,
      description: "Framing & Drywall",
      quantity: 1,
      unit: "lot",
      unitCost: 5000,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Ceiling Systems",
      quantity: 1,
      unit: "lot",
      unitCost: 3000,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Flooring",
      quantity: 2000,
      unit: "sq ft",
      unitCost: 6,
    },
    {
      category: BudgetCategory.MATERIALS,
      description: "Paint & Finishes",
      quantity: 1,
      unit: "lot",
      unitCost: 2000,
    },

    // Subcontractors
    {
      category: BudgetCategory.SUBCONTRACTORS,
      description: "Electrical & Data",
      quantity: 1,
      unit: "job",
      unitCost: 15000,
    },
    {
      category: BudgetCategory.SUBCONTRACTORS,
      description: "Plumbing & HVAC",
      quantity: 1,
      unit: "job",
      unitCost: 12000,
    },
    {
      category: BudgetCategory.SUBCONTRACTORS,
      description: "Fire Suppression",
      quantity: 1,
      unit: "job",
      unitCost: 8000,
    },

    // Equipment
    {
      category: BudgetCategory.EQUIPMENT,
      description: "Equipment Rental",
      quantity: 2,
      unit: "months",
      unitCost: 1000,
    },

    // Permits & Fees
    {
      category: BudgetCategory.PERMITS_FEES,
      description: "Building Permit",
      quantity: 1,
      unit: "ea",
      unitCost: 1500,
    },

    // Contingency
    {
      category: BudgetCategory.CONTINGENCY,
      description: "Contingency Reserve (10%)",
      quantity: 1,
      unit: "lot",
      unitCost: 7000,
    },

    // Overhead
    {
      category: BudgetCategory.OVERHEAD,
      description: "Overhead (5%)",
      quantity: 1,
      unit: "lot",
      unitCost: 3500,
    },

    // Profit
    {
      category: BudgetCategory.PROFIT,
      description: "Profit Margin (15%)",
      quantity: 1,
      unit: "lot",
      unitCost: 10500,
    },
  ],
};

/**
 * Map of all available templates
 */
const TEMPLATES_MAP = {
  "residential-remodel": RESIDENTIAL_REMODEL_TEMPLATE,
  "new-construction": NEW_CONSTRUCTION_TEMPLATE,
  "commercial-buildout": COMMERCIAL_BUILDOUT_TEMPLATE,
};

/**
 * Get a budget template by ID
 * @param templateId - The template ID
 * @returns The budget template or null if not found
 */
export function getBudgetTemplate(templateId: string): BudgetTemplate | null {
  return TEMPLATES_MAP[templateId as keyof typeof TEMPLATES_MAP] || null;
}

/**
 * Get all available budget templates
 * @returns Array of all budget templates
 */
export function getAllBudgetTemplates(): BudgetTemplate[] {
  return Object.values(TEMPLATES_MAP);
}

/**
 * Get a list of template options for UI selection
 * @returns Array of template options with id, name, and description
 */
export function getBudgetTemplateOptions(): Array<{
  id: string;
  name: string;
  description: string;
}> {
  return getAllBudgetTemplates().map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
  }));
}
