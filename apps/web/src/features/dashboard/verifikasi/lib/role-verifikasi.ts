const roleMap: Record<string, string> = {
  SUPERADMIN: "SUPER_ADMIN",
  EXECUTIVE: "DIREKSI",
  VERIFIKATOR_3: "SENIOR_MANAGER",
  VERIFIKATOR_2: "MANAGER",
  VERIFIKATOR_1: "SUPERVISOR",
  STAFF_ADMIN_BILLING: "STAFF",
};

export function roleVerifikasi(role: string | null | undefined): string {
  if (!role) return "";
  return roleMap[role] ?? role;
}
