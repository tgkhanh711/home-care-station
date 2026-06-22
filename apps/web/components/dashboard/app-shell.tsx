"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { AiCommandBox } from "@/components/dashboard/ai-command-box";
import type { HcsRole } from "@/lib/ai/intake-contract";

type DesktopRole = Exclude<HcsRole, "station">;

type AppShellProps = {
  role: DesktopRole;
  title: string;
  description: string;
  children: ReactNode;
};

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: string;
  badge?: string;
};

type RoleConfig = {
  appLabel: string;
  roleLabel: string;
  banner: string;
  homeHref: string;
};

const SIGN_OUT_ACTION = "/logout";

const ROLE_CONFIG: Record<DesktopRole, RoleConfig> = {
  admin: {
    appLabel: "Home Care Station",
    roleLabel: "Admin Console",
    banner:
      "Quản trị hệ thống, audit log, thiết bị, cảnh báo và trạng thái AI toàn nền tảng.",
    homeHref: "/admin",
  },
  doctor: {
    appLabel: "Home Care Station",
    roleLabel: "Doctor Workspace",
    banner:
      "Không gian bác sĩ: ưu tiên cảnh báo đỏ/cam, trend sinh tồn và bảng bệnh nhân.",
    homeHref: "/doctor",
  },
  caregiver: {
    appLabel: "Home Care Station",
    roleLabel: "Caregiver Care Hub",
    banner:
      "Theo dõi người thân, lịch thuốc, cảnh báo mới và trợ lý AI chăm sóc tại nhà.",
    homeHref: "/caregiver",
  },
};

