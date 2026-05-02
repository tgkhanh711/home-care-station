"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type AiRole = "caregiver";

type DbRow = Record<string, unknown>;
type DbValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | number[]
  | DbRow
  | DbRow[];

type DbError = {
  message: string;
};

type DbResponse<T> = {
  data: T | null;
  error: DbError | null;
};

type DbQuery<T = DbRow[]> = PromiseLike<DbResponse<T>> & {
  select: (columns?: string) => DbQuery<T>;
  insert: (values: DbRow | DbRow[]) => DbQuery<T>;
  eq: (column: string, value: DbValue) => DbQuery<T>;
  order: (column: string, options?: { ascending?: boolean }) => DbQuery<T>;
  limit: (count: number) => DbQuery<T>;
  maybeSingle: () => Promise<DbResponse<DbRow>>;
};

type LooseSupabaseClient = {
  from: (table: string) => DbQuery;
  rpc: <T = unknown>(
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<DbResponse<T>>;
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string; email?: string | null } | null };
      error: unknown;
    }>;
  };
};

type AiReport = {
  title: string;
  summary: string;
  recommendations: string;
  riskLevel: "low" | "medium" | "high";
  source: "local" | "n8n";
  rawPayload: Record<string, unknown>;
};

function getRoute() {
  return "/caregiver/ai";
}

