import { HeartPulse, ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.22),transparent_34%),linear-gradient(135deg,rgba(239,246,255,0.94),rgba(255,255,255,1)_48%,rgba(219,234,254,0.7))] dark:bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_34%),linear-gradient(135deg,rgba(15,23,42,1),rgba(2,6,23,1)_48%,rgba(15,23,42,1))]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 size-128 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="absolute right-5 top-5 z-20">
        <ThemeToggle />
      </div>

      <section className="relative z-10 w-full max-w-115">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex size-16 items-center justify-center rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/25">
            <HeartPulse className="size-8" />
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Home Care Station
          </h1>

          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Đăng nhập để tiếp tục vào hệ thống chăm sóc tại gia.
          </p>
        </div>

        <div className="rounded-4xl border border-white/70 bg-white/55 p-3 shadow-2xl shadow-primary/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/45">
          <div className="rounded-[1.55rem] border border-white/70 bg-white/60 px-7 py-8 shadow-inner backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:px-9 sm:py-9">
            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Đăng nhập
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Đăng nhập để truy cập vào tài khoản
              </p>
            </div>

            <div className="[&_form]:space-y-4 [&_input]:h-11 [&_input]:rounded-2xl [&_input]:border-white/70 [&_input]:bg-white/55 [&_input]:px-4 [&_input]:shadow-inner [&_input]:backdrop-blur [&_input]:transition [&_input]:placeholder:text-muted-foreground/70 [&_input:focus-visible]:ring-2 [&_input:focus-visible]:ring-primary/30 [&_button[type='submit']]:h-11 [&_button[type='submit']]:rounded-2xl [&_button[type='submit']]:shadow-lg [&_button[type='submit']]:shadow-primary/20">
              <LoginForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}