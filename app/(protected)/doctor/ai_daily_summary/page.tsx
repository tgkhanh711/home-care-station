import Link from "next/link";
import { redirect } from "next/navigation";

import DailySummaryHistory from "@/components/ai/daily-summary-history";
import type { AiDailySummaryReport } from "@/lib/ai-daily-summary";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DoctorAiDailySummaryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const {
    data: reportsData,
    error: reportsError,
  } = await supabase.rpc("get_my_ai_daily_summaries", {
    p_limit: 10,
  });

  const reports = Array.isArray(reportsData)
    ? (reportsData as AiDailySummaryReport[])
    : [];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
                Doctor AI
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                AI Daily Summary
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Bác sĩ xem các bản tổng hợp chăm sóc mới nhất. Trang này chỉ
                đọc, không tạo báo cáo mới.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/doctor/ai"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Doctor AI
              </Link>
              <Link
                href="/doctor/ai_alert_escalation"
                className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cảnh báo AI
              </Link>
            </div>
          </div>
        </section>

        <DailySummaryHistory
          reports={reports}
          errorMessage={reportsError?.message}
        />
      </div>
    </main>
  );
}