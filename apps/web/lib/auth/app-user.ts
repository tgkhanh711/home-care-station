import "server-only";
import type { AppRole } from "@/lib/constants";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AuthenticatedAppUser = {
  id: string;
  email: string;
  role: AppRole;
};

export async function getAppUserById(
  userId: string
): Promise<AuthenticatedAppUser | null> {
  const supabaseAdmin = createSupabaseAdminClient();

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id,email,role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    role: data.role as AppRole
  };
}