import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  Bot,
  CalendarDays,
  Circle,
  Droplet,
  HeartPulse,
  Home,
  Moon,
  Pill,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Sun,
  UserRound,
  Wind,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const patientInfo = {
  name: "Nguyễn Văn A",
  age: 72,
  gender: "Nam",
  bloodType: "O+",
  history: "Tăng huyết áp, Đái tháo đường type 2, Suy tim độ 2",
  allergies: "Penicillin, Phấn hoa",
  note: "Bệnh nhân hay mất ngủ. Cần theo dõi sát SpO2 vào ban đêm.",
};

const medicationToday = [
  {
    id: "med-001",
    period: "Sáng",
    time: "08:00",
    medicine: "Amlodipine 5mg",
    note: "Đã nhắc dùng thuốc huyết áp.",
    icon: Pill,
    iconClassName: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    timeIcon: Sun,
    timeClassName: "text-amber-500",
  },
  {
    id: "med-002",
    period: "Trưa",
    time: "13:00",
    medicine: "Metformin 500mg",
    note: "Chuẩn bị tới giờ uống thuốc tiểu đường.",
    icon: Bell,
    iconClassName: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
    timeIcon: Sun,
    timeClassName: "text-amber-500",
  },
  {
    id: "med-003",
    period: "Tối",
    time: "20:00",
    medicine: "Atorvastatin 10mg",
    note: "Station sẽ phát nhắc lại vào buổi tối.",
    icon: Bell,
    iconClassName: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    timeIcon: Moon,
    timeClassName: "text-slate-500 dark:text-slate-400",
  },
];

const alertCards = [
  {
    id: "alert-001",
    title: "SpO2 thấp hơn ngưỡng an toàn",
    detail:
      "SpO2 ghi nhận 93% lúc 17:15. Cần kiểm tra lại trong 15 phút và liên hệ bác sĩ nếu tiếp tục giảm.",
    className: "border-yellow-300 bg-yellow-100 text-yellow-900 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-200",
  },
  {
    id: "alert-002",
    title: "Station đã đồng bộ lịch nhắc thuốc",
    detail:
      "Thiết bị sẵn sàng phát thông báo cho liều Metformin 500mg lúc 13:00.",
    className: "border-teal-200 bg-teal-100 text-teal-900 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200",
  },
];

const chatContacts = [
  {
    id: "chat-001",
    name: "Bác sĩ Nguyễn Văn A",
    role: "Bác sĩ phụ trách",
    message: "Chào bạn, tôi đã xem chỉ số hôm nay...",
    online: true,
    avatarClassName: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
  },
  {
    id: "chat-002",
    name: "Bác sĩ Trần Thị B",
    role: "Bác sĩ nội khoa",
    message: "Tôi cần xem xét lại lịch thuốc buổi trưa.",
    online: true,
    avatarClassName: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  },
  {
    id: "chat-003",
    name: "Dược sĩ Phạm",
    role: "Tư vấn thuốc",
    message: "Tệp hướng dẫn liều dùng đã được gửi.",
    online: false,
    avatarClassName: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  {
    id: "chat-004",
    name: "Điều dưỡng Mai",
    role: "Chăm sóc tại nhà",
    message: "Lịch tiêm và tái khám đã được cập nhật.",
    online: true,
    avatarClassName: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400",
  },
];

const sidebarItems: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
}> = [
  { href: "/caregiver", label: "Trang chính", icon: Home, active: true },
  { href: "/caregiver", label: "Lịch thuốc", icon: Pill },
  { href: "/caregiver", label: "Cảnh báo", icon: Bell },
  { href: "/caregiver", label: "AI Care", icon: Bot },
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
    <a
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
    </a>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  iconClassName: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-white/8 dark:bg-white/2 dark:shadow-md dark:shadow-black/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={[
              "grid size-9 place-items-center rounded-xl",
              iconClassName,
            ].join(" ")}
          >
            <Icon className="size-5" strokeWidth={2.5} />
          </span>
          <p className="text-[15px] font-black text-slate-900 dark:text-white">{label}</p>
        </div>

        <span
          className={[
            "grid size-8 place-items-center rounded-lg opacity-60",
            iconClassName,
          ].join(" ")}
        >
          <HeartPulse className="size-4" strokeWidth={2.6} />
        </span>
      </div>

      <p className="mt-5 text-4xl font-black leading-none tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>

      <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{detail}</p>
    </article>
  );
}

