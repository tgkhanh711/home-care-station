import Link from "next/link";
import { redirect } from "next/navigation";

import { MedicationCheckForm } from "@/components/ai/medication-check-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "AI Medication Check | Home Care Station",
  description: "Kiểm tra đúng sai thuốc bằng AI/n8n trước khi người cao tuổi uống.",
};

type MedicationCheckReport = {
  id: string;
  created_at: string;
  title: string;
  expected_medicine: string;
  observed_medicine: string;
  result_status: string;
  risk_level: string;
  confidence: number;
  summary: string;
  advice: string;
};

export default async function CaregiverMedicationCheckPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: elderlyProfiles } = await supabase
    .from("elderly_profiles")
    .select("id, full_name")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: reports } = await supabase
    .from("ai_medication_check_reports")
    .select(
      "id, created_at, title, expected_medicine, observed_medicine, result_status, risk_level, confidence, summary, advice",
    )
    .order("created_at", { ascending: false })
    .limit(10);

  const safeProfiles = elderlyProfiles || [];
  const safeReports = (reports || []) as MedicationCheckReport[];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Home Care Station
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">
                AI kiểm tra thuốc
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Trang này dùng để kiểm tra nhanh thuốc dự kiến và thuốc quan sát
                được trước khi người cao tuổi uống. Đây là bước đệm trước khi
                tích hợp camera thật và Computer Vision.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/caregiver"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                Dashboard
              </Link>
              <Link
                href="/caregiver/ai"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                AI Care
              </Link>
              <Link
                href="/caregiver/ai_chat"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                AI Chat
              </Link>
              <Link
                href="/caregiver/ai_care_plan"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                Care Plan
              </Link>
              <Link
                href="/caregiver/ai_health_risk"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                Health Risk
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <MedicationCheckForm elderlyProfiles={safeProfiles} />

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Lịch sử gần nhất
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-950">
                10 kết quả mới nhất
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Chỉ hiển thị 10 bản ghi mới nhất để tránh trang bị dài và khó
                theo dõi.
              </p>
            </div>

            {safeReports.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Chưa có lịch sử kiểm tra thuốc AI.
              </div>
            ) : (
              <div className="max-h-180 space-y-3 overflow-y-auto pr-1">
                {safeReports.map((report) => (
                  <article
                    key={report.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-950">
                        {report.title}
                      </h3>
                      <span
                        className={
                          report.risk_level === "high"
                            ? "rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700"
                            : report.risk_level === "medium"
                              ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700"
                              : "rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700"
                        }
                      >
                        {report.risk_level}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(report.created_at).toLocaleString("vi-VN")}
                    </p>

                    <div className="mt-3 grid gap-2 text-sm text-slate-700">
                      <p>
                        <span className="font-semibold">Thuốc dự kiến:</span>{" "}
                        {report.expected_medicine}
                      </p>
                      <p>
                        <span className="font-semibold">Thuốc quan sát:</span>{" "}
                        {report.observed_medicine}
                      </p>
                      <p>
                        <span className="font-semibold">Kết luận:</span>{" "}
                        {report.result_status}
                      </p>
                      <p>
                        <span className="font-semibold">Độ tin cậy:</span>{" "}
                        {Math.round(Number(report.confidence || 0) * 100)}%
                      </p>
                      <p>
                        <span className="font-semibold">Tóm tắt:</span>{" "}
                        {report.summary}
                      </p>
                      <p>
                        <span className="font-semibold">Khuyến nghị:</span>{" "}
                        {report.advice}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}