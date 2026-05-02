import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const tables = [
  "users",
  "caregivers",
  "doctors",
  "elderly_profiles",
  "doctor_assignment_requests",
  "prescriptions",
  "medication_logs",
  "alerts",
  "scam_reports",
  "ai_analysis_logs",
] as const;

export default async function AdminPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const stats = await Promise.all(
    tables.map(async (table) => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      return {
        table,
        count: error ? 0 : count ?? 0,
      };
    }),
  );

  return (
    <section className="space-y-8">
      <div className="rounded-4xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-black/45">
          Admin overview
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-black">
          Tổng quan hệ thống
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-black/60">
          Trang này dùng để kiểm tra nền tảng: users, caregivers, doctors, elderly profiles,
          prescriptions, alerts và AI logs. Các cụm sau sẽ mở rộng thành dashboard quản trị thật.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((item) => (
          <div key={item.table} className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
              {item.table}
            </p>
            <p className="mt-4 text-3xl font-semibold text-black">{item.count}</p>
          </div>
        ))}
      </div>
    </section>
  );
}