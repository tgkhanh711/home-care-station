import Link from "next/link";
import { redirect } from "next/navigation";

import { AiHealthRiskForm } from "@/components/ai/ai-health-risk-local-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CaregiverAiHealthRiskPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profiles, error } = await supabase
    .from("elderly_profiles")
    .select("id, full_name")
    .order("created_at", { ascending: false });

  const safeProfiles = profiles ?? [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
            Home Care Station · AI/n8n
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
            AI Health Risk
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Trang này dùng để gửi tình trạng sức khỏe của người già sang n8n.
            Payload route gửi đi là{" "}
            <span className="font-semibold text-slate-900">
              ai_health_risk
            </span>
            , trùng với nhánh cuối trong Switch của workflow.
          </p>
        </header>

        <nav className="flex flex-wrap gap-3">
          <Link
            href="/caregiver"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            Về caregiver dashboard
          </Link>

          <Link
            href="/caregiver/ai"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            AI Care
          </Link>

          <Link
            href="/caregiver/scam-shield"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            Scam Shield
          </Link>

          <Link
            href="/caregiver/ai-chat"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-100"
          >
            AI Chat
          </Link>
        </nav>

        {error ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900">
            <h2 className="font-bold">Không đọc được hồ sơ người già</h2>
            <p className="mt-2 text-sm">{error.message}</p>
          </section>
        ) : null}

        {safeProfiles.length === 0 ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <h2 className="font-bold">Chưa có hồ sơ người già</h2>
            <p className="mt-2 text-sm">
              Bạn cần tạo hoặc liên kết hồ sơ người già trước khi gửi đánh giá
              nguy cơ sức khỏe sang n8n.
            </p>
          </section>
        ) : (
          <AiHealthRiskForm profiles={safeProfiles} />
        )}
      </div>
    </main>
  );
}