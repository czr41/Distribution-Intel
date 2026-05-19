import type { UserRole } from "../domain/types";

export type Permission =
  | "manage_system"
  | "manage_master_data"
  | "review_verification_queue"
  | "approve_reports"
  | "view_internal_dashboards"
  | "view_brand_dashboards"
  | "download_reports"
  | "send_field_messages";

const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    "manage_system",
    "manage_master_data",
    "review_verification_queue",
    "approve_reports",
    "view_internal_dashboards",
    "view_brand_dashboards",
    "download_reports",
    "send_field_messages",
  ],
  operations_manager: [
    "manage_master_data",
    "review_verification_queue",
    "approve_reports",
    "view_internal_dashboards",
    "view_brand_dashboards",
    "download_reports",
  ],
  admin_operator: ["manage_master_data", "review_verification_queue", "view_internal_dashboards"],
  field_executive: ["send_field_messages"],
  brand_partner_viewer: ["view_brand_dashboards", "download_reports"],
  brand_partner_manager: ["view_brand_dashboards", "download_reports"],
};

export function can(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

export function assertBrandAccess(params: {
  userRole: UserRole;
  assignedBrandIds: string[];
  requestedBrandId: string;
}): boolean {
  if (params.userRole === "super_admin" || params.userRole === "operations_manager") {
    return true;
  }

  if (params.userRole === "brand_partner_viewer" || params.userRole === "brand_partner_manager") {
    return params.assignedBrandIds.includes(params.requestedBrandId);
  }

  return false;
}