function toText(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function normalizeRiskLevel(value: unknown): "low" | "medium" | "high" {
  const risk = toText(value).toLowerCase();

  if (
    [
      "critical",
      "danger",
      "dangerous",
      "severe",
      "high",
      "cao",
      "nguy hiểm",
      "nguy hiem",
    ].includes(risk)
  ) {
    return "high";
  }

  if (["low", "safe", "normal", "ok", "thấp", "thap"].includes(risk)) {
    return "low";
  }

  return "medium";
}

function normalizeRecommendations(value: unknown) {
  if (Array.isArray(value)) {
    const list = value
      .map((item) => toText(item))
      .filter(Boolean)
      .map((item) => `- ${item}`);

    if (list.length > 0) {
      return list.join("\n");
    }
  }

  const text = toText(value);

  if (text.length > 0) {
    return text;
  }

  return [
    "- Theo dõi lịch uống thuốc hằng ngày.",
    "- Kiểm tra chỉ số sức khỏe định kỳ.",
    "- Báo cho caregiver hoặc bác sĩ nếu có dấu hiệu bất thường.",
  ].join("\n");
}

function detectManualRiskLevel(text: string): "low" | "medium" | "high" | null {
  const lower = text.toLowerCase();

  const highKeywords = [
    "cấp cứu",
    "khó thở",
    "đau ngực",
    "ngất",
    "co giật",
    "té ngã",
    "đột quỵ",
    "tai biến",
    "không tỉnh",
  ];

  const mediumKeywords = [
    "quên thuốc",
    "bỏ thuốc",
    "sốt",
    "chóng mặt",
    "mệt",
    "đau đầu",
    "huyết áp",
    "tim đập nhanh",
  ];

  if (highKeywords.some((keyword) => lower.includes(keyword))) {
    return "high";
  }

  if (mediumKeywords.some((keyword) => lower.includes(keyword))) {
    return "medium";
  }

  return null;
}

function buildLocalReport(payload: {
  profile: Record<string, unknown>;
  medicationLogs: Record<string, unknown>[];
  vitalLogs: Record<string, unknown>[];
  alerts: Record<string, unknown>[];
  manualTestContent: string;
}): AiReport {
  const fullName =
    toText(payload.profile.full_name) ||
    toText(payload.profile.name) ||
    toText(payload.profile.elderly_name) ||
    "người cao tuổi";

  const missedMedicineCount = payload.medicationLogs.filter((log) => {
    const status = toText(log.status).toLowerCase();
    return status.includes("miss") || status.includes("quên");
  }).length;

  const skippedMedicineCount = payload.medicationLogs.filter((log) => {
    const status = toText(log.status).toLowerCase();
    return status.includes("skip") || status.includes("bỏ");
  }).length;

  const alertCount = payload.alerts.length;
  const vitalCount = payload.vitalLogs.length;

  let riskLevel: AiReport["riskLevel"] = "low";

  if (alertCount >= 3 || missedMedicineCount >= 3) {
    riskLevel = "high";
  } else if (
    alertCount > 0 ||
    missedMedicineCount > 0 ||
    skippedMedicineCount > 0
  ) {
    riskLevel = "medium";
  }

  const manualRiskLevel = detectManualRiskLevel(payload.manualTestContent);

  if (manualRiskLevel === "high") {
    riskLevel = "high";
  } else if (manualRiskLevel === "medium" && riskLevel === "low") {
    riskLevel = "medium";
  }

  const summaryLines = [
    `AI đã phân tích hồ sơ của ${fullName}.`,
    `Số bản ghi uống thuốc gần đây: ${payload.medicationLogs.length}.`,
    `Số bản ghi chỉ số sức khỏe gần đây: ${vitalCount}.`,
    `Số cảnh báo gần đây: ${alertCount}.`,
    `Số lần quên thuốc phát hiện được: ${missedMedicineCount}.`,
    `Số lần bỏ qua thuốc phát hiện được: ${skippedMedicineCount}.`,
  ];

  if (payload.manualTestContent) {
    summaryLines.push(`Nội dung caregiver nhập để test: ${payload.manualTestContent}`);
  }

  const recommendations = [
    "- Duy trì theo dõi lịch uống thuốc trên Station.",
    "- Nếu có nhiều lần quên thuốc, caregiver nên kiểm tra lại lịch nhắc thuốc.",
    "- Nếu chỉ số sức khỏe bất thường hoặc có SOS, cần liên hệ bác sĩ/caregiver ngay.",
    "- Bác sĩ nên xem lại lịch sử thuốc nếu tình trạng bỏ/quên thuốc lặp lại.",
  ].join("\n");

  return {
    title: `Báo cáo chăm sóc AI - ${fullName}`,
    summary: summaryLines.join("\n"),
    recommendations,
    riskLevel,
    source: "local",
    rawPayload: {
      generated_by: "local_rule_based_ai",
      missedMedicineCount,
      skippedMedicineCount,
      alertCount,
      vitalCount,
      manualTestContent: payload.manualTestContent,
    },
  };
}

function unwrapN8nResult(json: Record<string, unknown>) {
  const responseBody = asRecord(json.responseBody);
  const result = asRecord(json.result);
  const report = asRecord(json.report);
  const data = asRecord(json.data);

  return responseBody ?? result ?? report ?? data ?? json;
}

async function callN8n(payload: Record<string, unknown>): Promise<AiReport | null> {
  const webhookUrl =
    process.env.N8N_HCS_INTAKE_WEBHOOK_URL ||
    process.env.N8N_AI_CARE_WEBHOOK_URL ||
    process.env.N8N_WEBHOOK_URL ||
    process.env.NEXT_PUBLIC_N8N_AI_CARE_WEBHOOK_URL;

  if (!webhookUrl) {
    return null;
  }

  const sharedSecret =
    process.env.N8N_HCS_SHARED_SECRET || process.env.N8N_SHARED_SECRET || "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sharedSecret ? { "X-HCS-Shared-Secret": sharedSecret } : {}),
      },
      body: JSON.stringify({
        ...payload,
        shared_secret: sharedSecret || undefined,
        hcs_shared_secret: sharedSecret || undefined,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const json = (await response.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!json) {
      return null;
    }

    const result = unwrapN8nResult(json);

    return {
      title:
        toText(result.title) ||
        toText(result.report_title) ||
        "Báo cáo AI từ n8n",
      summary:
        toText(result.summary) ||
        toText(result.report) ||
        toText(result.output) ||
        toText(result.analysis) ||
        "n8n đã phân tích dữ liệu chăm sóc.",
      recommendations: normalizeRecommendations(
        result.recommendations ??
          result.recommendation ??
          result.recommended_actions ??
          result.actions ??
          result.advice,
      ),
      riskLevel: normalizeRiskLevel(
        result.risk_level ?? result.riskLevel ?? result.risk,
      ),
      source: "n8n",
      rawPayload: json,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createAiCareReportAction(formData: FormData) {
  await requireRole(["caregiver"]);

  const role: AiRole = "caregiver";
  const route = getRoute();

  const elderlyProfileId = toText(formData.get("elderlyProfileId"));
  const manualTestContent = toText(formData.get("manualTestContent"));

  if (!elderlyProfileId) {
    redirect(
      `${route}?error=${encodeURIComponent("Bạn chưa chọn hồ sơ người cao tuổi.")}`,
    );
  }

  const supabase = await createClient();
  const db = supabase as unknown as LooseSupabaseClient;

  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await db
    .from("elderly_profiles")
    .select("*")
    .eq("id", elderlyProfileId)
    .maybeSingle();

  if (profileError || !profile) {
    redirect(
      `${route}?error=${encodeURIComponent(
        profileError?.message || "Không tìm thấy hồ sơ người cao tuổi.",
      )}`,
    );
  }

  const { data: medicationLogs } = await db
    .from("medication_logs")
    .select("*")
    .eq("elderly_profile_id", elderlyProfileId)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: vitalLogs } = await db
    .from("vital_sign_logs")
    .select("*")
    .eq("elderly_profile_id", elderlyProfileId)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: alerts } = await db
    .from("alerts")
    .select("*")
    .eq("elderly_profile_id", elderlyProfileId)
    .order("created_at", { ascending: false })
    .limit(20);

  const payload = {
    route: "ai_care",
    event_type: "ai_care_report_requested",
    source: "caregiver_web",
    role,
    manualTestContent,
    test_content: manualTestContent,
    note: manualTestContent,
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    medicationLogs: medicationLogs ?? [],
    vitalLogs: vitalLogs ?? [],
    alerts: alerts ?? [],
  };

  const localReport = buildLocalReport({
    profile,
    medicationLogs: medicationLogs ?? [],
    vitalLogs: vitalLogs ?? [],
    alerts: alerts ?? [],
    manualTestContent,
  });

  const n8nReport = await callN8n(payload);
  const finalReport = n8nReport ?? localReport;

  const { data: createdReportId, error } = await db.rpc<string>(
    "create_ai_care_report_safe",
    {
      p_elderly_profile_id: elderlyProfileId,
      p_actor_role: role,
      p_title: finalReport.title,
      p_summary: finalReport.summary,
      p_recommendations: finalReport.recommendations,
      p_risk_level: finalReport.riskLevel,
      p_source: finalReport.source,
      p_raw_payload: finalReport.rawPayload,
    },
  );

  if (error) {
    redirect(`${route}?error=${encodeURIComponent(error.message)}`);
  }

  if (!createdReportId) {
    redirect(
      `${route}?error=${encodeURIComponent(
        "RPC tạo báo cáo chưa lưu dữ liệu. Hãy kiểm tra lại create_ai_care_report_safe.",
      )}`,
    );
  }

  revalidatePath("/caregiver/ai");
  revalidatePath("/doctor/ai");
  revalidatePath("/station/ai");
  revalidatePath("/admin/ai");

  redirect(
    `${route}?message=${encodeURIComponent(
      "Đã tạo và lưu báo cáo AI. Nội dung test đã được gửi sang n8n nếu webhook được cấu hình.",
    )}`,
  );
}