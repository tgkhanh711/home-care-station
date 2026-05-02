import type { AiAlertEscalationReport } from "@/lib/ai-alert-escalation";

type AiAlertEscalationHistoryProps = {
  reports: AiAlertEscalationReport[];
  errorMessage?: string | null;
  title?: string;
};

function readString(
  report: AiAlertEscalationReport,
  keys: string[],
  fallback = "",
): string {
  const source = report as Record<string, unknown>;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return fallback;
}

function readStringArray(
  report: AiAlertEscalationReport,
  keys: string[],
): string[] {
  const source = report as Record<string, unknown>;

  for (const key of keys) {
    const value = source[key];

    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (typeof value === "string" && value.trim().length > 0) {
      try {
        const parsed: unknown = JSON.parse(value);

        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
        }
      } catch {
        return value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }
  }

  return [];
}

function formatDate(value: string): string {
  if (!value) {
    return "Không rõ thời gian";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSeverityLabel(severity: string): string {
  const value = severity.toLowerCase();

  if (value === "critical") return "Khẩn cấp";
  if (value === "high") return "Cao";
  if (value === "medium") return "Trung bình";
  if (value === "low") return "Thấp";

  return severity || "Chưa rõ";
}

function getSeverityClass(severity: string): string {
  const value = severity.toLowerCase();

  if (value === "critical") {
    return "border-red-300 bg-red-50 text-red-700";
  }

  if (value === "high") {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  if (value === "medium") {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  return "border-emerald-300 bg-emerald-50 text-emerald-700";
}

export function AiAlertEscalationHistory({
  reports,
  errorMessage,
  title = "10 cảnh báo AI mới nhất",
}: AiAlertEscalationHistoryProps) {
  return (
    <section className="rounded-3xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
        Lịch sử gần nhất
      </p>

      <h2 className="mt-2 text-2xl font-bold text-slate-950">{title}</h2>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Lỗi tải lịch sử cảnh báo AI: {errorMessage}
        </div>
      ) : null}

      {!errorMessage && reports.length === 0 ? (
        <div className="mt-4 rounded-2xl border bg-slate-50 p-4 text-sm text-slate-600">
          Chưa có lịch sử cảnh báo AI.
        </div>
      ) : null}

      {reports.length > 0 ? (
        <div className="mt-4 grid max-h-140 gap-3 overflow-y-auto pr-1">
          {reports.map((report, index) => {
            const source = report as Record<string, unknown>;

            const id = readString(report, ["id"], String(index));
            const severity = readString(
              report,
              ["severity", "risk_level", "urgency_level", "suggested_urgency"],
              "unknown",
            );
            const status = readString(
              report,
              ["status", "processing_status"],
              "Đã phân tích",
            );
            const elderlyName = readString(
              report,
              [
                "elderly_name",
                "elderly_full_name",
                "patient_name",
                "full_name",
              ],
              "Hồ sơ người cao tuổi",
            );
            const summary = readString(
              report,
              ["summary", "ai_summary", "situation_summary", "description"],
              "Chưa có tóm tắt.",
            );
            const advice = readString(report, [
              "advice",
              "recommendation",
              "recommended_action",
              "suggested_action",
            ]);
            const alertSource = readString(report, [
              "alert_source",
              "source",
            ]);
            const createdAt = readString(report, [
              "created_at",
              "inserted_at",
              "createdAt",
            ]);
            const warningSigns = readStringArray(report, [
              "warning_signs",
              "signs",
              "detected_signs",
            ]);

            const key =
              typeof source.id === "string"
                ? source.id
                : `${id}-${createdAt}-${index}`;

            return (
              <article
                key={key}
                className="rounded-2xl border bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      {elderlyName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getSeverityClass(
                        severity,
                      )}`}
                    >
                      {getSeverityLabel(severity)}
                    </span>

                    <span className="rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      {status}
                    </span>
                  </div>
                </div>

                {alertSource ? (
                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    Nguồn cảnh báo: {alertSource}
                  </p>
                ) : null}

                <p className="mt-3 text-sm leading-6 text-slate-700">
                  <span className="font-semibold text-slate-950">Tóm tắt: </span>
                  {summary}
                </p>

                {advice ? (
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    <span className="font-semibold text-slate-950">Gợi ý: </span>
                    {advice}
                  </p>
                ) : null}

                {warningSigns.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {warningSigns.map((sign) => (
                      <span
                        key={sign}
                        className="rounded-full border bg-white px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {sign}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default AiAlertEscalationHistory;