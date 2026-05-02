import Link from "next/link";
import { redirect } from "next/navigation";

import { AiAlertEscalationHistory } from "@/components/ai/alert-escalation-history";
import type { AiAlertEscalationReport } from "@/lib/ai-alert-escalation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DoctorAiAlertEscalationPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: reportsData, error: reportsError } = await supabase.rpc(
    "get_my_ai_alert_escalations",
    {
      p_limit: 10,
    },
  );

  const reports = Array.isArray(reportsData)
    ? (reportsData as AiAlertEscalationReport[])
    : [];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <section className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
                Doctor AI
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Cảnh báo AI từ người chăm sóc
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-600">
                Bác sĩ xem các cảnh báo AI liên quan đến hồ sơ mình có quyền
                truy cập. Trang này chỉ đọc, không tạo cảnh báo mới.
              </p>
            </div>

            <Link
              href="/doctor/ai"
              className="w-fit rounded-2xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Quay lại Doctor AI
            </Link>
          </div>
        </section>

        <AiAlertEscalationHistory
          reports={reports}
          errorMessage={reportsError?.message ?? null}
        />
      </div>
    </main>
  );
}