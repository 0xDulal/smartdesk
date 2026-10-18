import type { User } from "@supabase/supabase-js";

export function isStaffUser(user: User | null | undefined): boolean {
  if (!user) return false;
  const role = user.app_metadata?.role || user.user_metadata?.role;
  if (typeof role === "string") {
    return role.toLowerCase().trim() === "staff";
  }
  return false;
}

export const isAdminUser = isStaffUser;
