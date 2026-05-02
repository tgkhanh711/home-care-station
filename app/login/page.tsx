import Link from "next/link";
import { redirect } from "next/navigation";

import { loginAction } from "@/actions/auth";
import { getCurrentUserProfile, getRoleHome } from "@/lib/auth/session";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const profile = await getCurrentUserProfile();

  if (profile) {
    redirect(getRoleHome(profile.role));
  }

  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-md rounded-4xl border border-black/10 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-black/50">
            Home Care Station
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-black">
            Đăng nhập
          </h1>
          <p className="mt-3 text-sm leading-6 text-black/60">
            Vào đúng dashboard theo vai trò: admin, bác sĩ, người nhà hoặc station.
          </p>
        </div>

        {params.error ? (
          <div className="mb-5 rounded-2xl border border-black bg-black px-4 py-3 text-sm text-white">
            {params.error}
          </div>
        ) : null}

        {params.message ? (
          <div className="mb-5 rounded-2xl border border-black/10 bg-black/3 px-4 py-3 text-sm text-black/70">
            {params.message}
          </div>
        ) : null}

        <form action={loginAction} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="caregiver@example.com"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Mật khẩu
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/80"
          >
            Đăng nhập
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-black/60">
          Chưa có tài khoản người nhà?{" "}
          <Link href="/register" className="font-semibold text-black underline underline-offset-4">
            Đăng ký
          </Link>
        </p>
      </section>
    </main>
  );
}