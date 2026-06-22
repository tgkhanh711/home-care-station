import type { LucideIcon } from "lucide-react";
import Link from "next/link"; 
import { Activity, Bell, Bot, CalendarDays, Droplet, HeartPulse, Home, Moon, Pill, Search, Settings, ShieldAlert, Sun, UserRound, Wind, Sunrise } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getElderlyProfiles } from "@/app/actions/elderly";
import { getTodaySchedules } from "@/app/actions/schedules"; 
import { getActiveAlerts } from "@/app/actions/alerts"; 
import { getLatestVitals } from "@/app/actions/vitals";
import { RealtimeAlertListener } from "@/components/alerts/realtime-alert-listener";

const sidebarItems = [ 
  { href: "/caregiver", label: "Trang chính", icon: Home, active: true }, 
  { href: "/caregiver/prescriptions", label: "Lịch thuốc", icon: Pill }, 
  { href: "/caregiver", label: "AI Care", icon: Bot }, 
];

function SidebarItem({ href, label, icon: Icon, active = false }: { href: string; label: string; icon: LucideIcon; active?: boolean; }) {
  return <Link href={href} className={["flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition", active ? "bg-blue-100 text-blue-900 shadow-sm dark:bg-blue-500/20 dark:text-white" : "text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"].join(" ")}><Icon className="size-5 shrink-0" strokeWidth={2.4} /><span>{label}</span></Link>;
}

function MetricCard({ label, value, detail, icon: Icon, iconClassName }: { label: string; value: string; detail: string; icon: LucideIcon; iconClassName: string; }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-white/8 dark:bg-white/2 dark:shadow-md dark:shadow-black/20">
      <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className={["grid size-9 place-items-center rounded-xl", iconClassName].join(" ")}><Icon className="size-5" strokeWidth={2.5} /></span><p className="text-[15px] font-black text-slate-900 dark:text-white">{label}</p></div><span className={["grid size-8 place-items-center rounded-lg opacity-60", iconClassName].join(" ")}><HeartPulse className="size-4" strokeWidth={2.6} /></span></div>
      <p className="mt-5 text-4xl font-black leading-none tracking-tight text-slate-900 dark:text-white">{value}</p>
      <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">{detail}</p>
    </article>
  );
}

