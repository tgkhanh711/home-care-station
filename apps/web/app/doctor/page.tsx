import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Bot,
  BrainCircuit,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  MessageSquareText,
  MoreHorizontal,
  Phone,
  Pill,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type PatientCard = {
  id: string;
  name: string;
  note: string;
  active?: boolean;
  tone: "blue" | "emerald" | "orange" | "slate";
};

type VitalCard = {
  label: string;
  value: string;
  unit?: string;
  description: string;
  icon: LucideIcon;
  tone: "rose" | "blue" | "emerald";
};

type PatientRow = {
  id: string;
  name: string;
  age: number;
  condition: string;
  alert: "critical" | "warning" | "stable";
  summary: string;
  lastUpdated: string;
};

const sidebarItems: Array<{
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  active?: boolean;
  badge?: string;
}> = [
  {
    href: "/doctor",
    label: "Bệnh nhân",
    description: "Danh sách đang theo dõi",
    icon: UsersRound,
    active: true,
  },
  {
    href: "/doctor",
    label: "Chỉ số sống",
    description: "HR, BP, SpO2",
    icon: Activity,
    badge: "24H",
  },
  {
    href: "/doctor",
    label: "Cảnh báo",
    description: "Đỏ / cam cần xử lý",
    icon: ShieldAlert,
    badge: "3",
  },
  {
    href: "/doctor",
    label: "Adherence",
    description: "Tuân thủ lịch thuốc",
    icon: ClipboardList,
  },
];

const patientCards: PatientCard[] = [
  {
    id: "patient-001",
    name: "Nguyễn Văn A",
    note: "Tăng HA + ĐTĐ",
    active: true,
    tone: "blue",
  },
  {
    id: "patient-002",
    name: "Trần Thị B",
    note: "COPD nhẹ",
    tone: "orange",
  },
  {
    id: "patient-003",
    name: "Lê Văn C",
    note: "Rối loạn mỡ máu",
    tone: "emerald",
  },
  {
    id: "patient-004",
    name: "Phạm Minh D",
    note: "Chờ dữ liệu",
    tone: "slate",
  },
  {
    id: "patient-005",
    name: "Hoàng Lan E",
    note: "Ổn định",
    tone: "emerald",
  },
  {
    id: "patient-006",
    name: "Đỗ Văn F",
    note: "Chờ thiết bị",
    tone: "slate",
  },
  {
    id: "patient-007",
    name: "Bùi Thu G",
    note: "Theo dõi SpO2",
    tone: "orange",
  },
];

const vitals: VitalCard[] = [
  {
    label: "HR",
    value: "104",
    unit: "bpm",
    description: "Cần gần ngưỡng an toàn",
    icon: HeartPulse,
    tone: "rose",
  },
  {
    label: "BP",
    value: "158/96",
    unit: "mmHg",
    description: "Cần theo dõi trong 15 phút",
    icon: Activity,
    tone: "blue",
  },
  {
    label: "SpO2",
    value: "93%",
    description: "Ngày sát diễn biến oxy",
    icon: Stethoscope,
    tone: "emerald",
  },
];

const patientRows: PatientRow[] = [
  {
    id: "row-001",
    name: "Nguyễn Văn A",
    age: 72,
    condition: "Tăng huyết áp, tiểu đường type 2",
    alert: "critical",
    summary: "HR 104, BP 158/96, SpO2 93%",
    lastUpdated: "2 phút trước",
  },
  {
    id: "row-002",
    name: "Trần Thị B",
    age: 68,
    condition: "COPD nhẹ",
    alert: "warning",
    summary: "SpO2 dao động 94%, cần kiểm tra lại",
    lastUpdated: "12 phút trước",
  },
  {
    id: "row-003",
    name: "Lê Văn C",
    age: 75,
    condition: "Rối loạn lipid máu",
    alert: "stable",
    summary: "Chỉ số ổn định, không có cảnh báo mới",
    lastUpdated: "35 phút trước",
  },
];

const aiTasks = [
  "Phân tích nguy cơ cho bệnh nhân đang chọn",
  "Xem bất thường thuốc của bệnh nhân đang chọn",
  "Tóm tắt 7 ngày gần nhất cho bệnh nhân đang chọn",
];

const alertClass: Record<PatientRow["alert"], string> = {
  critical: "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-500/15 dark:text-red-200",
  warning: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-200",
  stable: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200",
};

const alertLabel: Record<PatientRow["alert"], string> = {
  critical: "A1 - Cấp cứu",
  warning: "B2 - Cảnh báo",
  stable: "C3 - Ổn định",
};

