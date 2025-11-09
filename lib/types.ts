/**
 * BuildLight Type Definitions
 * These match the Prisma schema enums
 */

export enum Role {
  OWNER = "OWNER",
  PROJECT_MANAGER = "PROJECT_MANAGER",
  FIELD_WORKER = "FIELD_WORKER",
  SUBCONTRACTOR = "SUBCONTRACTOR",
  CLIENT = "CLIENT",
}

export enum Plan {
  STARTER = "STARTER",
  PRO = "PRO",
}

export enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  TRIALING = "TRIALING",
  PAST_DUE = "PAST_DUE",
  CANCELED = "CANCELED",
  INCOMPLETE = "INCOMPLETE",
  INCOMPLETE_EXPIRED = "INCOMPLETE_EXPIRED",
  UNPAID = "UNPAID",
}

export enum ProjectStatus {
  PLANNING = "PLANNING",
  IN_PROGRESS = "IN_PROGRESS",
  ON_HOLD = "ON_HOLD",
  COMPLETED = "COMPLETED",
  ARCHIVED = "ARCHIVED",
}
