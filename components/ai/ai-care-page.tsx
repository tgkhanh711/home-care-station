import { redirect } from "next/navigation";

import { createAiCareReportAction } from "@/actions/ai-care";
import { createClient } from "@/lib/supabase/server";

type AiRole = "caregiver" | "doctor" | "station" | "admin";

type SearchParams = Record<string, string | string[] | undefined>;

type DbRow = Record<string, unknown>;

type DbError = {
  message: string;
};

type DbResponse<T> = {
  data: T | null;
  error: DbError | null;
};

type DbQuery<T = DbRow[]> = PromiseLike<DbResponse<T>> & {
  select: (columns?: string) => DbQuery<T>;
  order: (column: string, options?: { ascending?: boolean }) => DbQuery<T>;
  limit: (count: number) => DbQuery<T>;
};

type LooseSupabaseClient = {
  from: (table: string) => DbQuery;
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string; email?: string | null } | null };
      error: unknown;
    }>;
  };
};

type AiCarePageProps = {
  role: AiRole;
  searchParams?: SearchParams;
};

function toText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function getParam(params: SearchParams | undefined, key: string) {
  const value = params?.[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getProfileName(profile: DbRow) {
  return (
    toText(profile.full_name) ||
    toText(profile.name) ||
    toText(profile.elderly_name) ||
    "Không rõ tên"
  );
}

function formatDate(value: unknown) {
  const text = toText(value);

  if (!text) {
    return "—";
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return text;
  }

  return date.toLocaleString("vi-VN");
}

function normalizeRisk(value: unknown) {
  const risk = toText(value).toLowerCase();

  if (["high", "cao", "critical", "danger", "dangerous"].includes(risk)) {
    return {
      label: "Rủi ro cao",
      className: "border-black bg-black text-white",
    };
  }

  if (["low", "thấp", "thap", "safe", "normal"].includes(risk)) {
    return {
      label: "Rủi ro thấp",
      className: "border-black bg-white text-black",
    };
  }

  return {
    label: "Rủi ro trung bình",
    className: "border-black bg-white text-black",
  };
}

function getProfileMap(profiles: DbRow[]) {
  const map = new Map<string, string>();

  for (const profile of profiles) {
    const id = toText(profile.id);

    if (id) {
      map.set(id, getProfileName(profile));
    }
  }

  return map;
}

function getReportProfileName(report: DbRow, profileMap: Map<string, string>) {
  const profileId = toText(report.elderly_profile_id);

  if (!profileId) {
    return "Không gắn hồ sơ cụ thể";
  }

  return profileMap.get(profileId) ?? "Hồ sơ không còn trong danh sách truy cập";
}

export async function AiCarePage({ role, searchParams }: AiCarePageProps) {
  const supabase = await createClient();
  const db = supabase as unknown as LooseSupabaseClient;

  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const canCreateReport = role === "caregiver";

  const message = getParam(searchParams, "message");
  const error = getParam(searchParams, "error");

  const { data: profilesData, error: profilesError } = await db
    .from("elderly_profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: reportsData, error: reportsError } = await db
    .from("ai_care_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const profiles = Array.isArray(profilesData) ? profilesData : [];
  const reports = Array.isArray(reportsData) ? reportsData : [];
  const profileMap = getProfileMap(profiles);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8">
      {message ? (
        <section className="rounded-3xl border border-black bg-white p-5">
          <p className="font-semibold">Thành công</p>
          <p className="mt-1 text-sm">{message}</p>
        </section>
      ) : null}

      {error ? (
        <section className="rounded-3xl border border-black bg-white p-5">
          <p className="font-semibold">Lỗi</p>
          <p className="mt-1 text-sm">{error}</p>
        </section>
      ) : null}

      {canCreateReport ? (
        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">
            Tạo báo cáo
          </p>

          <h1 className="mt-3 text-3xl font-black">
            Phân tích chăm sóc bằng AI
          </h1>

          <p className="mt-4 text-sm text-neutral-700">
            Caregiver tạo báo cáo AI từ dữ liệu chăm sóc: hồ sơ, lịch sử uống
            thuốc, chỉ số sức khỏe, cảnh báo mới nhất và nội dung test nhập tay.
          </p>

          {profilesError ? (
            <div className="mt-5 rounded-2xl border border-black p-4 text-sm">
              Không tải được danh sách hồ sơ: {profilesError.message}
            </div>
          ) : null}

          {profiles.length > 0 ? (
            <form action={createAiCareReportAction} className="mt-5 space-y-5">
              <div>
                <label
                  htmlFor="elderlyProfileId"
                  className="text-sm font-bold"
                >
                  Chọn người cao tuổi
                </label>

                <select
                  id="elderlyProfileId"
                  name="elderlyProfileId"
                  className="mt-2 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-black"
                  required
                >
                  {profiles.map((profile) => (
                    <option key={toText(profile.id)} value={toText(profile.id)}>
                      {getProfileName(profile)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="manualTestContent"
                  className="text-sm font-bold"
                >
                  Nội dung test gửi sang AI/n8n
                </label>

                <textarea
                  id="manualTestContent"
                  name="manualTestContent"
                  rows={6}
                  className="mt-2 w-full resize-y rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-black"
                  placeholder="Ví dụ: Hôm nay người cao tuổi quên uống thuốc buổi sáng, hơi chóng mặt và huyết áp cao hơn bình thường. Hãy phân tích mức độ rủi ro và đề xuất cách xử lý."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-black px-5 py-4 text-base font-bold text-white"
              >
                Tạo báo cáo AI / Gửi test sang n8n
              </button>

              <p className="text-xs text-neutral-500">
                Nếu n8n đã cấu hình webhook, nội dung test sẽ được gửi trong
                payload. Nếu n8n chưa phản hồi, hệ thống vẫn tạo báo cáo local
                để không bị kẹt quy trình.
              </p>
            </form>
          ) : (
            <div className="mt-5 rounded-2xl border border-black p-4 text-sm">
              Chưa có hồ sơ người cao tuổi nào mà tài khoản này được phép phân
              tích.
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">
            Quyền truy cập
          </p>

          <h1 className="mt-3 text-3xl font-black">AI Care Reader</h1>

          <p className="mt-4 text-sm text-neutral-700">
            Tài khoản hiện tại chỉ xem báo cáo AI đã được tạo. Chỉ caregiver mới
            có quyền tạo báo cáo mới.
          </p>
        </section>
      )}

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">
          Hồ sơ có thể phân tích
        </p>

        <h2 className="mt-3 text-2xl font-black">{profiles.length} hồ sơ</h2>

        {profiles.length > 0 ? (
          <div className="mt-5 grid gap-4">
            {profiles.map((profile) => (
              <article
                key={toText(profile.id)}
                className="rounded-2xl border border-neutral-200 p-5"
              >
                <h3 className="font-bold">{getProfileName(profile)}</h3>

                <p className="mt-2 text-sm text-neutral-700">
                  Năm sinh: {toText(profile.birth_year) || "—"} · Giới tính:{" "}
                  {toText(profile.gender) || "—"}
                </p>

                <p className="mt-1 text-sm text-neutral-700">
                  Địa chỉ: {toText(profile.address) || "—"}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            Chưa có hồ sơ nào trong phạm vi truy cập.
          </p>
        )}
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-neutral-500">
              Lịch sử AI
            </p>

            <h2 className="mt-3 text-2xl font-black">Báo cáo gần đây</h2>
          </div>

          <p className="text-sm text-neutral-600">
            Hiển thị {reports.length}/10 báo cáo mới nhất
          </p>
        </div>

        {reportsError ? (
          <div className="mt-5 rounded-2xl border border-black p-4 text-sm">
            Không tải được lịch sử AI: {reportsError.message}
          </div>
        ) : null}

        {reports.length > 0 ? (
          <div className="mt-5 grid max-h-180 gap-4 overflow-y-auto pr-2">
            {reports.map((report) => {
              const risk = normalizeRisk(report.risk_level);
              const summary = toText(report.summary);
              const recommendations = toText(report.recommendations);

              return (
                <article
                  key={toText(report.id)}
                  className="rounded-2xl border border-black p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black">
                          {toText(report.title) || "Báo cáo AI"}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${risk.className}`}
                        >
                          {risk.label}
                        </span>

                        <span className="rounded-full border border-black px-3 py-1 text-xs">
                          {toText(report.source) || "local"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm">
                        Hồ sơ: {getReportProfileName(report, profileMap)}
                      </p>
                    </div>

                    <div className="text-sm text-neutral-600 sm:text-right">
                      <p>Tạo: {formatDate(report.created_at)}</p>
                      <p>Phân tích: {formatDate(report.analyzed_at)}</p>
                    </div>
                  </div>

                  {summary ? (
                    <div className="mt-5">
                      <p className="font-bold">Tóm tắt:</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                        {summary}
                      </p>
                    </div>
                  ) : null}

                  {recommendations ? (
                    <div className="mt-4">
                      <p className="font-bold">Khuyến nghị:</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                        {recommendations}
                      </p>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-5 text-sm text-neutral-600">
            Chưa có báo cáo AI nào.
          </p>
        )}
      </section>
    </main>
  );
}