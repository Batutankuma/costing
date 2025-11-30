type Role = "ADMIN" | "COMMERCIAL";

// Simple resource-based ACL. If no role provided, allow for now (backward compatible).
export function hasAccess(role: Role | null | undefined, resource: "user" | "client"): boolean {
  if (!role) return true;
  if (role === "ADMIN") return true;
  if (role === "COMMERCIAL") {
    if (resource === "client") return true; // commerciaux gèrent les clients
    if (resource === "user") return false; // pas de gestion des utilisateurs
  }
  return false;
}


