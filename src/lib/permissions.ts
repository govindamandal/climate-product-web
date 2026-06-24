import type { User } from "@/lib/api";

export type Permission = keyof ReturnType<typeof permissionsFor>;

export function permissionsFor(user: User | null | undefined) {
  const role = user?.role;
  const isSuperAdmin = role === "super_admin";
  const isOrgAdmin = role === "org_admin";
  const isOrgUser = role === "org_user";
  const isTenantAdmin = isOrgAdmin || isSuperAdmin;

  return {
    isSuperAdmin,
    isOrgAdmin,
    isOrgUser,
    canAccessPlatform: isSuperAdmin,
    canInviteTeam: isTenantAdmin,
    canManageTeam: isTenantAdmin,
    canViewAuditTrail: isTenantAdmin,
    canCreateProducts: isOrgAdmin || isOrgUser,
    canUpdateProducts: isOrgAdmin || isOrgUser,
    canDeleteProducts: isTenantAdmin,
    canManageEnvironmentalRecords: isOrgAdmin || isOrgUser,
    canSharePassports: isTenantAdmin,
  };
}

export function roleLabel(user: User | null | undefined) {
  switch (user?.role) {
    case "super_admin":
      return "Super admin";
    case "org_admin":
      return "Organization admin";
    case "org_user":
      return "Organization user";
    default:
      return "Signed out";
  }
}