function getPeriodInfo(timeStr: string) {
  const hour = parseInt(timeStr.split(":")[0]);
  if (hour >= 5 && hour <= 10) return { period: "Sáng", icon: Sunrise, timeClass: "text-amber-500", bgClass: "bg-orange-100 text-orange-700 dark:bg-orange-500/20" };
  if (hour > 10 && hour <= 14) return { period: "Trưa", icon: Sun, timeClass: "text-yellow-500", bgClass: "bg-amber-100 text-amber-700 dark:bg-amber-500/20" };
  if (hour > 14 && hour <= 17) return { period: "Chiều", icon: Sun, timeClass: "text-orange-500", bgClass: "bg-rose-100 text-rose-700 dark:bg-rose-500/20" };
  return { period: "Tối/Đêm", icon: Moon, timeClass: "text-blue-500", bgClass: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20" };
}

export default async function CaregiverDashboardPage() {
  const { data: profiles } = await getElderlyProfiles();
  const profile = profiles && profiles.length > 0 ? profiles[0] : null;

  const { data: todaySchedules } = profile ? await getTodaySchedules(profile.id) : { data: [] };
  const { data: realAlerts } = profile ? await getActiveAlerts(profile.id) : { data: [] };
  
  const { data: latestVitals } = profile ? await getLatestVitals(profile.id) : { data: null };

  const age = profile?.dob ? new Date().getFullYear() - new Date(profile.dob).getFullYear() : "Chưa rõ";
  const metadata = profile?.metadata as { blood_type?: string } | null;

  const totalSchedules = todaySchedules?.length || 0;
  const takenSchedules = todaySchedules?.filter(s => s.status === 'taken').length || 0;
  const progressText = totalSchedules > 0 ? `${takenSchedules}/${totalSchedules} cữ` : "Không có lịch";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm transition-colors dark:border-white/8 dark:bg-slate-950 lg:px-5">
        <div className="flex h-full shrink-0 items-center gap-4 border-r border-transparent pr-4 md:w-56 md:border-slate-200 dark:md:border-white/8"><div className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-black text-white shadow-lg dark:bg-blue-500">HCS</div><div className="hidden min-w-0 md:block"><p className="truncate text-sm font-black leading-4 text-slate-900 dark:text-white">Home Care Station</p><p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">Trung tâm người nhà</p></div></div>
        <div className="flex min-w-0 flex-1 items-center justify-center px-4">
          <div className="hidden h-11 w-full max-w-150 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/4 md:flex"><Search className="size-5 shrink-0 text-blue-600 dark:text-blue-300" strokeWidth={2.4} /><span className="truncate text-sm font-medium">Tìm tên bệnh nhân, lịch thuốc hoặc cảnh báo...</span></div>
        </div>
        <div className="flex h-full shrink-0 items-center gap-2 lg:gap-3"><ThemeToggle /><button type="button" className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-200 dark:border-white/10 dark:bg-white/4"><Settings className="size-4" /></button><form action="/logout" method="post"><button type="submit" className="h-11 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white hover:bg-blue-700 dark:bg-blue-500">Đăng xuất</button></form></div>
      </header>

      {/* ĐÃ SỬA GRID Ở ĐÂY: XÓA CỘT THỨ 3 (330px) */}
      <div className="grid flex-1 overflow-hidden grid-cols-1 lg:grid-cols-[244px_1fr]">
        <aside className="custom-scrollbar hidden overflow-y-auto border-r border-slate-200 bg-slate-50/50 px-3 py-4 dark:border-white/8 dark:bg-slate-950/50 lg:block">
          <nav className="space-y-1">{sidebarItems.map((item) => <SidebarItem key={item.label} {...item} />)}</nav>
        </aside>

        <main className="custom-scrollbar min-w-0 overflow-y-auto bg-slate-50 p-4 transition-colors dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#07101f_0%,#0b1220_48%,#070b14_100%)] lg:p-5 xl:p-6">
          <div className="mb-6"><h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white xl:text-3xl">Theo dõi người thân tại nhà</h1></div>
          {!profile ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/8 dark:bg-white/2"><UserRound className="mx-auto mb-4 size-12 text-slate-400" /><h2 className="text-xl font-bold">Chưa có hồ sơ người thân</h2></div>
          ) : (
            <>
              <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/2">
                <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black flex items-center gap-2"><UserRound className="size-5 text-blue-600" /> Hồ sơ bệnh nhân</h2></div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-900/50"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Họ và Tên</p><p className="mt-1 font-black text-[15px]">{profile.full_name}</p><p className="text-sm font-medium text-slate-600">{age} tuổi • {profile.gender || "Chưa rõ"}</p></div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-900/50"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nhóm máu</p><div className="mt-1 flex items-center gap-2"><Droplet className="size-4 text-rose-500" /><p className="font-black text-[15px]">{metadata?.blood_type || "Chưa cập nhật"}</p></div></div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-900/50"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tiền sử bệnh</p><div className="mt-1 flex items-start gap-2"><Activity className="size-4 mt-0.5 shrink-0 text-blue-500" /><p className="font-semibold text-sm">{profile.medical_conditions?.join(", ") || "Không ghi nhận"}</p></div></div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-white/5 dark:bg-slate-900/50"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Dị ứng & Ghi chú</p><div className="mt-1 flex items-start gap-2"><ShieldAlert className="size-4 mt-0.5 shrink-0 text-orange-500" /><p className="font-semibold text-sm">Dị ứng: <span className="text-orange-600">{profile.allergies?.join(", ") || "Không"}</span></p></div></div>
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                <MetricCard label="Trạng thái" value={profile.care_status || "Ổn định"} detail="Cập nhật gần nhất" icon={HeartPulse} iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20" />
                <MetricCard label="Tiến độ thuốc" value={progressText} detail="Theo số liệu trạm thiết bị" icon={Pill} iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-500/20" />
                <MetricCard 
                  label="SpO2 gần nhất" 
                  value={latestVitals?.spo2 ? `${latestVitals.spo2}%` : "--%"} 
                  detail={latestVitals ? `Đo lúc ${new Date(latestVitals.measured_at).toLocaleTimeString("vi-VN", {hour: '2-digit', minute: '2-digit'})}` : "Chưa có dữ liệu"} 
                  icon={Wind} iconClassName="bg-slate-200 text-slate-600 dark:bg-slate-800" 
                />
                <MetricCard 
                  label="Nhịp tim gần nhất" 
                  value={latestVitals?.heart_rate ? `${latestVitals.heart_rate} bpm` : "-- bpm"} 
                  detail={latestVitals ? `Đo lúc ${new Date(latestVitals.measured_at).toLocaleTimeString("vi-VN", {hour: '2-digit', minute: '2-digit'})}` : "Chưa có dữ liệu"} 
                  icon={HeartPulse} iconClassName="bg-orange-100 text-orange-700 dark:bg-orange-500/20" 
                />
              </section>

              <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/2">
                  <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-black text-slate-900 dark:text-white">Lịch thuốc hôm nay</h2><CalendarDays className="size-5 text-slate-400" strokeWidth={2.4} /></div>
                  <div className="space-y-3">
                    {todaySchedules && todaySchedules.length > 0 ? (
                      todaySchedules.map((schedule) => {
                        const timeStr = new Date(schedule.scheduled_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
                        const info = getPeriodInfo(timeStr);
                        const TimeIcon = info.icon;
                        const itemData = (Array.isArray(schedule.prescription_items) ? schedule.prescription_items[0] : schedule.prescription_items) as { medicine?: { name?: string } } | undefined;
                        const medName = itemData?.medicine?.name || "Thuốc không rõ";

                        return (
                          <article key={schedule.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 dark:border-white/5 dark:bg-slate-900/50">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className={["grid size-11 shrink-0 place-items-center rounded-xl", info.bgClass].join(" ")}><Pill className="size-5" strokeWidth={2.5} /></span>
                              <div className="min-w-0">
                                <p className="truncate text-[15px] font-black text-slate-900 dark:text-white">{info.period} ({timeStr})</p>
                                <p className="truncate text-sm font-medium text-slate-600 dark:text-slate-400">
                                  {schedule.status === "pending" ? "Sắp tới giờ uống: " : "Trạng thái: "}
                                  <span className={schedule.status === "pending" ? "font-black text-slate-900 dark:text-white" : "font-bold text-slate-500"}>
                                    {medName} ({schedule.dosage_text})
                                  </span>
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300"><TimeIcon className={["size-4", info.timeClass].join(" ")} /><span>{timeStr}</span></div>
                              <span className={`text-[10px] font-black uppercase ${schedule.status === 'pending' ? 'text-amber-500' : 'text-emerald-500'}`}>{schedule.status}</span>
                            </div>
                          </article>
                        );
                      })
                    ) : (<div className="py-8 text-center text-sm font-semibold text-slate-500">Hôm nay không có lịch uống thuốc.</div>)}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/2">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Cảnh báo</h2>
                    <Bell className="size-5 text-orange-500" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-3">
                    {realAlerts && realAlerts.length > 0 ? (
                      realAlerts.map((alert) => {
                        let colors = "border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-200"; 
                        if (alert.severity === 'emergency' || alert.severity === 'critical') {
                          colors = "border-red-400 bg-red-100 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-500/20 animate-pulse";
                        } else if (alert.severity === 'warning') {
                          colors = "border-yellow-400 bg-yellow-100 text-yellow-900 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-200 hover:bg-yellow-200";
                        }
                        
                        return (
                          <Link href="/caregiver/alerts" key={alert.id} className={["block cursor-pointer rounded-2xl border p-4 transition-colors", colors].join(" ")}>
                            <p className="text-[17px] font-black leading-6 tracking-tight">{alert.title}</p>
                            <p className="mt-2 text-[14px] font-medium leading-5 opacity-90">{alert.message}</p>
                            <div className="mt-3 flex items-center justify-between">
                              <p className="text-[11px] font-bold opacity-70 uppercase tracking-widest">
                                {new Date(alert.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} 
                                - {alert.status === "pending" ? "CHỜ XỬ LÝ" : "ĐÃ TIẾP NHẬN"}
                              </p>
                              <span className="rounded-lg bg-black/10 px-2 py-1 text-xs font-bold backdrop-blur-sm dark:bg-white/20">👉 XEM CHI TIẾT</span>
                            </div>
                          </Link>
                        )
                      })
                    ) : (
                      <div className="py-6 text-center text-sm font-semibold text-slate-500">Không có cảnh báo khẩn cấp nào.</div>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
        
        {/* ĐÃ XÓA THẺ ASIDE (SIDEBAR PHẢI) CŨ Ở ĐÂY */}
      </div>
      {profile && <RealtimeAlertListener elderlyProfileId={profile.id} />}
    </div>
  );
}