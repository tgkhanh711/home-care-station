import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BrainCircuit,
  FileText,
  LayoutDashboard,
  Search,
  Server,
  Settings,
  ShieldAlert,
  UserRound,
  Users,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const aiLogs = [
  {
    id: "ai-001",
    title: "Intake event received",
    detail: "caregiver_web · ai_command_submitted · 09:00",
  },
  {
    id: "ai-002",
    title: "Scam Shield pending integration",
    detail: "workflow sẽ nối ở cụm AI/n8n",
  },
  {
    id: "ai-003",
    title: "Device command queue ready",
    detail: "mock command sẽ ghi DB ở cụm thiết bị",
  },
];

const alerts = [
  {
    id: "alert-001",
    level: "Đỏ",
    title: "SOS chưa xử lý",
    owner: "Nguyễn Văn A",
  },
  {
    id: "alert-002",
    level: "Cam",
    title: "SpO2 thấp cần theo dõi",
    owner: "Trần Thị B",
  },
  {
    id: "alert-003",
    level: "Xám",
    title: "Station chờ kích hoạt",
    owner: "Thiết bị ST-02",
  },
];

const auditLogs = [
  "Admin mở dashboard hệ thống",
  "Caregiver đăng ký hồ sơ người cao tuổi",
  "Station account được chuẩn bị ở trạng thái pending_activation",
  "AI intake endpoint nhận event đầu tiên",
];

const sidebarItems: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}> = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, active: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/devices", label: "Devices", icon: Server },
  { href: "/admin/ai-logs", label: "AI Logs", icon: BrainCircuit },
  { href: "/admin/audit", label: "Audit", icon: FileText },
];

function SidebarItem({
  href,
  label,
  icon: Icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition",
        active
          ? "bg-blue-100 text-blue-900 shadow-sm dark:bg-blue-500/20 dark:text-white"
          : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white",
      ].join(" ")}
    >
      <Icon className="size-5 shrink-0" strokeWidth={2.4} />
      <span>{label}</span>
    </Link>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "blue" | "green" | "slate" | "orange";
}) {
  const toneConfig: Record<string, { icon: LucideIcon; bg: string; text: string }> = {
    blue: { icon: Users, bg: "bg-blue-100 dark:bg-blue-500/20", text: "text-blue-700 dark:text-blue-400" },
    green: { icon: UserRound, bg: "bg-emerald-100 dark:bg-emerald-500/20", text: "text-emerald-700 dark:text-emerald-400" },
    slate: { icon: Server, bg: "bg-slate-200 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-400" },
    orange: { icon: ShieldAlert, bg: "bg-orange-100 dark:bg-orange-500/20", text: "text-orange-700 dark:text-orange-400" },
  };
  
  const config = toneConfig[tone];
  const Icon = config.icon;

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-white/8 dark:bg-white/2 dark:shadow-md dark:shadow-black/20">
      <div className="flex items-center gap-3">
        <span className={["grid size-11 shrink-0 place-items-center rounded-2xl", config.bg, config.text].join(" ")}>
          <Icon className="size-5" strokeWidth={2.5} />
        </span>
        <p className="text-[15px] font-black text-slate-900 dark:text-white">{label}</p>
      </div>
      <p className="mt-5 text-4xl font-black leading-none tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
        {detail}
      </p>
    </article>
  );
}

