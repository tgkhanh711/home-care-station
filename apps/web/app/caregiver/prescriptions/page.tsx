import Link from "next/link";
import type { Database } from "@/database";
import {
  Bot,
  FileText,
  Home,
  Pill,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getElderlyProfiles } from "@/app/actions/elderly";
import { getPatientPrescriptions } from "@/app/actions/prescriptions";

type PrescriptionWithItems = {
  id: string;
  doctor?: {
    full_name: string | null;
  };
  diagnosis?: string | null;
  prescription_items?: Array<
    Database["public"]["Tables"]["prescription_items"]["Row"] & {
      medicine?: {
        name: string | null;
        dosage_form: string | null;
        strength: string | null;
      };
    }
  >;
};

const sidebarItems = [
  { href: "/caregiver", label: "Trang chính", icon: Home },
  { href: "/caregiver/prescriptions", label: "Lịch thuốc & Y lệnh", icon: Pill, active: true },
  { href: "/caregiver", label: "AI Care", icon: Bot },
];

export default async function CaregiverPrescriptionsPage() {
  const { data: profiles } = await getElderlyProfiles();
  const profile = profiles?.[0];

  const prescriptions: PrescriptionWithItems[] = profile
    ? ((await getPatientPrescriptions(profile.id)).data ?? []) as PrescriptionWithItems[]
    : [];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm dark:border-white/8 dark:bg-slate-950 lg:px-5">
        <div className="flex h-full shrink-0 items-center gap-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-900/20 dark:bg-blue-500">
            HCS
          </div>
          <p className="hidden text-sm font-black leading-4 md:block">Trung tâm người nhà</p>
        </div>
        <div className="flex h-full shrink-0 items-center gap-2 lg:gap-3">
          <ThemeToggle />
          <Link href="/caregiver">
            <button className="whitespace-nowrap h-11 shrink-0 rounded-2xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg transition hover:bg-blue-700 dark:bg-blue-500">
              Quay lại
            </button>
          </Link>
        </div>
      </header>

      <div className="grid flex-1 overflow-hidden grid-cols-1 lg:grid-cols-[244px_1fr]">
        <aside className="custom-scrollbar hidden overflow-y-auto border-r border-slate-200 bg-slate-50/50 px-3 py-4 dark:border-white/8 dark:bg-slate-950/50 lg:block">
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.label} href={item.href} className={['flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold transition', item.active ? 'bg-blue-100 text-blue-900 shadow-sm dark:bg-blue-500/20 dark:text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'].join(' ')}>
                  <Icon className="size-5 shrink-0" strokeWidth={2.4} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="custom-scrollbar min-w-0 overflow-y-auto bg-slate-50 p-4 dark:bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_34%),linear-gradient(180deg,#07101f_0%,#0b1220_48%,#070b14_100%)] lg:p-5 xl:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Phác đồ điều trị: {profile?.full_name}
            </h1>
            <p className="mt-1 text-slate-500">Danh sách y lệnh từ bác sĩ điều trị.</p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {prescriptions && prescriptions.length > 0 ? (
              prescriptions.map((rx) => (
                <section key={rx.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-colors dark:border-white/8 dark:bg-white/2 dark:shadow-md">
                  <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-4 dark:border-white/5">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="size-5 text-blue-500" />
                        <h3 className="font-black text-slate-900 dark:text-white">
                          Bác sĩ kê đơn: {rx.doctor?.full_name || "Chưa rõ"}
                        </h3>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                        Chẩn đoán: {rx.diagnosis || "Không ghi nhận"}
                      </p>
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
                          <p className="text-sm text-slate-500">
                            {item.dosage} - {item.frequency} - {item.instructions}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <p className="text-slate-500">Chưa có đơn thuốc nào.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}