const toneClass: Record<PatientCard["tone"], string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/18 dark:text-blue-100 dark:ring-blue-400/30",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/18 dark:text-emerald-100 dark:ring-emerald-400/30",
  orange: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/18 dark:text-orange-100 dark:ring-orange-400/30",
  slate: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700/70 dark:text-slate-200 dark:ring-slate-500/30",
};

const vitalToneClass: Record<VitalCard["tone"], string> = {
  rose: "from-rose-50 to-white text-rose-900 ring-rose-200 dark:from-rose-500/22 dark:to-slate-900 dark:text-rose-200 dark:ring-rose-400/20",
  blue: "from-blue-50 to-white text-blue-900 ring-blue-200 dark:from-blue-500/24 dark:to-slate-900 dark:text-blue-200 dark:ring-blue-400/20",
  emerald: "from-emerald-50 to-white text-emerald-900 ring-emerald-200 dark:from-emerald-500/22 dark:to-slate-900 dark:text-emerald-200 dark:ring-emerald-400/20",
};

export default function DoctorDashboardPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      
      {/* --- TOPBAR --- */}
      <header className="sticky top-0 z-50 flex w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-md transition-colors duration-300 dark:border-white/8 dark:bg-slate-950 lg:px-5">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/doctor" className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-900/20 dark:bg-blue-500 dark:shadow-blue-950/40">
              HCS
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-[13px] font-black leading-4 text-slate-900 dark:text-white">
                Home Care
              </p>
              <p className="truncate text-[11px] font-semibold text-slate-500">
                Doctor
              </p>
            </div>
          </Link>

          <div className="hidden h-10 w-px bg-slate-200 dark:bg-white/10 lg:block"></div>

          <div className="hidden lg:block">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600 dark:text-blue-300/80">
              Dashboard
            </p>
            <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-900 dark:text-white xl:text-2xl">
              Doctor Clinical Dashboard
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          <div className="hidden h-11 w-64 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-white/4 dark:text-slate-400 xl:flex 2xl:w-80">
            <Search className="mr-2 size-4 shrink-0 text-blue-600 dark:text-blue-300" />
            <span className="truncate text-xs">
              Tìm bệnh nhân, chỉ số, thuốc, cảnh báo...
            </span>
          </div>

          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/4 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
          >
            <Bell className="size-4" />
          </button>

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

      {/* --- NỘI DUNG CHÍNH --- */}
      <div className="grid flex-1 overflow-hidden lg:grid-cols-[180px_minmax(0,1fr)_360px]">
        
        {/* 1. Sidebar Trái */}
        <aside className="custom-scrollbar hidden overflow-y-auto border-r border-slate-200 bg-white px-3 pb-4 pt-4 transition-colors duration-300 dark:border-white/8 dark:bg-slate-950/95 lg:flex lg:flex-col">
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={[
                    "group relative flex flex-col items-center gap-1 rounded-3xl border px-2 py-3 text-center transition",
                    item.active
                      ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-white dark:shadow-lg dark:shadow-blue-950/30"
                      : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-white/4 dark:hover:text-white",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid size-9 place-items-center rounded-2xl transition-colors",
                      item.active
                        ? "bg-blue-600 text-white dark:bg-blue-500"
                        : "bg-slate-100 text-slate-500 group-hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:group-hover:text-white",
                    ].join(" ")}
                  >
                    <Icon className="size-4" />
                  </span>

                  <span className="text-[11px] font-bold leading-4">
                    {item.label}
                  </span>

                  {item.badge ? (
                    <span className="absolute right-1.5 top-1.5 rounded-full border border-orange-200 bg-orange-100 px-1.5 py-0.5 text-[9px] font-black text-orange-700 dark:border-orange-300/30 dark:bg-orange-500/20 dark:text-orange-200">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* 2. Main Content */}
        <main className="custom-scrollbar min-w-0 overflow-y-auto bg-slate-50 px-4 py-4 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.20),transparent_34%),linear-gradient(180deg,#07101f_0%,#0b1220_48%,#070b14_100%)] lg:px-5">
          <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-white/8 dark:bg-white/4.5 dark:shadow-2xl dark:shadow-black/20 dark:backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Xem tổng quát cho bệnh nhân
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Chọn nhanh hồ sơ để xem chỉ số, cảnh báo và lịch thuốc.
                </p>
              </div>

              <button
                type="button"
                className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:text-slate-900 dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-300 dark:hover:text-white sm:flex"
              >
                Tất cả
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {patientCards.map((patient) => (
                <article
                  key={patient.id}
                  className={[
                    "min-w-32 rounded-3xl border p-3 transition",
                    patient.active
                      ? "border-blue-300 bg-blue-50 shadow-md dark:border-blue-400/50 dark:bg-blue-500/18 dark:shadow-lg dark:shadow-blue-950/30"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/8 dark:bg-slate-950/45 dark:hover:bg-white/6",
                  ].join(" ")}
                >
                  <div className="relative mx-auto grid size-12 place-items-center rounded-2xl bg-slate-200 dark:bg-white/10">
                    <UserRound className="size-6 text-slate-600 dark:text-slate-200" />
                    <span
                      className={`absolute -right-1 -top-1 size-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                        patient.active ? "bg-emerald-500 dark:bg-emerald-400" : "bg-slate-400 dark:bg-slate-600"
                      }`}
                    />
                  </div>

                  <p className="mt-2 truncate text-center text-xs font-black text-slate-800 dark:text-white">
                    {patient.name}
                  </p>
                  <p className="mt-0.5 truncate text-center text-[10px] font-medium text-slate-500">
                    {patient.note}
                  </p>

                  <div className="mt-2 flex justify-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${
                        toneClass[patient.tone]
                      }`}
                    >
                      Đang theo dõi
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-white/8 dark:bg-white/4.5 dark:shadow-2xl dark:shadow-black/20">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Dữ liệu Vital & Xu hướng
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Ưu tiên hiển thị chỉ số bất thường trong 24h gần nhất.
                </p>
              </div>

              <div className="hidden rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-bold dark:border-white/10 dark:bg-slate-950/50 sm:flex">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-white dark:bg-blue-500">
                  24h
                </span>
                <span className="px-3 py-1 text-slate-500 dark:text-slate-400">7 ngày</span>
              </div>
            </div>

            <div className="grid gap-3 xl:grid-cols-3">
              {vitals.map((vital) => {
                const Icon = vital.icon;

                return (
                  <article
                    key={vital.label}
                    className={`relative overflow-hidden rounded-[26px] border bg-linear-to-br p-4 ring-1 ${
                      vitalToneClass[vital.tone]
                    }`}
                  >
                    <Icon className="absolute -right-2 top-4 size-28 text-slate-900/5 dark:text-white/7" />

                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">
                          {vital.label}
                        </p>

                        <div className="mt-4 flex items-end gap-2">
                          <p className="text-4xl font-black tracking-tight">
                            {vital.value}
                          </p>
                          {vital.unit ? (
                            <p className="pb-1 text-sm font-bold opacity-80">
                              {vital.unit}
                            </p>
                          ) : null}
                        </div>

                        <p className="mt-2 text-xs font-semibold opacity-90">
                          {vital.description}
                        </p>
                      </div>

                      <div className="grid size-10 place-items-center rounded-2xl bg-black/5 text-current dark:bg-white/10 dark:text-white">
                        <Icon className="size-5" />
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-white/8 dark:bg-white/4.5 dark:shadow-2xl dark:shadow-black/20">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Danh sách bệnh nhân cần chú ý
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Lọc theo chỉ số, bệnh nền hoặc mức cảnh báo.
                </p>
              </div>

              <Link
                href="/doctor"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
              >
                Xem toàn bộ bệnh nhân
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-200 border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-3 py-2">Bệnh nhân</th>
                    <th className="px-3 py-2">Bệnh nền</th>
                    <th className="px-3 py-2">Tóm tắt vital</th>
                    <th className="px-3 py-2">Alert</th>
                    <th className="px-3 py-2">Cập nhật</th>
                    <th className="px-3 py-2 text-right">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {patientRows.map((row) => (
                    <tr
                      key={row.id}
                      className="bg-slate-50 text-slate-700 shadow-xs transition-colors dark:bg-slate-950/55 dark:text-slate-200 dark:shadow-sm dark:shadow-black/10"
                    >
                      <td className="rounded-l-2xl px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid size-10 place-items-center rounded-2xl bg-slate-200 text-slate-600 dark:bg-white/8 dark:text-slate-200">
                            <UserRound className="size-5" />
                          </div>

                          <div>
                            <p className="font-black text-slate-900 dark:text-white">{row.name}</p>
                            <p className="text-xs text-slate-500">
                              {row.age} tuổi
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        {row.condition}
                      </td>

                      <td className="px-3 py-3">
                        {row.summary}
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${
                            alertClass[row.alert]
                          }`}
                        >
                          {alertLabel[row.alert]}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-slate-500">
                        {row.lastUpdated}
                      </td>

                      <td className="rounded-r-2xl px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-blue-600 dark:border-white/8 dark:bg-white/4 dark:text-slate-400 dark:hover:text-white"
                          >
                            <Phone className="size-4" />
                          </button>

                          <button
                            type="button"
                            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-blue-600 dark:border-white/8 dark:bg-white/4 dark:text-slate-400 dark:hover:text-white"
                          >
                            <MessageSquareText className="size-4" />
                          </button>

                          <button
                            type="button"
                            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-blue-600 dark:border-white/8 dark:bg-white/4 dark:text-slate-400 dark:hover:text-white"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>

        {/* 3. Sidebar Phải (Trợ lý AI) */}
        <aside className="custom-scrollbar overflow-y-auto border-l border-slate-200 bg-white px-4 py-4 shadow-sm transition-colors duration-300 dark:border-white/8 dark:bg-slate-950 dark:shadow-2xl dark:shadow-black/30">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-blue-600 dark:text-blue-300/80">
                Trợ lý AI
              </p>
            </div>

            <button
              type="button"
              className="grid size-9 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/4 dark:text-slate-400 dark:hover:text-white"
            >
              <Bot className="size-4" />
            </button>
          </div>

          <section className="rounded-[28px] border border-blue-200 bg-blue-50 p-4 transition-colors dark:border-blue-400/20 dark:bg-blue-500/10">
            <div className="flex items-start gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/20 dark:bg-blue-500 dark:shadow-blue-950/40">
                <BrainCircuit className="size-5" />
              </div>

              <div>
                <h3 className="text-sm font-black text-blue-900 dark:text-white">Gợi ý ưu tiên</h3>
                <p className="mt-1 text-xs leading-5 text-blue-800 dark:text-blue-100/80">
                  Nguyễn Văn A đang có SpO2 93% kèm BP 158/96. Nên kiểm tra lại
                  chỉ số và nhắn người nhà xác nhận tình trạng hiện tại.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Tạo nhận định nhanh
            </button>
          </section>

          <section className="mt-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4 transition-colors dark:border-white/8 dark:bg-white/[0.035]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Đề xuất tác vụ</h3>
              <Sparkles className="size-4 text-blue-600 dark:text-blue-300" />
            </div>

            <div className="space-y-2">
              {aiTasks.map((task) => (
                <button
                  key={task}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-xs font-semibold leading-5 text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-white/8 dark:bg-slate-950/60 dark:text-slate-300 dark:hover:border-blue-400/30 dark:hover:bg-blue-500/10 dark:hover:text-white"
                >
                  <span>{task}</span>
                  <ChevronRight className="size-4 shrink-0 text-slate-400 dark:text-slate-500" />
                </button>
              ))}
            </div>
          </section>

          {/* KÊNH TRAO ĐỔI */}
          <section className="mt-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4 transition-colors dark:border-white/8 dark:bg-white/[0.035]">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Kênh trao đổi</h3>

            <div className="mt-3 flex flex-col rounded-3xl border border-slate-200 bg-white p-2 transition-colors dark:border-white/8 dark:bg-slate-950">
              
              <div className="relative">
                <textarea 
                  className="w-full resize-none bg-transparent p-2 pb-10 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
                  rows={4}
                  placeholder="Hỏi AI về bệnh nhân đang chọn..."
                />
                
                <button
                  type="button"
                  className="absolute bottom-2 right-2 grid size-8 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-900/20 transition hover:bg-blue-700 dark:bg-blue-500 dark:shadow-none dark:hover:bg-blue-400"
                >
                  <Send className="size-4 -ml-0.5" />
                </button>
              </div>

              {/* Các nút bấm chức năng phụ */}
              <div className="mt-1 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 dark:border-white/5">
                <button
                  type="button"
                  className="rounded-2xl bg-slate-100 px-2 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-white/4 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
                >
                  <FileText className="mx-auto mb-1 size-4" />
                  Ghi chú
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-slate-100 px-2 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-white/4 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
                >
                  <Pill className="mx-auto mb-1 size-4" />
                  Thuốc
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-slate-100 px-2 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-200 hover:text-slate-900 dark:bg-white/4 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
                >
                  <CalendarClock className="mx-auto mb-1 size-4" />
                  Lịch
                </button>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}