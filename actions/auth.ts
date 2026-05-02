"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUserProfile, getRoleHome } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ."),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự."),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Tên phải có ít nhất 2 ký tự."),
  email: z.string().email("Email không hợp lệ."),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự."),
});

function toErrorUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(toErrorUrl("/login", parsed.error.issues[0]?.message ?? "Dữ liệu đăng nhập không hợp lệ."));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(toErrorUrl("/login", "Email hoặc mật khẩu không đúng."));
  }

  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect(toErrorUrl("/login", "Tài khoản chưa có hồ sơ hệ thống. Hãy kiểm tra lại Supabase trigger."));
  }

  redirect(getRoleHome(profile.role));
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(toErrorUrl("/register", parsed.error.issues[0]?.message ?? "Dữ liệu đăng ký không hợp lệ."));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
      },
    },
  });

  if (error) {
    redirect(toErrorUrl("/register", error.message));
  }

  redirect("/login?message=Đăng ký thành công. Hãy đăng nhập để tiếp tục.");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}