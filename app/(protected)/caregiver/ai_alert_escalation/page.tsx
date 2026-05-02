import Link from "next/link";

import { AlertEscalationForm } from "@/components/ai/alert-escalation-form";
import { AiAlertEscalationHistory } from "@/components/ai/alert-escalation-history";
import {
  getMyAlertEscalationProfiles,
  getMyAlertEscalationReports,
} from "@/lib/ai-alert-escalation-server";

export default async function CaregiverAiAlertEscalationPage() {
  const [profileResult, historyResult] = await Promise.all([
    getMyAlertEscalationProfiles(),
    getMyAlertEscalationReports(),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 bg-slate-50 px-4 py-6 md:px-6">
      <section className="rounded-3xl border border-black bg-white p-6">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-red-600">
              Home Care Station
            </p>

            <h1 className="mt-2 text-3xl font-black text-black">
              Cảnh báo khẩn cấp AI
            </h1>

            <p className="mt-3 max-w-3xl text-sm text-slate-700">
              Caregiver dùng trang này để gửi tình huống nguy hiểm sang n8n. AI
              sẽ phân loại mức độ, đưa gợi ý xử lý và lưu lịch sử cảnh báo vào
              Supabase.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/caregiver/ai"
              className="rounded-2xl border border-black px-4 py-2 text-sm font-bold text-black hover:bg-black hover:text-white"
            >
              AI Care
            </Link>

            <Link
              href="/caregiver/ai_medication_adherence"
              className="rounded-2xl border border-black px-4 py-2 text-sm font-bold text-black hover:bg-black hover:text-white"
            >
              Tuân thủ thuốc
            </Link>

            <Link
              href="/caregiver/ai_medication_check"
              className="rounded-2xl border border-black px-4 py-2 text-sm font-bold text-black hover:bg-black hover:text-white"
            >
              Kiểm tra thuốc
            </Link>
          </div>
        </div>
      </section>

      <AlertEscalationForm
        profiles={profileResult.profiles}
        profileErrorMessage={profileResult.errorMessage}
      />

      <AiAlertEscalationHistory
        reports={historyResult.reports}
        errorMessage={historyResult.errorMessage}
      />
    </main>
  );
}