import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export const appRoles = ["admin", "caregiver", "doctor", "station"] as const;

export type AppRole = (typeof appRoles)[number];

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  phone: string | null;
};

export function getRoleHome(role: AppRole) {
  if (role === "admin") return "/admin";
  if (role === "doctor") return "/doctor";
  if (role === "station") return "/station";
  return "/caregiver";
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id,email,full_name,role,phone")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return data as UserProfile;
}

export async function requireUserProfile() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}

export async function requireRole(allowedRoles: AppRole[]) {
  const profile = await requireUserProfile();

  if (!allowedRoles.includes(profile.role)) {
    redirect(getRoleHome(profile.role));
  }

  return profile;
}