import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Bot, Home, Pill, Search, Settings, ShieldAlert, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getElderlyProfiles } from "@/app/actions/elderly";
import { getActiveAlerts, updateAlertStatus } from "@/app/actions/alerts"; 

const sidebarItems = [ 
  { href: "/caregiver", label: "Trang chính", icon: Home }, 
  { href: "/caregiver/prescriptions", label: "Lịch thuốc", icon: Pill }, 
  { href: "/caregiver", label: "AI Care", icon: Bot }, 
];

function SidebarItem({ href, label, icon: Icon, active = false }: { href: string; label: string; icon: LucideIcon; active?: boolean; }) {
  return <Link href={href} className={["flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition", active ? "bg-blue-100 text-blue-900 shadow-sm dark:bg-blue-500/20 dark:text-white" : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"].join(" ")}><Icon className="size-5 shrink-0" strokeWidth={2.4} /><span>{label}</span></Link>;
}

export default async function CaregiverAlertsPage() {
  const { data: profiles } = await getElderlyProfiles();
  const profile = profiles && profiles.length > 0 ? profiles[0] : null;

  const { data: realAlerts } = profile ? await getActiveAlerts(profile.id) : { data: [] };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm transition-colors dark:border-white/8 dark:bg-slate-950 lg:px-5">
        <div className="flex h-full shrink-0 items-center gap-4 border-r border-transparent pr-4 md:w-56 md:border-slate-200 dark:md:border-white/8"><div className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-black text-white shadow-lg dark:bg-blue-500">HCS</div><div className="hidden min-w-0 md:block"><p className="truncate text-sm font-black leading-4 text-slate-900 dark:text-white">Home Care Station</p><p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">Trung tâm người nhà</p></div></div>
        <div className="flex min-w-0 flex-1 items-center justify-center px-4">
          <div className="hidden h-11 w-full max-w-150 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/4 md:flex"><Search className="size-5 shrink-0 text-blue-600 dark:text-blue-300" strokeWidth={2.4} /><span className="truncate text-sm font-medium">Tìm tên bệnh nhân, lịch thuốc hoặc cảnh báo...</span></div>
        </div>
        <div className="flex h-full shrink-0 items-center gap-2 lg:gap-3"><ThemeToggle /><button type="button" className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-200 dark:border-white/10 dark:bg-white/4"><Settings className="size-4" /></button><form action="/logout" method="post"><button type="submit" className="h-11 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 dark:bg-blue-500">Đăng xuất</button></form></div>
      </header>

      <div className="grid flex-1 overflow-hidden grid-cols-1 lg:grid-cols-[244px_1fr]">
        <aside className="custom-scrollbar hidden overflow-y-auto border-r border-slate-200 bg-slate-50/50 px-3 py-4 dark:border-white/8 dark:bg-slate-950/50 lg:block">
          <nav className="space-y-1">{sidebarItems.map((item) => <SidebarItem key={item.label} {...item} />)}</nav>
        </aside>

        <main className="custom-scrollbar min-w-0 overflow-y-auto bg-slate-50 p-4 transition-colors dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#07101f_0%,#0b1220_48%,#070b14_100%)] lg:p-5 xl:p-8">
          
          <div className="mb-8 flex items-center gap-4">
            <Link href="/caregiver" className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-100 dark:bg-slate-900 dark:border-white/10 dark:hover:bg-slate-800 transition">
              <ArrowLeft className="size-5" />
            </Link>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white xl:text-3xl">Trung tâm Cảnh báo</h1>
          </div>

          <div className="mx-auto max-w-4xl space-y-6">
            {!profile ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/8 dark:bg-white/2"><ShieldAlert className="mx-auto mb-4 size-12 text-slate-400" /><h2 className="text-xl font-bold">Chưa có hồ sơ người thân</h2></div>
            ) : realAlerts && realAlerts.length > 0 ? (
              realAlerts.map((alert) => {
                let colors = "border-blue-300 bg-white"; 
                if (alert.severity === 'emergency' || alert.severity === 'critical') {
                  colors = "border-red-400 bg-red-50 dark:border-red-500/30 dark:bg-red-500/5";
                }

                return (
                  <article key={alert.id} className={["flex flex-col gap-4 rounded-3xl border p-6 shadow-sm sm:flex-row sm:items-start", colors].join(" ")}>
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                      <ShieldAlert className="size-8" />
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-[20px] font-black leading-6 tracking-tight text-slate-900 dark:text-white">{alert.title}</p>
                      <p className="mt-2 text-[15px] font-medium leading-6 text-slate-600 dark:text-slate-300">{alert.message}</p>
                      <div className="mt-4 flex gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
                        <span>Giờ gửi: {new Date(alert.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span>•</span>
                        <span className={alert.status === 'pending' ? 'text-amber-500' : 'text-blue-500'}>
                          Trạng thái: {alert.status === "pending" ? "ĐANG CHỜ" : "ĐÃ TIẾP NHẬN"}
                        </span>
                      </div>
                    </div>

                    {/* FORM XỬ LÝ CẢNH BÁO */}
                    <form action={async () => {
                      "use server";
                      await updateAlertStatus(alert.id, alert.status === "pending" ? "acknowledged" : "resolved");
                    }} className="mt-4 sm:mt-0 sm:w-48 shrink-0">
                      <button type="submit" className={`w-full rounded-2xl py-4 text-sm font-black shadow-md transition active:translate-y-1 ${alert.status === "pending" ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
                        {alert.status === "pending" ? "TIẾP NHẬN XỬ LÝ" : "HOÀN TẤT & ĐÓNG"}
                      </button>
                    </form>
                  </article>
                )
              })
            ) : (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-12 text-center shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <ShieldAlert className="mx-auto mb-4 size-16 text-emerald-400 opacity-50" />
                <h2 className="text-2xl font-black text-emerald-900 dark:text-emerald-300">Tuyệt vời!</h2>
                <p className="mt-2 text-emerald-700 dark:text-emerald-400/80">Hiện tại không có cảnh báo khẩn cấp nào. Mọi thứ đang an toàn.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}