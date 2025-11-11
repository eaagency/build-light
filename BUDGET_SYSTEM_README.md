# Budget System Implementation

This document provides instructions for deploying the Budget System to your BuildLight environment.

## Overview

The Budget System tracks:
- **Original Budget**: Set once, immutable baseline (never changes)
- **Revised Budget**: Updates with change orders and client selections
- **Actual Costs**: Real expenses incurred
- **Variance**: Difference between revised and actual (positive = under budget, negative = over budget)
- **Alerts**: Triggers when more than 10% over budget

## Database Migration

Run the following command in your deployment environment to apply the database schema:

```bash
npx prisma migrate dev --name add-budget-system
npx prisma generate
```

If you encounter network issues with Prisma binaries, use:

```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma migrate dev --name add-budget-system
```

## API Endpoints

### Budget Management

1. **Create Budget** - `POST /api/projects/[id]/budget`
   - Sets original and initial revised budget
   - Requires: PROJECT_MANAGER+ role
   - Body: `{ lineItems: [{ category, description, quantity, unit, unitCost, notes? }] }`

2. **Get Budget** - `GET /api/projects/[id]/budget`
   - Returns budget with original and revised line items
   - Includes variance calculations and alert status
   - Any project member can view

3. **Update Budget** - `PATCH /api/projects/[id]/budget`
   - Updates revised budget line items
   - Original budget remains immutable
   - Requires: PROJECT_MANAGER+ role
   - Body: `{ lineItems: [{ id, category?, description?, quantity?, unitCost?, notes? }] }`

### Line Item Management

4. **Add Line Item** - `POST /api/projects/[id]/budget/line-items`
   - Adds new line item to revised budget
   - Requires: PROJECT_MANAGER+ role
   - Body: `{ category, description, quantity, unit, unitCost, notes? }`

5. **Update Line Item** - `PATCH /api/projects/[id]/budget/line-items/[itemId]`
   - Updates single line item in revised budget
   - Requires: PROJECT_MANAGER+ role
   - Body: `{ category?, description?, quantity?, unitCost?, notes? }`

6. **Delete Line Item** - `DELETE /api/projects/[id]/budget/line-items/[itemId]`
   - Soft deletes line item from revised budget
   - Cannot delete original budget items
   - Requires: PROJECT_MANAGER+ role

### Actuals Tracking

7. **Update Actuals** - `POST /api/projects/[id]/budget/actuals`
   - Updates actual costs for a line item
   - Recalculates variance and triggers alerts
   - Requires: PROJECT_MANAGER+ role
   - Body: `{ lineItemId, actualCost }`

## Budget Categories

- **LABOR**: Direct labor costs
- **MATERIALS**: Construction materials and supplies
- **SUBCONTRACTORS**: Subcontractor services
- **EQUIPMENT**: Equipment rental and purchase
- **PERMITS_FEES**: Permits, inspections, regulatory costs
- **CONTINGENCY**: Contingency fund for unexpected costs
- **OVERHEAD**: Administrative expenses
- **PROFIT**: Profit margin
- **OTHER**: Miscellaneous costs

## Utilities

### Calculation Utilities (`/lib/budget/calculations.ts`)

- `calculateLineItemTotal(quantity, unitCost)` - Calculate line item total
- `calculateBudgetTotal(lineItems)` - Sum all line items
- `calculateVariance(revised, actual)` - Calculate variance
- `calculateVariancePercent(variance, revised)` - Calculate percentage
- `calculateBudgetSummary(original, revised, actual)` - Complete summary with alerts
- `getCategoryBreakdown(lineItems)` - Totals by category

### Category Utilities (`/lib/budget/categories.ts`)

- `BUDGET_CATEGORIES` - Array of all categories with metadata
- `getCategoryLabel(category)` - Get display label
- `getCategoryIcon(category)` - Get emoji icon
- `getCategoryColor(category)` - Get hex color
- `getCategoryMetadata(category)` - Get complete metadata

### Template Utilities (`/lib/budget/templates.ts`)

Pre-defined budget templates:
- **Residential Remodel** - Home remodeling projects
- **New Construction** - New home construction
- **Commercial Build-Out** - Commercial interior projects

Functions:
- `getBudgetTemplate(templateId)` - Get template by ID
- `getAllBudgetTemplates()` - Get all templates
- `getBudgetTemplateOptions()` - Get template options for UI

## Key Features

### 1. Immutable Original Budget
The original budget is set once during creation and cannot be modified. This serves as the baseline for comparison.

### 2. Flexible Revised Budget
The revised budget can be updated with:
- Change orders
- Client selections
- New line items
- Updated quantities and costs

### 3. Variance Tracking
- **Positive variance**: Under budget (good)
- **Negative variance**: Over budget (needs attention)
- Variance calculated at both line item and budget level

### 4. Budget Alerts
Automatically triggers when:
- Variance exceeds -10% (configurable)
- Helps project managers stay on top of cost overruns

### 5. Category Breakdown
Track costs by category to understand where money is being spent:
- Labor vs Materials vs Subcontractors
- Identify cost drivers
- Optimize future budgets

## Security & Permissions

- **PROJECT_MANAGER+**: Create, update, delete budgets and line items
- **FIELD_WORKER**: View budget if project member
- **CLIENT**: View only (if enabled by project owner)
- **Rate Limiting**:
  - GET: 100 requests/hour (generous)
  - POST/PATCH/DELETE: 50 requests/hour (standard)

## Error Handling

All endpoints include:
- Zod validation for request bodies
- Sentry error tracking with context
- Proper HTTP status codes
- Detailed error messages

## Testing

Recommended test cases:

1. **Create Budget**: POST with 10 line items → verify totals
2. **Update Revised**: PATCH revised line item → verify original unchanged
3. **Add Actual Costs**: POST actuals → verify variance calculation
4. **Over Budget Alert**: Set actual > revised by 15% → verify alert triggers
5. **Immutable Original**: Try to PATCH original item → verify 403 error
6. **Client Access**: CLIENT role tries to view → verify permissions
7. **Delete Line Item**: DELETE revised item → verify totals recalculate
8. **Template Usage**: Use template to create budget → verify all items copied
9. **Variance Sign**: Test positive and negative variance scenarios
10. **Category Breakdown**: Verify category totals are accurate

## Next Steps

1. Run database migration
2. Test API endpoints with Postman or similar
3. Build frontend UI components for budget management
4. Integrate with change order system (future feature)
5. Add budget export functionality (CSV, PDF)
6. Create budget reports and analytics

## Support

For issues or questions:
- Check API error messages and Sentry logs
- Verify database migration completed successfully
- Ensure proper RBAC permissions configured
- Review rate limiting if requests are being throttled

---

**Implementation Complete**: All database schemas, API routes, validation schemas, and utility functions are ready for deployment.
