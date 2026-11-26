/** Whether an account's roles make it an admin: admin or superadmin. */
export function isAdminRole(roles: string | null | undefined) {
  return roles === "admin" || roles === "superadmin"
}
