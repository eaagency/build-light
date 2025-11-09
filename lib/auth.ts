import { auth, clerkClient } from "@clerk/nextjs/server";
import { Role } from "./types";

/**
 * Get the current user's role from their Clerk organization membership
 * Maps Clerk organization roles to our database Role enum
 */
export async function getCurrentUserRole(): Promise<Role | null> {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId || !orgRole) {
    return null;
  }

  // Map Clerk organization roles to our database Role enum
  const roleMap: Record<string, Role> = {
    "org:owner": Role.OWNER,
    "org:project_manager": Role.PROJECT_MANAGER,
    "org:field_worker": Role.FIELD_WORKER,
    "org:subcontractor": Role.SUBCONTRACTOR,
    "org:client": Role.CLIENT,
  };

  return roleMap[orgRole] || Role.FIELD_WORKER;
}

/**
 * Check if the current user has the required role
 * @param requiredRole - The minimum role required
 * @returns true if user has the required role or higher
 */
export async function hasRole(requiredRole: Role): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  if (!userRole) return false;

  // Role hierarchy (higher number = more permissions)
  const roleHierarchy: Record<Role, number> = {
    [Role.CLIENT]: 1,
    [Role.SUBCONTRACTOR]: 2,
    [Role.FIELD_WORKER]: 3,
    [Role.PROJECT_MANAGER]: 4,
    [Role.OWNER]: 5,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if the current user is an owner
 */
export async function isOwner(): Promise<boolean> {
  return hasRole(Role.OWNER);
}

/**
 * Check if the current user is a project manager or higher
 */
export async function isProjectManager(): Promise<boolean> {
  return hasRole(Role.PROJECT_MANAGER);
}

/**
 * Get the current user's organization ID
 */
export async function getCurrentOrgId(): Promise<string | null> {
  const { orgId } = await auth();
  return orgId || null;
}

/**
 * Get the current user's Clerk ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId || null;
}

/**
 * Get organization members with their roles
 */
export async function getOrganizationMembers(orgId: string) {
  const client = await clerkClient();
  const { data: members } = await client.organizations.getOrganizationMembershipList({
    organizationId: orgId,
  });

  return members.map((member) => ({
    id: member.publicUserData?.userId,
    email: member.publicUserData?.identifier,
    name: `${member.publicUserData?.firstName || ""} ${member.publicUserData?.lastName || ""}`.trim(),
    role: member.role,
    imageUrl: member.publicUserData?.imageUrl,
  }));
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized - Please sign in");
  }
  return userId;
}

/**
 * Require organization - throws error if not in an organization
 */
export async function requireOrg() {
  const { orgId } = await auth();
  if (!orgId) {
    throw new Error("No organization - Please create or join an organization");
  }
  return orgId;
}

/**
 * Require specific role - throws error if user doesn't have the role
 */
export async function requireRole(role: Role) {
  const hasRequiredRole = await hasRole(role);
  if (!hasRequiredRole) {
    throw new Error(`Insufficient permissions - ${role} role required`);
  }
}
