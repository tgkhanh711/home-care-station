import Link from "next/link";

import {
  createMedicationAdherenceReportAction,
  getMedicationAdherencePageData,
} from "@/actions/ai-medication-adherence";

type PageProps = {
  searchParams?: Promise<{
    status?: string;
    message?: string;
  }>;
};

function getRiskLabel(riskLevel: string) {
  if (riskLevel === "high") return "Nguy cơ cao";
  if (riskLevel === "medium") return "Nguy cơ trung bình";
  return "Nguy cơ thấp";
}

function getRiskClass(riskLevel: string) {
  if (riskLevel === "high") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (riskLevel === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default async function CaregiverMedicationAdherenceAIPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : {};
  const { elderlyProfiles, reports } = await getMedicationAdherencePageData();

  const status = params?.status;
  const message = params?.message;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                AI/n8n · Cụm 7
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                AI phân tích tuân thủ dùng thuốc
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Caregiver nhập ghi chú về việc người cao tuổi uống thuốc. Hệ thống gửi sang
                n8n route <b>ai_medication_adherence</b>, sau đó lưu kết quả phân tích vào
                Supabase và hiển thị 10 báo cáo mới nhất.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/caregiver"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Dashboard
              </Link>

              <Link
                href="/caregiver/ai"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                AI Care
              </Link>

              <Link
                href="/caregiver/scam-shield"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Scam Shield
              </Link>

              <Link
                href="/caregiver/ai_health_risk"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Health Risk
              </Link>
            </div>
          </div>
        </section>

        {message ? (
          <section
            className={
              status === "success"
                ? "rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"
                : "rounded-3xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"
            }
          >
            {message}
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Tạo phân tích mới</h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Nhập tình trạng uống thuốc thật rõ: đã uống thuốc gì, quên liều nào,
              có uống sai thuốc không, có dấu hiệu bất thường không.
            </p>

            <form action={createMedicationAdherenceReportAction} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="elderly_profile_id"
                  className="text-sm font-semibold text-slate-800"
                >
                  Hồ sơ người cao tuổi
                </label>

                <select
                  id="elderly_profile_id"
                  name="elderly_profile_id"
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                >
                  <option value="">Chọn hồ sơ</option>

                  {elderlyProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name ?? "Người cao tuổi chưa có tên"}
                    </option>
                  ))}
                </select>

                {elderlyProfiles.length === 0 ? (
                  <p className="mt-2 text-sm text-red-600">
                    Chưa có hồ sơ người cao tuổi mà tài khoản này được quyền truy cập.
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="medication_note" className="text-sm font-semibold text-slate-800">
                  Ghi chú dùng thuốc
                </label>

                <textarea
                  id="medication_note"
                  name="medication_note"
                  required
                  rows={8}
                  placeholder="Ví dụ: Ông B hôm nay quên uống thuốc huyết áp buổi sáng, buổi tối uống muộn 2 tiếng. Có chóng mặt nhẹ."
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={elderlyProfiles.length === 0}
              >
                Gửi sang n8n để phân tích
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Lịch sử AI mới nhất</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Chỉ hiển thị 10 báo cáo mới nhất.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {reports.length}/10
              </span>
            </div>

            <div className="mt-5 max-h-155 space-y-4 overflow-y-auto pr-2">
              {reports.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                  Chưa có báo cáo tuân thủ dùng thuốc nào.
                </div>
              ) : (
                reports.map((report) => (
                  <article
                    key={report.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-bold text-slate-950">{report.title}</h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(report.created_at).toLocaleString("vi-VN")}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${getRiskClass(
                          report.risk_level
                        )}`}
                      >
                        {getRiskLabel(report.risk_level)}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs text-slate-500">Điểm tuân thủ</p>
                        <p className="mt-1 text-xl font-black text-slate-950">
                          {report.adherence_score}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs text-slate-500">Đã uống</p>
                        <p className="mt-1 text-xl font-black text-slate-950">
                          {report.taken_count}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs text-slate-500">Quên/chưa uống</p>
                        <p className="mt-1 text-xl font-black text-slate-950">
                          {report.missed_count}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs text-slate-500">Bỏ liều</p>
                        <p className="mt-1 text-xl font-black text-slate-950">
                          {report.skipped_count}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-700">{report.summary}</p>

                    {report.recommendations.length > 0 ? (
                      <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700">
                        {report.recommendations.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}