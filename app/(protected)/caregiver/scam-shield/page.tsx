import Link from "next/link";
import { redirect } from "next/navigation";

import { submitScamReportAction } from "@/actions/scam-shield";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type ElderlyOption = {
  elderly_profile_id: string;
  elderly_label: string;
};

type ScamReport = {
  report_id: string;
  elderly_label: string | null;
  source_type: string;
  content: string | null;
  note: string | null;
  risk_level: string | null;
  analysis_status: string | null;
  summary: string | null;
  reason: string | null;
  recommended_action: string | null;
  n8n_response: unknown;
  created_at: string;
  analyzed_at: string | null;
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function riskLabel(riskLevel: string | null | undefined) {
  switch ((riskLevel || "").toLowerCase()) {
    case "high":
      return "Rủi ro cao";
    case "medium":
      return "Rủi ro trung bình";
    case "low":
      return "Rủi ro thấp";
    default:
      return "Đang chờ";
  }
}

function statusLabel(status: string | null | undefined) {
  switch ((status || "").toLowerCase()) {
    case "analyzed":
      return "Đã phân tích";
    case "pending":
      return "Đang chờ n8n";
    default:
      return status || "Đang chờ";
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function CaregiverScamShieldPage({
  searchParams,
}: PageProps) {
  const params = searchParams ? await searchParams : {};
  const status = readParam(params, "status");
  const message = readParam(params, "message");

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [elderlyResult, reportsResult] = await Promise.all([
    supabase.rpc("hcs_get_my_scam_shield_elderly_options"),
    supabase.rpc("hcs_get_my_scam_shield_reports"),
  ]);

  const elderlyOptions = (elderlyResult.data ?? []) as ElderlyOption[];
  const reports = ((reportsResult.data ?? []) as ScamReport[]).slice(0, 15);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <section className="rounded-3xl border border-zinc-900 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-[0.35em] text-zinc-900">
              HOME CARE STATION
            </p>
            <h1 className="text-3xl font-bold text-zinc-950">Scam Shield</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-800">
              Phân tích SMS, email, tin nhắn, nội dung cuộc gọi hoặc văn bản
              nghi lừa đảo y tế. Kết quả chỉ là đánh giá rủi ro hỗ trợ, không
              thay thế xác minh trực tiếp với bác sĩ hoặc bệnh viện.
            </p>
          </div>

          <Link
            href="/caregiver"
            className="rounded-full border border-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-950 hover:text-white"
          >
            Quay lại Caregiver
          </Link>
        </div>
      </section>

      {message ? (
        <section
          className={[
            "rounded-3xl border px-5 py-4 text-sm font-medium",
            status === "success"
              ? "border-emerald-700 bg-emerald-50 text-emerald-900"
              : "border-red-700 bg-red-50 text-red-900",
          ].join(" ")}
        >
          {message}
        </section>
      ) : null}

      {elderlyResult.error ? (
        <section className="rounded-3xl border border-red-700 bg-red-50 px-5 py-4 text-sm text-red-900">
          Lỗi tải danh sách hồ sơ người cao tuổi: {elderlyResult.error.message}
        </section>
      ) : null}

      {reportsResult.error ? (
        <section className="rounded-3xl border border-red-700 bg-red-50 px-5 py-4 text-sm text-red-900">
          Lỗi tải lịch sử Scam Shield: {reportsResult.error.message}
        </section>
      ) : null}

      <section className="rounded-3xl border border-zinc-900 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-950">
          Gửi nội dung nghi lừa đảo
        </h2>
        <p className="mt-2 text-sm text-zinc-700">
          Dán nguyên văn nội dung đáng nghi. Không nhập mật khẩu, OTP, số thẻ
          hoặc thông tin định danh nhạy cảm.
        </p>

        <form action={submitScamReportAction} className="mt-6 flex flex-col gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-900">
                Nguồn nội dung
              </span>
              <select
                name="source_type"
                defaultValue="text"
                className="rounded-2xl border border-zinc-900 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="call_transcript">Nội dung cuộc gọi</option>
                <option value="chat">Tin nhắn/chat</option>
                <option value="text">Văn bản khác</option>
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-zinc-900">
                Hồ sơ người cao tuổi
              </span>
              <select
                name="elderly_profile_id"
                defaultValue=""
                className="rounded-2xl border border-zinc-900 bg-white px-4 py-3 text-sm outline-none"
              >
                <option value="">Không gắn hồ sơ cụ thể</option>
                {elderlyOptions.map((elderly) => (
                  <option
                    key={elderly.elderly_profile_id}
                    value={elderly.elderly_profile_id}
                  >
                    {elderly.elderly_label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-900">
              Nội dung cần phân tích
            </span>
            <textarea
              name="content"
              required
              minLength={10}
              placeholder="Ví dụ: Tôi là bác sĩ bệnh viện, người nhà bạn cần chuyển khoản gấp để nhận thuốc đặc trị..."
              className="min-h-52 rounded-2xl border border-zinc-900 bg-white px-4 py-3 text-sm leading-6 outline-none"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-900">
              Ghi chú nội bộ
            </span>
            <input
              name="note"
              placeholder="Ví dụ: Tin nhắn gửi đến số của mẹ lúc 9h sáng"
              className="rounded-2xl border border-zinc-900 bg-white px-4 py-3 text-sm outline-none"
            />
          </label>

          <button
            type="submit"
            className="w-fit rounded-full bg-zinc-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
          >
            Gửi phân tích Scam Shield
          </button>
        </form>
      </section>

      <section className="rounded-3xl border border-zinc-900 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-950">
          15 phân tích mới nhất
        </h2>
        <p className="mt-2 text-sm text-zinc-700">
          Kết quả được lưu từ web và n8n. Bản ghi mới sẽ hiện ngay ở trạng thái
          đang chờ, sau đó được n8n cập nhật thành đã phân tích.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {reports.length === 0 ? (
            <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-700">
              Chưa có nội dung nào được phân tích.
            </p>
          ) : (
            reports.map((report) => (
              <article
                key={report.report_id}
                className="rounded-2xl border border-zinc-300 bg-white p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-zinc-950">
                        {riskLabel(report.risk_level)}
                      </h3>
                      <span className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold text-zinc-700">
                        {statusLabel(report.analysis_status)}
                      </span>
                      <span className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700">
                        {report.source_type}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-zinc-500">
                      Hồ sơ: {report.elderly_label || "Không gắn hồ sơ cụ thể"}
                    </p>
                  </div>

                  <div className="text-xs text-zinc-500 md:text-right">
                    <p>Tạo: {formatDate(report.created_at)}</p>
                    <p>Phân tích: {formatDate(report.analyzed_at)}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-zinc-50 p-4 text-sm leading-6 text-zinc-800">
                  {report.content || "Không có nội dung."}
                </div>

                {report.note ? (
                  <p className="mt-3 text-sm text-zinc-600">
                    <span className="font-semibold">Ghi chú:</span>{" "}
                    {report.note}
                  </p>
                ) : null}

                {report.summary ? (
                  <p className="mt-4 text-sm text-zinc-800">
                    <span className="font-semibold">Tóm tắt:</span>{" "}
                    {report.summary}
                  </p>
                ) : null}

                {report.reason ? (
                  <p className="mt-2 text-sm text-zinc-800">
                    <span className="font-semibold">Lý do:</span>{" "}
                    {report.reason}
                  </p>
                ) : null}

                {report.recommended_action ? (
                  <p className="mt-2 text-sm text-zinc-800">
                    <span className="font-semibold">Khuyến nghị:</span>{" "}
                    {report.recommended_action}
                  </p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}