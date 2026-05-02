import type { AiDailySummaryReport } from "@/lib/ai-daily-summary";

type DailySummaryHistoryProps = {
  reports: AiDailySummaryReport[];
  errorMessage?: string;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseJsonString(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function toCleanText(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "null" || trimmed === "undefined") return "";

    const parsed = parseJsonString(trimmed);

    if (parsed !== trimmed) {
      return toCleanText(parsed);
    }

    return trimmed;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(toCleanText).filter(Boolean).join("\n");
  }

  if (isRecord(value)) {
    const directText =
      toCleanText(value.summary_text) ||
      toCleanText(value.ai_summary) ||
      toCleanText(value.summary) ||
      toCleanText(value.report) ||
      toCleanText(value.analysis) ||
      toCleanText(value.output) ||
      toCleanText(value.text) ||
      toCleanText(value.content) ||
      toCleanText(value.message);

    if (directText) return directText;
  }

  return "";
}

function toTextList(value: unknown): string[] {
  if (value === null || value === undefined) return [];

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed === "null" || trimmed === "undefined") return [];

    const parsed = parseJsonString(trimmed);

    if (parsed !== trimmed) {
      return toTextList(parsed);
    }

    return [trimmed];
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        if (isRecord(item)) {
          return (
            toCleanText(item.title) ||
            toCleanText(item.text) ||
            toCleanText(item.content) ||
            toCleanText(item.summary) ||
            toCleanText(item.action) ||
            toCleanText(item.recommendation) ||
            toCleanText(item.reason)
          );
        }

        return toCleanText(item);
      })
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  if (isRecord(value)) {
    const nestedList =
      value.items ??
      value.list ??
      value.key_points ??
      value.recommendations ??
      value.warning_signs ??
      value.care_priorities ??
      value.follow_up_actions ??
      value.actions;

    if (nestedList !== undefined) {
      return toTextList(nestedList);
    }

    return Object.values(value)
      .flatMap((item) => toTextList(item))
      .filter(Boolean)
      .slice(0, 8);
  }

  return [];
}

function pickFromRaw(raw: unknown, keys: string[]): unknown {
  if (!isRecord(raw)) return undefined;

  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) {
      return raw[key];
    }
  }

  const nestedKeys = ["responseBody", "result", "report", "data", "payload"];

  for (const nestedKey of nestedKeys) {
    const nested = raw[nestedKey];

    if (isRecord(nested)) {
      const found = pickFromRaw(nested, keys);

      if (found !== undefined && found !== null) {
        return found;
      }
    }
  }

  return undefined;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = toCleanText(value);

    if (text) return text;
  }

  return "";
}

function firstList(...values: unknown[]): string[] {
  for (const value of values) {
    const list = toTextList(value);

    if (list.length > 0) return list;
  }

  return [];
}

function getRiskClass(riskLevel: string) {
  if (riskLevel === "critical") {
    return "border-red-300 bg-red-50 text-red-700";
  }

  if (riskLevel === "high") {
    return "border-orange-300 bg-orange-50 text-orange-700";
  }

  if (riskLevel === "medium") {
    return "border-amber-300 bg-amber-50 text-amber-700";
  }

  return "border-emerald-300 bg-emerald-50 text-emerald-700";
}

function getStatusLabel(status: string) {
  if (status === "completed") return "Đã hoàn thành";
  if (status === "pending") return "Đang chờ n8n";
  if (status === "failed") return "Lỗi";
  return status;
}

function getReportId(report: AiDailySummaryReport) {
  return report.id || report.report_id || report.daily_summary_id || crypto.randomUUID();
}

export default function DailySummaryHistory({
  reports,
  errorMessage,
}: DailySummaryHistoryProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
        Lịch sử gần nhất
      </p>

      <h2 className="mt-2 text-2xl font-bold text-slate-950">
        10 AI Daily Summary mới nhất
      </h2>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {reports.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Chưa có lịch sử AI Daily Summary.
        </div>
      ) : (
        <div className="mt-5 grid max-h-168 gap-4 overflow-y-auto pr-1">
          {reports.map((report) => {
            const raw = report.raw_result ?? report.n8n_raw;

            const aiSummary = firstText(
              report.ai_summary,
              report.summary_text,
              pickFromRaw(raw, [
                "ai_summary",
                "summary_text",
                "summary",
                "report",
                "analysis",
                "output",
              ]),
            );

            const priorities = firstList(
              report.care_priorities,
              report.key_points,
              pickFromRaw(raw, [
                "care_priorities",
                "key_points",
                "priorities",
                "important_points",
              ]),
              report.warning_signs,
              pickFromRaw(raw, ["warning_signs", "warnings"]),
            );

            const actions = firstList(
              report.follow_up_actions,
              report.recommendations,
              pickFromRaw(raw, [
                "follow_up_actions",
                "recommendations",
                "recommended_actions",
                "actions",
                "next_steps",
              ]),
            );

            const inputContext = firstText(
              report.input_context,
              report.manual_note,
              pickFromRaw(raw, ["input_context", "manual_note", "note"]),
            );

            return (
              <article
                key={getReportId(report)}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">
                      {report.elderly_name || "Không rõ"}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(report.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${getRiskClass(
                        report.risk_level,
                      )}`}
                    >
                      {report.risk_level.toUpperCase()}
                    </span>

                    <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Tóm tắt AI
                  </p>

                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {aiSummary || "Chưa có kết quả AI."}
                  </p>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Ưu tiên chăm sóc
                    </p>

                    {priorities.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">
                        Chưa có dữ liệu.
                      </p>
                    ) : (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {priorities.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="rounded-2xl bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Việc cần làm tiếp theo
                    </p>

                    {actions.length === 0 ? (
                      <p className="mt-2 text-sm text-slate-500">
                        Chưa có dữ liệu.
                      </p>
                    ) : (
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                        {actions.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <details className="mt-4 rounded-2xl bg-white p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-900">
                    Xem nội dung caregiver đã nhập
                  </summary>

                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {inputContext || "Không có nội dung đầu vào."}
                  </p>
                </details>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}