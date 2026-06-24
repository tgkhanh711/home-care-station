import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { Database } from "@/database";
import {
  Activity, Bell, Search, Settings, Stethoscope, 
  UserRound, UsersRound, ShieldAlert, Thermometer, History,
  HeartPulse, ClipboardList
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getElderlyProfiles } from "@/app/actions/elderly";
import { EditDoctorModal } from "@/components/elderly/edit-doctor-modal";
import { ViewProfileModal } from "@/components/elderly/view-profile-modal"; 
import { SearchPatientModal } from "@/components/elderly/search-patient-modal";
import { doctorSidebarItems } from "@/lib/constants/doctor-sidebar";
import { getLatestVitals, getVitalsHistory } from "@/app/actions/vitals"; 
import { VitalsForm } from "@/components/doctor/vitals-form"; 
import { getActiveAlerts, updateAlertStatus } from "@/app/actions/alerts";

// Types
type PatientCard = { id: string; name: string; note: string; active?: boolean; tone: "blue" | "emerald" | "orange" | "slate"; };
type VitalCard = { label: string; value: string; unit?: string; description: string; icon: LucideIcon; tone: "rose" | "blue" | "emerald" | "orange"; }; 
type PatientRow = { id: string; name: string; age: number | string; condition: string; alert: "critical" | "warning" | "stable"; summary: string; lastUpdated: string; raw_profile: Database["public"]["Tables"]["elderly_profiles"]["Row"]; };

