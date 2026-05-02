import Link from "next/link";
import type { ReactNode } from "react";

import { logoutAction } from "@/actions/auth";
import type { AppRole, UserProfile } from "@/lib/auth/session";

type NavItem = {
  label: string;
  href: string;
  description: string;
};

type DashboardShellProps = {
  children: ReactNode;
  userProfile?: UserProfile | null;
  profile?: UserProfile | null;
  currentUser?: UserProfile | null;
  user?: UserProfile | null;
};

const navItemsByRole: Partial<Record<AppRole, NavItem[]>> = {
  admin: [
    {
      label: "Tổng quan",
      href: "/admin",
      description: "Quản trị hệ thống",
    },
  ],

  caregiver: [
    {
      label: "Hồ sơ",
      href: "/caregiver",
      description: "Quản lý hồ sơ người cao tuổi",
    },
    {
      label: "Theo dõi",
      href: "/caregiver/monitor",
      description: "Theo dõi thuốc, chỉ số sức khỏe và cảnh báo",
    },
    {
      label: "AI",
      href: "/caregiver/ai",
      description: "Tạo báo cáo và phân tích chăm sóc bằng AI",
    },
  ],

  doctor: [
    {
      label: "Bệnh nhân",
      href: "/doctor",
      description: "Quản lý bệnh nhân được phân công",
    },
    {
      label: "Theo dõi",
      href: "/doctor/monitor",
      description: "Theo dõi thuốc, chỉ số sức khỏe và cảnh báo",
    },
    {
      label: "AI",
      href: "/doctor/ai",
      description: "Phân tích hồ sơ bệnh nhân bằng AI",
    },
  ],

  station: [
    {
      label: "Station",
      href: "/station",
      description: "Màn hình thiết bị tại nhà",
    },
    {
      label: "AI",
      href: "/station/ai",
      description: "Phân tích dữ liệu station bằng AI",
    },
  ],
};

const roleLabelByRole: Partial<Record<AppRole, string>> = {
  admin: "Admin",
  caregiver: "Người nhà",
  doctor: "Bác sĩ/Y tá",
  station: "Station",
};

export function DashboardShell({
  children,
  userProfile,
  profile,
  currentUser,
  user,
}: DashboardShellProps) {
  const appUser = userProfile ?? profile ?? currentUser ?? user ?? null;
  const role = appUser?.role;
  const navItems = role ? navItemsByRole[role] ?? [] : [];
  const roleLabel = role ? roleLabelByRole[role] ?? role : "Tài khoản";

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <Link href={navItems[0]?.href ?? "/"} className="block">
            <div className="text-sm font-black uppercase tracking-[0.35em]">
              Home Care Station
            </div>
            <div className="mt-1 text-sm text-neutral-500">{roleLabel}</div>
          </Link>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <nav className="flex flex-wrap items-center gap-2 md:justify-end">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.description}
                  className="rounded-full px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-950 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full border border-neutral-300 bg-white px-5 py-2 text-sm font-semibold text-neutral-900 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-white"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}