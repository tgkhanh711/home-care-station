import "server-only";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/constants";
import { ROLE_HOME_ROUTE } from "@/lib/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAppUserById, type AuthenticatedAppUser } from "@/lib/auth/app-user";

export async function requireRole(
  allowedRoles: AppRole[]
): Promise<AuthenticatedAppUser> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const appUser = await getAppUserById(user.id);

  if (!appUser) {
    redirect("/login?error=missing-profile");
  }

  if (!allowedRoles.includes(appUser.role)) {
    redirect(ROLE_HOME_ROUTE[appUser.role]);
  }

  return appUser;
}