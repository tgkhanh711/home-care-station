import Link from "next/link";
import { ArrowLeft, HeartPulse, UserPlus } from "lucide-react";

import { RegisterCaregiverForm } from "@/components/auth/register-caregiver-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function getDoctorOptions() {
  try {
    const supabaseAdmin = createSupabaseAdminClient();

    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name")
      .eq("role", "doctor")
      .order("full_name", { ascending: true });

    if (error) {
      return [];
    }

    return (data ?? []).map((doctor) => ({
      id: String(doctor.id),
      email: String(doctor.email ?? ""),
      fullName: String(doctor.full_name ?? doctor.email ?? "Bác sĩ")
    }));
  } catch {
    return [];
  }
}

export default async function RegisterPage() {
  const doctorOptions = await getDoctorOptions();

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.22),transparent_34%),linear-gradient(135deg,rgba(239,246,255,0.94),rgba(255,255,255,1)_48%,rgba(219,234,254,0.7))] dark:bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_34%),linear-gradient(135deg,rgba(2,6,23,1),rgba(15,23,42,1)_48%,rgba(8,47,73,0.72))]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 h-140 w-140 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col">
        <header className="relative left-1/2 mb-10 w-[calc(100vw-96px)] -translate-x-1/2">
          <div className="flex w-full items-center justify-between">
            <Link href="/login" className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <HeartPulse className="size-6" />
              </div>

              <div>
                <p className="text-base font-semibold leading-none text-foreground">
                  Home Care Station
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  AIoT elderly care
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <ThemeToggle />

              <Link
                href="/login"
                className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border bg-background/70 px-4 text-sm font-medium text-foreground shadow-sm backdrop-blur transition hover:bg-muted"
              >
                <ArrowLeft className="size-4" />
                Về đăng nhập
              </Link>
            </div>
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center pb-8">
          <div className="w-full max-w-4xl">
            <div className="mb-7 flex flex-col items-center text-center">
              <div className="mb-5 flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/25">
                <UserPlus className="size-8" />
              </div>

              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                ĐĂNG KÍ NGƯỜI NHÀ
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Tạo tài khoản người nhà, hồ sơ người cao tuổi và tài khoản
                Station để chuẩn bị cho dashboard chăm sóc tại gia.
              </p>
            </div>

            <div className="rounded-4xl border border-white/70 bg-white/55 p-3 shadow-2xl shadow-primary/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/45">
              <div className="rounded-[1.55rem] border border-white/70 bg-white/70 px-6 py-7 shadow-inner backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
                <div className="[&_form]:space-y-6 [&_h2]:text-xl [&_h2]:font-semibold [&_label]:text-sm [&_label]:font-medium [&_input]:h-12 [&_input]:rounded-2xl [&_input]:border-border [&_input]:bg-white/70 [&_input]:px-4 [&_input]:text-base [&_input]:shadow-inner [&_input]:backdrop-blur [&_input]:transition [&_input]:placeholder:text-muted-foreground/70 [&_input:focus-visible]:ring-2 [&_input:focus-visible]:ring-primary/30 [&_textarea]:min-h-32 [&_textarea]:rounded-2xl [&_textarea]:border-border [&_textarea]:bg-white/70 [&_textarea]:px-4 [&_textarea]:py-3 [&_textarea]:text-base [&_textarea]:shadow-inner [&_textarea]:backdrop-blur [&_textarea]:transition [&_textarea]:placeholder:text-muted-foreground/70 [&_textarea:focus-visible]:ring-2 [&_textarea:focus-visible]:ring-primary/30 [&_button[type='submit']]:h-12 [&_button[type='submit']]:rounded-2xl [&_button[type='submit']]:text-base [&_button[type='submit']]:font-semibold [&_button[type='submit']]:shadow-lg [&_button[type='submit']]:shadow-primary/20 dark:[&_input]:bg-slate-950/60 dark:[&_textarea]:bg-slate-950/60">
                  <RegisterCaregiverForm doctorOptions={doctorOptions} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}