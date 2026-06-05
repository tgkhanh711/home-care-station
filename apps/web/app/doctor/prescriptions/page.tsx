import Link from "next/link";
import type { Database } from "@/database";
import { Search, ClipboardList, FileText, Pill, ChevronLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getElderlyProfiles } from "@/app/actions/elderly";
import { getPatientPrescriptions, getMedicines } from "@/app/actions/prescriptions";
import { CreatePrescriptionModal } from "@/components/prescriptions/create-prescription-modal";
import { DeletePrescriptionButton } from "@/components/prescriptions/delete-prescription-button";
import { doctorSidebarItems } from "@/lib/constants/doctor-sidebar";
import { PatientList } from "./patient-list";

type PrescriptionWithItems = {
  id: string;
  start_date: string | null;
  end_date: string | null;
  diagnosis?: string | null;
  status?: string | null;
  prescription_items?: Array<
    Database["public"]["Tables"]["prescription_items"]["Row"] & {
      medicine?: { name: string | null; dosage_form: string | null; strength: string | null; };
    }
  >;
};

export default async function DoctorPrescriptionsPage(
  props: { searchParams?: Promise<{ patientId?: string }> }
) {
  const searchParams = await props.searchParams;
  const selectedPatientId = searchParams?.patientId;

  const { data: profiles } = await getElderlyProfiles();
  const selectedPatient = profiles?.find(p => p.id === selectedPatientId);

  const prescriptions: PrescriptionWithItems[] = selectedPatientId
    ? ((await getPatientPrescriptions(selectedPatientId)).data ?? []) as PrescriptionWithItems[]
    : [];

  const { data: medicines } = await getMedicines();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 flex w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-md dark:border-white/8 dark:bg-slate-950 lg:px-5">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/doctor" className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg dark:bg-blue-500">HCS</div>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-[13px] font-black leading-4">Home Care</p>
              <p className="truncate text-[11px] font-semibold text-slate-500">Doctor</p>
            </div>
          </Link>
          <div className="hidden h-10 w-px bg-slate-200 dark:bg-white/10 lg:block"></div>
          <div className="hidden lg:block">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600">Dashboard</p>
            <h1 className="mt-0.5 text-xl font-black tracking-tight xl:text-2xl">Doctor Clinical Dashboard</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          <div className="hidden h-11 w-64 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/4 xl:flex 2xl:w-80">
            <Search className="mr-2 size-4 shrink-0 text-blue-600" />
            <span className="truncate text-xs">Tìm bệnh nhân, chỉ số, cảnh báo...</span>
          </div>
          <ThemeToggle />
          <form action="/logout" method="post">
            <button type="submit" className="whitespace-nowrap h-11 shrink-0 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg transition hover:bg-blue-700 dark:bg-blue-500">
              Đăng xuất
            </button>
          </form>
        </div>
      </header>

      <div className="grid flex-1 overflow-hidden lg:grid-cols-[180px_minmax(0,1fr)]">
        <aside className="custom-scrollbar hidden overflow-y-auto border-r border-slate-200 bg-white px-3 pb-4 pt-4 dark:border-white/8 dark:bg-slate-950/95 lg:flex lg:flex-col">
          <nav className="space-y-2">
            {doctorSidebarItems.map((item) => {
              const isActive = item.href === "/doctor/prescriptions";
              return (
                <Link key={item.label} href={item.href} className={["group relative flex flex-col items-center gap-1 rounded-3xl border px-2 py-3 text-center transition", isActive ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-400/30 dark:bg-blue-500/20 dark:text-white" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/4"].join(" ")}>
                  <span className={["grid size-9 place-items-center rounded-2xl transition-colors", isActive ? "bg-blue-600 text-white dark:bg-blue-500" : "bg-slate-100 text-slate-500 group-hover:text-slate-900 dark:bg-slate-900"].join(" ")}>
                    <item.icon className="size-4" />
                  </span>
                  <span className="text-[11px] font-bold leading-4">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="custom-scrollbar min-w-0 overflow-y-auto bg-slate-50 px-4 py-4 transition-colors duration-300 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.20),transparent_34%),linear-gradient(180deg,#07101f_0%,#0b1220_48%,#070b14_100%)] lg:px-5">
          {!selectedPatientId ? (
            <PatientList profiles={profiles || []} />
          ) : (
            <div>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <Link href="/doctor/prescriptions" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400">
                    <ChevronLeft className="size-4" /> Quay lại danh sách
                  </Link>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">
                    Hồ sơ y lệnh: <span className="text-blue-600 dark:text-blue-400">{selectedPatient?.full_name}</span>
                  </h2>
                </div>
                <CreatePrescriptionModal elderlyProfileId={selectedPatientId} medicines={medicines || []} />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                {prescriptions && prescriptions.length > 0 ? (
                  prescriptions.map((rx) => (
                    <section key={rx.id} className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-white/4.5">
                      <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-4 dark:border-white/5">
                        <div>
                          <div className="flex items-center gap-2">
                            <FileText className="size-5 text-blue-500" />
                            {/* --- ĐÃ SỬA LẠI ĐỊNH DẠNG TEXT Ở ĐÂY --- */}
                            <h3 className="font-black text-slate-900 dark:text-white">
                              Đơn thuốc từ ngày {rx.start_date ? new Date(rx.start_date).toLocaleDateString("vi-VN") : "..."} 
                              {rx.end_date ? ` đến ngày ${new Date(rx.end_date).toLocaleDateString("vi-VN")}` : " (Chưa có ngày kết thúc)"}
                            </h3>
                          </div>
                          <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                            Chẩn đoán: <span className="font-bold">{rx.diagnosis || "Không ghi nhận"}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <DeletePrescriptionButton id={rx.id} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        {rx.prescription_items?.map((item) => (
                          <div key={item.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/50">
                            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                              <Pill className="size-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {item.medicine?.name} {item.medicine?.strength}
                              </p>
                              <p className="text-[13px] text-slate-500">
                                {item.dosage} - {item.frequency} - <span className="font-bold text-blue-600 dark:text-blue-400">
                                  {item.time_slots?.map(t => t.slice(0, 5)).join(", ")}
                                </span>
                              </p>
                              {item.instructions && <p className="text-xs italic text-slate-500">{item.instructions}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="col-span-full rounded-[24px] border border-dashed border-slate-300 p-10 text-center dark:border-white/10">
                    <ClipboardList className="mx-auto mb-3 size-10 text-slate-400" />
                    <p className="font-bold text-slate-600 dark:text-slate-300">Bệnh nhân này chưa có đơn thuốc nào.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}