import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type ScamReport = {
  id: string;
  elderly_display_name: string | null;
  source_type: string;
  content: string;
  status: string;
  risk_level: string;
  risk_score: number;
  category: string | null;
  reasons: string[] | unknown;
  recommended_action: string | null;
  alert_created: boolean;
  created_at: string;
  analyzed_at: string | null;
};

function normalizeReasons(reasons: ScamReport["reasons"]) {
  if (Array.isArray(reasons)) {
    return reasons.map((item) => String(item));
  }

  return [];
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function shouldShow(report: ScamReport) {
  return (
    report.risk_level === "critical" ||
    report.risk_level === "high" ||
    report.risk_score >= 70
  );
}

export default async function StationScamShieldPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = typeof userRow?.role === "string" ? userRow.role : "";

  if (role !== "station" && role !== "admin") {
    redirect(role ? `/${role}` : "/login");
  }

  const { data: reports } = await supabase.rpc("hcs_get_my_scam_reports");

  const riskyReports = ((reports ?? []) as ScamReport[]).filter(shouldShow);

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-3xl border border-zinc-700 bg-zinc-900 p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-400">
                Home Care Station
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                Cảnh báo lừa đảo y tế
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-300">
                Trang station chỉ hiển thị cảnh báo rủi ro cao để người cao tuổi
                không bấm link, không chuyển tiền và gọi người nhà xác minh.
              </p>
            </div>

            <Link
              href="/station"
              className="rounded-full border border-zinc-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-zinc-950"
            >
              Quay lại Station
            </Link>
          </div>
        </section>

        {riskyReports.length === 0 ? (
          <section className="rounded-3xl border border-zinc-700 bg-zinc-900 p-8 text-center">
            <p className="text-2xl font-semibold">Không có cảnh báo nguy hiểm</p>
            <p className="mt-3 text-sm text-zinc-400">
              Khi caregiver gửi nội dung nghi lừa đảo và n8n đánh giá rủi ro
              cao, cảnh báo sẽ hiện ở đây.
            </p>
          </section>
        ) : (
          <section className="grid gap-4">
            {riskyReports.map((report) => (
              <article
                key={report.id}
                className="rounded-3xl border border-red-500 bg-red-950 p-6"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-red-200">
                      Không bấm link · Không chuyển tiền
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold">
                      Nghi lừa đảo y tế
                    </h2>
                    <p className="mt-2 text-sm text-red-100">
                      Điểm rủi ro: {report.risk_score} ·{" "}
                      {report.category || "unknown"}
                    </p>
                  </div>

                  <p className="text-sm text-red-100">
                    {formatDate(report.analyzed_at || report.created_at)}
                  </p>
                </div>

                <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm leading-6 text-red-50">
                  {report.content}
                </div>

                {normalizeReasons(report.reasons).length > 0 ? (
                  <div className="mt-5">
                    <p className="font-semibold text-red-50">
                      Dấu hiệu nguy hiểm
                    </p>
                    <ul className="mt-2 grid gap-1 text-sm text-red-100">
                      {normalizeReasons(report.reasons).map((reason) => (
                        <li key={reason}>- {reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-5 rounded-2xl bg-white p-4 text-zinc-950">
                  <p className="font-semibold">Việc cần làm ngay</p>
                  <p className="mt-2 text-sm leading-6">
                    {report.recommended_action ||
                      "Không thực hiện theo nội dung này. Hãy gọi người nhà hoặc bác sĩ để xác minh."}
                  </p>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}