export default function AdminDashboardPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      
      {/* --- TOPBAR --- */}
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm transition-colors dark:border-white/8 dark:bg-slate-950 lg:px-5">
        <div className="flex h-full shrink-0 items-center gap-4 border-r border-transparent pr-4 md:w-61 md:border-slate-200 dark:md:border-white/8">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-900/20 dark:bg-blue-500 dark:shadow-blue-950/40">
            A
          </div>
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-sm font-black leading-4 text-slate-900 dark:text-white">
              Home Care Station
            </p>
            <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
              Admin Console
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center px-4">
          <div className="hidden h-11 w-full max-w-150 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-500 shadow-sm transition-colors dark:border-white/10 dark:bg-white/4 dark:text-slate-400 md:flex">
            <Search className="size-5 shrink-0 text-blue-600 dark:text-blue-300" strokeWidth={2.4} />
            <span className="truncate text-sm font-medium">
              Tìm kiếm user, thiết bị, logs hệ thống...
            </span>
          </div>
        </div>

        <div className="flex h-full shrink-0 items-center gap-2 lg:gap-3">
          <ThemeToggle />

          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/4 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
          >
            <Settings className="size-4" />
          </button>

          <form action="/logout" method="post">
            <button
              type="submit"
              className="whitespace-nowrap h-11 shrink-0 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-700 dark:bg-blue-500 dark:shadow-blue-950/40 dark:hover:bg-blue-400"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT SIDEBAR */}
        <aside className="custom-scrollbar hidden w-66 shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50/50 px-3 py-4 transition-colors dark:border-white/8 dark:bg-slate-950/50 lg:block">
          <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Hệ thống
          </p>
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <SidebarItem key={item.label} {...item} />
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="custom-scrollbar min-w-0 flex-1 overflow-y-auto bg-slate-50 p-4 transition-colors dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.08),transparent_34%),linear-gradient(180deg,#07101f_0%,#0b1220_48%,#070b14_100%)] lg:p-6 xl:p-8">
          
          {/* Header Dashboard */}
          <div className="mb-8">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600 dark:text-blue-400">
              Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-white xl:text-3xl">
              Bảng điều khiển quản trị hệ thống
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500 dark:text-slate-400">
              Theo dõi toàn bộ users, elderly profiles, devices, AI logs, alerts và audit trail. Đây là không gian vận hành nền tảng, không phải dashboard chăm sóc cá nhân.
            </p>
          </div>

          {/* Cards Thống kê */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Users"
              value="04"
              detail="Seed roles: admin, doctor, caregiver, station."
              tone="blue"
            />
            <MetricCard
              label="Elderly"
              value="01"
              detail="Hồ sơ được tạo/link từ luồng đăng ký caregiver."
              tone="green"
            />
            <MetricCard
              label="Devices"
              value="01"
              detail="Station ở trạng thái chờ kích hoạt."
              tone="slate"
            />
            <MetricCard
              label="Alerts"
              value="03"
              detail="Đỏ/cam/xám theo chuẩn severity y tế."
              tone="orange"
            />
          </div>

          {/* AI Logs & Alerts */}
          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
            
            {/* AI Logs */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-white/8 dark:bg-white/2 dark:shadow-md dark:shadow-black/20">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    AI logs gần nhất
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Chuẩn bị cho audit AI/n8n ở các cụm sau.
                  </p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                  AI Hub
                </span>
              </div>

              <div className="space-y-3">
                {aiLogs.map((log) => (
                  <article
                    key={log.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors dark:border-white/5 dark:bg-slate-900/50"
                  >
                    <p className="font-bold text-slate-900 dark:text-white">{log.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{log.detail}</p>
                  </article>
                ))}
              </div>
            </section>

            {/* Alerts */}
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-white/8 dark:bg-white/2 dark:shadow-md dark:shadow-black/20">
              <div className="mb-5 flex items-center gap-2">
                <ShieldAlert className="size-5 text-slate-900 dark:text-white" strokeWidth={2.4} />
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Alerts toàn hệ thống
                </h2>
              </div>
              
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <article
                    key={alert.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-colors dark:border-white/5 dark:bg-slate-900/50"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{alert.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{alert.owner}</p>
                    </div>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-black shrink-0",
                        alert.level === "Đỏ"
                          ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                          : alert.level === "Cam"
                            ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                            : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
                      ].join(" ")}
                    >
                      {alert.level}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {/* Audit Logs */}
          <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-white/8 dark:bg-white/2 dark:shadow-md dark:shadow-black/20">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Audit logs</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {auditLogs.map((log) => (
                <div
                  key={log}
                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-700 transition-colors dark:border-white/5 dark:bg-slate-900/50 dark:text-slate-300"
                >
                  <div className="size-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                  {log}
                </div>
              ))}
            </div>
          </section>
          
        </main>
      </div>
    </div>
  );
}