const NAV_ITEMS: Record<DesktopRole, NavItem[]> = {
  admin: [
    {
      href: "/admin",
      label: "Tổng quan",
      description: "Sức khỏe hệ thống",
      icon: "▦",
    },
    {
      href: "/admin",
      label: "Users",
      description: "Tài khoản và role",
      icon: "◉",
    },
    {
      href: "/admin",
      label: "Devices",
      description: "Station và command queue",
      icon: "▣",
      badge: "QUEUE",
    },
    {
      href: "/admin",
      label: "AI Logs",
      description: "Trace AI/n8n",
      icon: "✦",
      badge: "AI",
    },
    {
      href: "/admin",
      label: "Audit",
      description: "Lịch sử hệ thống",
      icon: "☷",
    },
  ],
  doctor: [
    {
      href: "/doctor",
      label: "Bệnh nhân",
      description: "Danh sách được gán",
      icon: "▦",
    },
    {
      href: "/doctor",
      label: "Chỉ số",
      description: "HR/BP/SpO2 trend",
      icon: "⌁",
      badge: "24H",
    },
    {
      href: "/doctor",
      label: "Adherence",
      description: "Tuân thủ thuốc",
      icon: "✓",
    },
  ],
  caregiver: [
    {
      href: "/caregiver",
      label: "Trang chính",
      description: "Tình trạng người thân",
      icon: "⌂",
    },
    {
      href: "/caregiver",
      label: "Lịch thuốc",
      description: "Hôm nay",
      icon: "◷",
    },
    {
      href: "/caregiver",
      label: "AI Care",
      description: "Trợ lý chăm sóc",
      icon: "✦",
      badge: "AI",
    },
  ],
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/doctor" || href === "/caregiver") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function AppShell({ role, title, description, children }: AppShellProps) {
  const pathname = usePathname();
  const config = ROLE_CONFIG[role];
  const isDoctor = role === "doctor";

  return (
    <div
      className={[
        "min-h-screen",
        isDoctor
          ? "bg-slate-950 text-slate-100"
          : "bg-linear-to-br from-slate-50 via-blue-50 to-white text-slate-950",
      ].join(" ")}
    >
      <header
        className={[
          "sticky top-0 z-40 w-full border-b backdrop-blur-xl",
          isDoctor
            ? "border-slate-800 bg-slate-950/90"
            : "border-blue-100 bg-white/90",
        ].join(" ")}
      >
        <div className="flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <Link href={config.homeHref} className="flex items-center gap-3">
            <div
              className={[
                "grid size-11 place-items-center rounded-2xl text-lg font-black text-white shadow-sm",
                isDoctor ? "bg-blue-500" : "bg-blue-600",
              ].join(" ")}
            >
              H
            </div>
            <div>
              <p
                className={[
                  "text-sm font-black tracking-tight",
                  isDoctor ? "text-white" : "text-slate-950",
                ].join(" ")}
              >
                {config.appLabel}
              </p>
              <p
                className={[
                  "text-xs font-medium",
                  isDoctor ? "text-slate-400" : "text-slate-500",
                ].join(" ")}
              >
                {config.roleLabel}
              </p>
            </div>
          </Link>

          <div
            className={[
              "hidden h-11 min-w-0 flex-1 items-center rounded-2xl border px-4 text-sm lg:flex",
              isDoctor
                ? "border-slate-800 bg-slate-900 text-slate-400"
                : "border-blue-100 bg-blue-50 text-slate-500",
            ].join(" ")}
          >
            <span className="mr-3 text-base">⌕</span>
            <span className="truncate">
              Search patient, alert, medicine, device command...
            </span>
            <span
              className={[
                "ml-auto rounded-lg px-2 py-1 text-xs",
                isDoctor ? "bg-slate-800 text-slate-300" : "bg-white text-blue-700",
              ].join(" ")}
            >
              Ctrl K
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={[
                "hidden rounded-2xl px-3 py-2 text-sm font-semibold lg:block",
                isDoctor
                  ? "bg-slate-900 text-slate-300"
                  : "bg-blue-50 text-blue-700",
              ].join(" ")}
            >
              Trợ giúp
            </button>

            <button
              type="button"
              className={[
                "rounded-2xl px-3 py-2 text-sm font-semibold",
                isDoctor
                  ? "bg-slate-900 text-orange-300"
                  : "bg-orange-50 text-orange-700",
              ].join(" ")}
            >
              3 cảnh báo
            </button>

            <form action={SIGN_OUT_ACTION} method="post">
              <button
                type="submit"
                className={[
                  "rounded-2xl px-4 py-2 text-sm font-bold text-white shadow-sm",
                  isDoctor ? "bg-blue-500 hover:bg-blue-400" : "bg-slate-950 hover:bg-slate-800",
                ].join(" ")}
              >
                Đăng xuất
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-64px)] w-full lg:grid-cols-[280px_1fr]">
        <aside
          className={[
            "hidden border-r p-4 lg:block",
            isDoctor ? "border-slate-800 bg-slate-950" : "border-blue-100 bg-white/70",
          ].join(" ")}
        >
          <div
            className={[
              "mb-4 rounded-[28px] border p-4",
              isDoctor
                ? "border-slate-800 bg-slate-900"
                : "border-blue-100 bg-blue-50",
            ].join(" ")}
          >
            <p
              className={[
                "text-xs font-bold uppercase tracking-[0.2em]",
                isDoctor ? "text-blue-300" : "text-blue-700",
              ].join(" ")}
            >
              Role-aware
            </p>
            <p
              className={[
                "mt-2 text-sm leading-6",
                isDoctor ? "text-slate-300" : "text-slate-600",
              ].join(" ")}
            >
              Sidebar này chỉ render menu của role hiện tại.
            </p>
          </div>

          <nav className="space-y-2">
            {NAV_ITEMS[role].map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={`${role}-${item.label}`}
                  href={item.href}
                  className={[
                    "group flex items-start gap-3 rounded-2xl border px-3 py-3 transition",
                    active
                      ? isDoctor
                        ? "border-blue-500 bg-blue-500/15 text-white"
                        : "border-blue-200 bg-blue-100 text-blue-950"
                      : isDoctor
                        ? "border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900 hover:text-white"
                        : "border-transparent text-slate-600 hover:border-blue-100 hover:bg-white hover:text-slate-950",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid size-9 shrink-0 place-items-center rounded-xl text-sm font-black",
                      active
                        ? "bg-blue-600 text-white"
                        : isDoctor
                          ? "bg-slate-900 text-slate-300"
                          : "bg-slate-100 text-slate-600",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-bold">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-700">
                          {item.badge}
                        </span>
                      ) : null}
                    </span>
                    <span
                      className={[
                        "mt-1 block text-xs",
                        isDoctor ? "text-slate-500" : "text-slate-500",
                      ].join(" ")}
                    >
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 p-4 lg:p-6">
          <section
            className={[
              "mb-6 rounded-[28px] border px-5 py-4",
              isDoctor
                ? "border-blue-500/30 bg-blue-500/10 text-blue-100"
                : "border-blue-100 bg-white text-slate-700 shadow-sm",
            ].join(" ")}
          >
            <p className="text-sm font-semibold">{config.banner}</p>
          </section>

          <section
            className={[
              "mb-6 rounded-4xl border p-6 shadow-sm",
              isDoctor
                ? "border-slate-800 bg-slate-900"
                : "border-blue-100 bg-white",
            ].join(" ")}
          >
            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <div>
                <p
                  className={[
                    "text-xs font-black uppercase tracking-[0.25em]",
                    isDoctor ? "text-blue-300" : "text-blue-700",
                  ].join(" ")}
                >
                  Dashboard
                </p>
                <h1
                  className={[
                    "mt-3 text-3xl font-black tracking-tight lg:text-4xl",
                    isDoctor ? "text-white" : "text-slate-950",
                  ].join(" ")}
                >
                  {title}
                </h1>
                <p
                  className={[
                    "mt-3 max-w-3xl text-sm leading-7 lg:text-base",
                    isDoctor ? "text-slate-400" : "text-slate-600",
                  ].join(" ")}
                >
                  {description}
                </p>
              </div>

              <AiCommandBox role={role} />
            </div>
          </section>

          {children}
        </main>
      </div>
    </div>
  );
}