export default function CaregiverDashboardPage() {
  return (

    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm transition-colors dark:border-white/8 dark:bg-slate-950 lg:px-5">
        
        <div className="flex h-full shrink-0 items-center gap-4 border-r border-transparent pr-4 md:w-56 md:border-slate-200 dark:md:border-white/8">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-900/20 dark:bg-blue-500 dark:shadow-blue-950/40">
            HCS
          </div>
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-sm font-black leading-4 text-slate-900 dark:text-white">
              Home Care Station
            </p>
            <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
              Trung tâm người nhà
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center px-4">
          <div className="hidden h-11 w-full max-w-150 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-500 shadow-sm transition-colors dark:border-white/10 dark:bg-white/4 dark:text-slate-400 md:flex">
            <Search className="size-5 shrink-0 text-blue-600 dark:text-blue-300" strokeWidth={2.4} />
            <span className="truncate text-sm font-medium">
              Tìm tên bệnh nhân, lịch thuốc hoặc cảnh báo...
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

      <div className="grid flex-1 overflow-hidden grid-cols-1 lg:grid-cols-[244px_1fr] xl:grid-cols-[244px_minmax(0,1fr)_330px]">
        
        {/* SIDEBAR TRÁI */}
        <aside className="custom-scrollbar hidden overflow-y-auto border-r border-slate-200 bg-slate-50/50 px-3 py-4 transition-colors dark:border-white/8 dark:bg-slate-950/50 lg:block">
          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <SidebarItem key={item.label} {...item} />
            ))}
          </nav>
        </aside>

        {/* NỘI DUNG GIỮA */}
        <main className="custom-scrollbar min-w-0 overflow-y-auto bg-slate-50 p-4 transition-colors dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#07101f_0%,#0b1220_48%,#070b14_100%)] lg:p-5 xl:p-6">
          
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white xl:text-3xl">
              Theo dõi người thân tại nhà
            </h1>

            <div className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1 text-sm font-bold text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/50 dark:text-slate-400">
              <button
                className="rounded-lg bg-slate-100 px-3 py-2 text-slate-800 transition dark:bg-white/10 dark:text-white"
                type="button"
              >
                Hôm nay
              </button>
              <button
                className="rounded-lg px-3 py-2 transition hover:bg-slate-50 dark:hover:bg-white/5"
                type="button"
              >
                7 ngày qua
              </button>
            </div>
          </div>

          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-white/8 dark:bg-white/2 dark:shadow-md dark:shadow-black/20">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <UserRound className="size-5 text-blue-600 dark:text-blue-400" />
                Hồ sơ bệnh nhân
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-900/50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Họ và Tên</p>
                <p className="mt-1 font-black text-slate-900 dark:text-white text-[15px]">{patientInfo.name}</p>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{patientInfo.age} tuổi • {patientInfo.gender}</p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-900/50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Nhóm máu</p>
                <div className="mt-1 flex items-center gap-2">
                  <Droplet className="size-4 text-rose-500 dark:text-rose-400" />
                  <p className="font-black text-slate-900 dark:text-white text-[15px]">{patientInfo.bloodType}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-900/50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tiền sử bệnh</p>
                <div className="mt-1 flex items-start gap-2">
                  <Activity className="size-4 mt-0.5 shrink-0 text-blue-500 dark:text-blue-400" />
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-5">{patientInfo.history}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-900/50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Dị ứng & Ghi chú</p>
                <div className="mt-1 flex items-start gap-2">
                  <ShieldAlert className="size-4 mt-0.5 shrink-0 text-orange-500 dark:text-orange-400" />
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-5">Dị ứng: <span className="text-orange-600 dark:text-orange-300">{patientInfo.allergies}</span></p>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{patientInfo.note}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <MetricCard
              label="Trạng thái"
              value="Ổn định"
              detail="Dữ liệu 24h qua"
              icon={HeartPulse}
              iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
            />

            <MetricCard
              label="Tiến độ thuốc"
              value="1/3"
              detail="Một liều đã xác nhận"
              icon={Pill}
              iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
            />

            <MetricCard
              label="SpO2 gần nhất"
              value="96%"
              detail="5 phút trước"
              icon={Wind}
              iconClassName="bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            />

            <MetricCard
              label="Nhịp tim gần nhất"
              value="75 bpm"
              detail="5 phút trước"
              icon={HeartPulse}
              iconClassName="bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
            />
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-white/8 dark:bg-white/2 dark:shadow-md dark:shadow-black/20">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Thông báo thuốc hôm nay
                </h2>
                <CalendarDays className="size-5 text-slate-400" strokeWidth={2.4} />
              </div>

              <div className="space-y-3">
                {medicationToday.map((item) => {
                  const Icon = item.icon;
                  const TimeIcon = item.timeIcon;

                  return (
                    <article
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 transition-colors dark:border-white/5 dark:bg-slate-900/50"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={[
                            "grid size-11 shrink-0 place-items-center rounded-xl",
                            item.iconClassName,
                          ].join(" ")}
                        >
                          <Icon className="size-5" strokeWidth={2.5} />
                        </span>

                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-black text-slate-900 dark:text-white">
                            {item.period} ({item.time})
                          </p>
                          <p className="truncate text-sm font-medium text-slate-600 dark:text-slate-400">
                            {item.note}{" "}
                            <span className="font-black text-slate-900 dark:text-white">
                              {item.medicine}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                        <TimeIcon
                          className={["size-5", item.timeClassName].join(" ")}
                        />
                        <span>{item.time}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-white/8 dark:bg-white/2 dark:shadow-md dark:shadow-black/20">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Cảnh báo mới nhất
                </h2>
                <Bell className="size-5 text-orange-500" strokeWidth={2.5} />
              </div>

              <div className="space-y-3">
                {alertCards.map((alert) => (
                  <article
                    key={alert.id}
                    className={[
                      "rounded-2xl border p-4 transition-colors",
                      alert.className,
                    ].join(" ")}
                  >
                    <p className="text-[17px] font-black leading-6 tracking-tight">
                      {alert.title}
                    </p>
                    <p className="mt-2 text-[14px] font-medium leading-5 opacity-90">
                      {alert.detail}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* 3: SIDEBAR PHẢI */}
        <aside className="custom-scrollbar hidden overflow-y-auto border-l border-slate-200 bg-white px-5 py-5 transition-colors dark:border-white/8 dark:bg-slate-950 dark:shadow-2xl xl:block">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Trò chuyện</h2>
          </div>

          <div className="mb-6 flex items-center gap-2">
            <button
              type="button"
              className="grid size-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              aria-label="Tạo cuộc trò chuyện mới"
            >
              <Plus className="size-5" strokeWidth={2.6} />
            </button>

            <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-slate-500 transition-colors focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 dark:border-white/10 dark:bg-slate-900 dark:focus-within:border-blue-500/50 dark:focus-within:bg-slate-950 dark:focus-within:ring-blue-900/20">
              <Search className="size-4 shrink-0 text-slate-400" strokeWidth={2.4} />
              <input
                type="text"
                placeholder="Tìm chat..."
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            {chatContacts.map((contact) => (
              <article key={contact.id} className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
                <div className="relative shrink-0">
                  <div
                    className={[
                      "grid size-11 place-items-center rounded-full",
                      contact.avatarClassName,
                    ].join(" ")}
                  >
                    <UserRound className="size-6" strokeWidth={2.1} />
                  </div>

                  <span
                    className={[
                      "absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white dark:border-slate-950",
                      contact.online ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-600",
                    ].join(" ")}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[13px] font-black text-slate-900 dark:text-white">
                      {contact.name}
                    </p>
                    <Circle className="size-2 shrink-0 fill-blue-500 text-blue-500 opacity-0 transition-opacity" /> {/* Notification dot (hidden by default) */}
                  </div>

                  <p className="truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    {contact.role}
                  </p>

                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {contact.message}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>

      <div className="fixed bottom-5 right-5 z-50 flex gap-2 xl:hidden">
        <button
          className="rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white shadow-xl dark:bg-red-500"
          type="button"
        >
          SOS
        </button>
        <button
          className="rounded-full bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-xl dark:bg-blue-500"
          type="button"
        >
          Chat
        </button>
      </div>
    </div>
  );
}