const vitals: VitalCard[] = [
  { label: "HR", value: "--", unit: "bpm", description: "Chờ dữ liệu", icon: HeartPulse, tone: "rose" },
  { label: "BP", value: "--/--", unit: "mmHg", description: "Chờ dữ liệu", icon: Activity, tone: "blue" },
  { label: "SpO2", value: "--", unit: "%", description: "Chờ dữ liệu", icon: Stethoscope, tone: "emerald" },
  { label: "TEMP", value: "--", unit: "°C", description: "Chưa có dữ liệu", icon: Thermometer, tone: "orange" }, 
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

const vitalToneClass: Record<VitalCard["tone"], string> = {
  rose: "from-rose-50 to-white text-rose-900 ring-rose-200 dark:from-rose-500/22 dark:to-slate-900 dark:text-rose-200 dark:ring-rose-400/20",
  blue: "from-blue-50 to-white text-blue-900 ring-blue-200 dark:from-blue-500/24 dark:to-slate-900 dark:text-blue-200 dark:ring-blue-400/20",
  emerald: "from-emerald-50 to-white text-emerald-900 ring-emerald-200 dark:from-emerald-500/22 dark:to-slate-900 dark:text-emerald-200 dark:ring-emerald-400/20",
  orange: "from-orange-50 to-white text-orange-900 ring-orange-200 dark:from-orange-500/22 dark:to-slate-900 dark:text-orange-200 dark:ring-orange-400/20", 
};

export default async function DoctorDashboardPage(props: { searchParams?: Promise<{ patientId?: string }>; }) {
  const searchParams = await props.searchParams;
  const patientIdFromUrl = searchParams?.patientId;

  const { data: profiles } = await getElderlyProfiles();
  const selectedPatientId = patientIdFromUrl || profiles?.[0]?.id;

  const { data: latestVitals } = selectedPatientId ? await getLatestVitals(selectedPatientId) : { data: null };
  const { data: vitalsHistory } = selectedPatientId ? await getVitalsHistory(selectedPatientId, 5) : { data: [] }; 
  const { data: realAlerts } = selectedPatientId ? await getActiveAlerts(selectedPatientId) : { data: [] };

  const patientCards: PatientCard[] = profiles?.map((p) => {
    let tone: PatientCard["tone"] = "slate";
    if (p.care_status === "stable") tone = "emerald";
    if (p.care_status === "needs_attention") tone = "orange";
    if (p.care_status === "critical") tone = "blue"; 
    return { id: p.id, name: p.full_name, note: p.medical_conditions?.[0] || "Chưa có bệnh nền", active: p.id === selectedPatientId, tone };
  }) || [];

  const filteredProfiles = profiles?.filter(p => p.id === selectedPatientId) || [];
  
  const patientRows: PatientRow[] = filteredProfiles.map((p) => {
    const age = p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : "N/A";
    let alertType: PatientRow["alert"] = "stable";
    if (p.care_status === "critical") alertType = "critical";
    if (p.care_status === "needs_attention") alertType = "warning";

    return { id: p.id, name: p.full_name, age: age, condition: p.medical_conditions?.join(", ") || "Không ghi nhận", alert: alertType, summary: "Chờ thiết bị trạm gửi lên...", lastUpdated: new Date(p.updated_at).toLocaleDateString("vi-VN"), raw_profile: p };
  });

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 flex w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-md transition-colors duration-300 dark:border-white/8 dark:bg-slate-950 lg:px-5">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/doctor" className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-900/20 dark:bg-blue-500 dark:shadow-blue-950/40">HCS</div>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-[13px] font-black leading-4 text-slate-900 dark:text-white">Home Care</p>
              <p className="truncate text-[11px] font-semibold text-slate-500">Doctor</p>
            </div>
          </Link>
          <div className="hidden h-10 w-px bg-slate-200 dark:bg-white/10 lg:block"></div>
          <div className="hidden lg:block">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600 dark:text-blue-300/80">Dashboard</p>
            <h1 className="mt-0.5 text-xl font-black tracking-tight text-slate-900 dark:text-white xl:text-2xl">Doctor Clinical Dashboard</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          <div className="hidden h-11 w-64 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 shadow-sm transition-colors duration-300 dark:border-white/10 dark:bg-white/4 dark:text-slate-400 xl:flex 2xl:w-80"><Search className="mr-2 size-4 shrink-0 text-blue-600 dark:text-blue-300" /><span className="truncate text-xs">Tìm bệnh nhân, chỉ số, cảnh báo...</span></div>
          <button type="button" className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/4 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"><Bell className="size-4" /></button>
          <ThemeToggle />
          <button type="button" className="grid size-11 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/4 dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"><Settings className="size-4" /></button>
          <form action="/logout" method="post"><button type="submit" className="whitespace-nowrap h-11 shrink-0 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-700 dark:bg-blue-500 dark:shadow-blue-950/40 dark:hover:bg-blue-400">Đăng xuất</button></form>
        </div>
      </header>

      {/* ĐÃ SỬA GRID Ở ĐÂY: XÓA CỘT THỨ 3 (360px) */}
      <div className="grid flex-1 overflow-hidden lg:grid-cols-[180px_minmax(0,1fr)]">
        
        <aside className="custom-scrollbar hidden overflow-y-auto border-r border-slate-200 bg-white px-3 pb-4 pt-4 transition-colors duration-300 dark:border-white/8 dark:bg-slate-950/95 lg:flex lg:flex-col">
          <nav className="space-y-2">
            {doctorSidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === "/doctor"; 
              return (
                <Link key={item.label} href={item.href} className={["group relative flex flex-col items-center gap-1 rounded-3xl border px-2 py-3 text-center transition", isActive ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-white dark:shadow-lg dark:shadow-blue-950/30" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:border-white/10 dark:hover:bg-white/4 dark:hover:text-white"].join(" ")}>
                  <span className={["grid size-9 place-items-center rounded-2xl transition-colors", isActive ? "bg-blue-600 text-white dark:bg-blue-500" : "bg-slate-100 text-slate-500 group-hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:group-hover:text-white"].join(" ")}><Icon className="size-4" /></span>
                  <span className="text-[11px] font-bold leading-4">{item.label}</span>
                  {item.badge ? <span className="absolute right-1.5 top-1.5 rounded-full border border-orange-200 bg-orange-100 px-1.5 py-0.5 text-[9px] font-black text-orange-700 dark:border-orange-300/30 dark:bg-orange-500/20 dark:text-orange-200">{item.badge}</span> : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="custom-scrollbar min-w-0 overflow-y-auto bg-slate-50 px-4 py-4 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.20),transparent_34%),linear-gradient(180deg,#07101f_0%,#0b1220_48%,#070b14_100%)] lg:px-5">
          
          {realAlerts && realAlerts.length > 0 && (
            <div className="mb-6 rounded-[28px] bg-red-600 p-5 text-white shadow-xl shadow-red-900/30 animate-pulse">
              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert className="size-6" />
                <h2 className="text-xl font-black uppercase tracking-wider">Cảnh báo khẩn cấp đang mở!</h2>
              </div>
              {realAlerts.map(a => (
                <div key={a.id} className="mt-4 border-t border-red-500 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm font-semibold opacity-90">- {a.title}: {a.message} (Trạng thái: {a.status})</div>
                  <form action={async () => {
                    "use server";
                    await updateAlertStatus(a.id, a.status === "pending" ? "acknowledged" : "resolved");
                  }}>
                    <button type="submit" className="shrink-0 rounded-xl bg-white/20 px-4 py-2 text-xs font-bold transition hover:bg-white/40">
                      {a.status === "pending" ? "👉 Đã nhận thông tin" : "✅ Hoàn tất hỗ trợ"}
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}

          <section className="mb-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition-colors duration-300 dark:border-white/8 dark:bg-white/4.5 dark:shadow-2xl dark:shadow-black/20">
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div><h2 className="text-base font-black text-slate-900 dark:text-white">Xem tổng quát cho bệnh nhân</h2><p className="mt-1 text-xs text-slate-500">Tổng cộng {patientCards.length} bệnh nhân được phân công.</p></div>
              <SearchPatientModal />
            </div>

            {patientCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-slate-500"><UsersRound className="mb-2 size-8 text-slate-400 opacity-50" /><p className="text-sm italic">Chưa có bệnh nhân nào được gán cho bạn.</p></div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1">
                {patientCards.map((patient) => (
                  <Link key={patient.id} href={`/doctor?patientId=${patient.id}`} scroll={false} className={["block min-w-32 cursor-pointer rounded-3xl border p-3 transition", patient.active ? "border-blue-300 bg-blue-50 shadow-md dark:border-blue-400/50 dark:bg-blue-500/18 dark:shadow-lg dark:shadow-blue-950/30" : "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-white/8 dark:bg-slate-950/45 dark:hover:bg-white/6"].join(" ")}>
                    <div className="relative mx-auto grid size-12 place-items-center rounded-2xl bg-slate-200 dark:bg-white/10"><UserRound className="size-6 text-slate-600 dark:text-slate-200" /><span className={`absolute -right-1 -top-1 size-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${patient.active ? "bg-emerald-500 dark:bg-emerald-400" : "bg-slate-400 dark:bg-slate-600"}`} /></div>
                    <p className="mt-2 truncate text-center text-xs font-black text-slate-800 dark:text-white">{patient.name}</p>
                    <p className="mt-0.5 truncate text-center text-[10px] font-medium text-slate-500">{patient.note}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-white/8 dark:bg-white/4.5 dark:shadow-2xl dark:shadow-black/20">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white">Dữ liệu Vital & Xu hướng</h2>
                <p className="mt-1 text-xs text-slate-500">Ưu tiên hiển thị chỉ số đo gần nhất.</p>
              </div>
            </div>
            
            <div className="grid gap-3 xl:grid-cols-4">
              {vitals.map((vital) => {
                const Icon = vital.icon;
                let displayValue = vital.value;
                let displayDetail = vital.description;

                if (vital.label === "HR" && latestVitals?.heart_rate) {
                  displayValue = String(latestVitals.heart_rate);
                  displayDetail = `Đo lúc ${new Date(latestVitals.measured_at).toLocaleTimeString("vi-VN")}`;
                }
                if (vital.label === "BP" && latestVitals?.blood_pressure_sys && latestVitals?.blood_pressure_dia) {
                  displayValue = `${latestVitals.blood_pressure_sys}/${latestVitals.blood_pressure_dia}`;
                  displayDetail = `Đo lúc ${new Date(latestVitals.measured_at).toLocaleTimeString("vi-VN")}`;
                }
                if (vital.label === "SpO2" && latestVitals?.spo2) {
                  displayValue = String(latestVitals.spo2);
                  displayDetail = `Đo lúc ${new Date(latestVitals.measured_at).toLocaleTimeString("vi-VN")}`;
                }
                if (vital.label === "TEMP" && latestVitals?.temperature) {
                  displayValue = String(latestVitals.temperature);
                  displayDetail = `Đo lúc ${new Date(latestVitals.measured_at).toLocaleTimeString("vi-VN")}`;
                }

                return (
                  <article key={vital.label} className={`relative overflow-hidden rounded-[26px] border bg-linear-to-br p-4 ring-1 ${vitalToneClass[vital.tone]}`}>
                    <Icon className="absolute -right-2 top-4 size-28 text-slate-900/5 dark:text-white/7" />
                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">{vital.label}</p>
                        <div className="mt-4 flex items-end gap-2">
                          <p className="text-4xl font-black tracking-tight">{displayValue}</p>
                          {vital.unit && <p className="pb-1 text-sm font-bold opacity-80">{vital.unit}</p>}
                        </div>
                        <p className="mt-2 text-xs font-semibold opacity-90">{displayDetail}</p>
                      </div>
                      <div className="grid size-10 place-items-center rounded-2xl bg-black/5 text-current dark:bg-white/10 dark:text-white"><Icon className="size-5" /></div>
                    </div>
                  </article>
                );
              })}
            </div>

            {vitalsHistory && vitalsHistory.length > 0 && (
              <div className="mt-6 border-t border-slate-200 pt-4 dark:border-white/10">
                <div className="mb-3 flex items-center gap-2">
                  <History className="size-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Lịch sử 5 lần đo gần nhất</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-200 uppercase dark:border-white/10">
                        <th className="py-2">Thời gian</th><th className="py-2">Nhịp tim</th><th className="py-2">Huyết áp</th><th className="py-2">SpO2</th><th className="py-2">Nhiệt độ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vitalsHistory.map((h) => (
                        <tr key={h.id} className="border-b border-slate-100 dark:border-white/5">
                          <td className="py-2 font-medium text-slate-900 dark:text-slate-200">
                            {new Date(h.measured_at).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className="py-2">{h.heart_rate || "--"} bpm</td>
                          <td className="py-2">{h.blood_pressure_sys && h.blood_pressure_dia ? `${h.blood_pressure_sys}/${h.blood_pressure_dia}` : "--/--"} mmHg</td>
                          <td className="py-2">{h.spo2 || "--"} %</td>
                          <td className="py-2">{h.temperature || "--"} °C</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedPatientId && <VitalsForm patientId={selectedPatientId} />}

          </section>

          <section className="mt-4 rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-white/8 dark:bg-white/4.5 dark:shadow-2xl dark:shadow-black/20">
            <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div><h2 className="text-base font-black text-slate-900 dark:text-white">Chi tiết</h2><p className="mt-1 text-xs text-slate-500">Thông tin chi tiết của bệnh nhân đang chọn.</p></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-200 border-separate border-spacing-y-2 text-left text-sm">
                <thead><tr className="text-[11px] uppercase tracking-[0.18em] text-slate-500"><th className="px-3 py-2">Bệnh nhân</th><th className="px-3 py-2">Bệnh nền</th><th className="px-3 py-2">Tóm tắt vital</th><th className="px-3 py-2">Alert</th><th className="px-3 py-2 text-right">Thao tác</th></tr></thead>
                <tbody>
                  {patientRows.map((row) => (
                    <tr key={row.id} className="bg-slate-50 text-slate-700 shadow-xs transition-colors dark:bg-slate-950/55 dark:text-slate-200 dark:shadow-sm dark:shadow-black/10">
                      <td className="rounded-l-2xl px-3 py-3"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-slate-200 text-slate-600 dark:bg-white/8 dark:text-slate-200"><UserRound className="size-5" /></div><div><p className="font-black text-slate-900 dark:text-white">{row.name}</p><p className="text-xs text-slate-500">{row.age} tuổi</p></div></div></td>
                      <td className="px-3 py-3">{row.condition}</td>
                      <td className="px-3 py-3 text-slate-500 text-xs italic">{row.summary}</td>
                      <td className="px-3 py-3"><span className={`rounded-full border px-3 py-1 text-xs font-black ${alertClass[row.alert]}`}>{alertLabel[row.alert]}</span></td>
                      <td className="rounded-r-2xl px-3 py-3"><div className="flex justify-end gap-2"><Link href={`/doctor/prescriptions?patientId=${row.id}`} title="Quản lý đơn thuốc" className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-blue-600 dark:border-white/8 dark:bg-white/4 dark:text-slate-400 dark:hover:text-white"><ClipboardList className="size-4" /></Link><ViewProfileModal profile={row.raw_profile} /><EditDoctorModal profile={row.raw_profile} /></div></td>
                    </tr>
                  ))}
                  {patientRows.length === 0 && (<tr><td colSpan={5} className="py-6 text-center text-slate-500 italic">Vui lòng chọn một bệnh nhân để xem chi tiết.</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        </main>
        
        {/* ĐÃ XÓA THẺ ASIDE (SIDEBAR PHẢI) CŨ */}
      </div>

    </div>
  );
}