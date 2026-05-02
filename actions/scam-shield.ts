"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type HcsScamEvent = {
  event_id: string;
  event_type: "scam_report_submitted";
  source: string;
  elderly_profile_id: string | null;
  caregiver_id: string | null;
  payload: {
    scam_report_id: string;
    source_type: string;
    content: string;
    note: string | null;
  };
  created_at: string;
};

type AnyRecord = Record<string, unknown>;

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function buildRedirect(status: "success" | "failed", message: string) {
  return `/caregiver/scam-shield?status=${status}&message=${encodeURIComponent(
    message,
  )}`;
}

function asRecord(value: unknown): AnyRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AnyRecord)
    : {};
}

function pickString(source: AnyRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

async function readResponsePayload(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      raw: text,
    };
  }
}

async function maybeSaveReturnedScamAnalysis(
  supabase: Awaited<ReturnType<typeof createClient>>,
  scamReportId: string,
  responsePayload: unknown,
) {
  const root = asRecord(responsePayload);
  const analysis = asRecord(root.analysis ?? root.result ?? root.data ?? root);

  const riskLevel = pickString(analysis, [
    "risk_level",
    "risk",
    "level",
    "scam_risk_level",
  ]);

  const summary = pickString(analysis, ["summary", "title", "conclusion"]);
  const reason = pickString(analysis, ["reason", "rationale", "explanation"]);
  const recommendedAction = pickString(analysis, [
    "recommended_action",
    "recommendation",
    "advice",
    "action",
  ]);

  if (!riskLevel && !summary && !reason && !recommendedAction) {
    return null;
  }

  const { error } = await supabase.rpc("hcs_save_scam_shield_analysis", {
    p_scam_report_id: scamReportId,
    p_risk_level: riskLevel || "medium",
    p_summary: summary || "Đã nhận kết quả phân tích từ n8n.",
    p_reason: reason || "n8n đã phản hồi nhưng không trả về lý do chi tiết.",
    p_recommended_action:
      recommendedAction ||
      "Không chuyển tiền, không cung cấp OTP/mật khẩu, hãy xác minh với người thân hoặc cơ sở y tế chính thức.",
    p_n8n_response: responsePayload,
  });

  return error;
}

async function submitScamReportFlow(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/login";
  }

  const elderlyProfileId = readText(formData, "elderly_profile_id") || null;
  const sourceType = readText(formData, "source_type") || "text";
  const content = readText(formData, "content");
  const note = readText(formData, "note");

  if (content.length < 10) {
    return buildRedirect(
      "failed",
      "Nội dung cần phân tích quá ngắn. Hãy nhập ít nhất 10 ký tự.",
    );
  }

  const webhookUrl = process.env.N8N_HCS_INTAKE_WEBHOOK_URL?.trim();
  const sharedSecret = process.env.N8N_HCS_SHARED_SECRET?.trim();

  if (!webhookUrl || !sharedSecret) {
    return buildRedirect(
      "failed",
      "Thiếu N8N_HCS_INTAKE_WEBHOOK_URL hoặc N8N_HCS_SHARED_SECRET trong .env.local.",
    );
  }

  const { data, error } = await supabase.rpc("hcs_create_scam_report_event", {
    p_elderly_profile_id: elderlyProfileId,
    p_source_type: sourceType,
    p_content: content,
    p_note: note || null,
  });

  if (error) {
    return buildRedirect("failed", `Lỗi tạo event: ${error.message}`);
  }

  const event = Array.isArray(data) ? data[0] : (data as HcsScamEvent | null);

  if (!event?.event_id || !event?.payload?.scam_report_id) {
    return buildRedirect(
      "failed",
      "RPC hcs_create_scam_report_event không trả về event_id hoặc scam_report_id.",
    );
  }

  const scamReportId = event.payload.scam_report_id;

  const { error: ensureReportError } = await supabase.rpc(
    "hcs_ensure_scam_report_shell",
    {
      p_scam_report_id: scamReportId,
      p_elderly_profile_id: elderlyProfileId,
      p_source_type: sourceType,
      p_content: content,
      p_note: note || null,
    },
  );

  if (ensureReportError) {
    return buildRedirect(
      "failed",
      `Lỗi tạo bản ghi Scam Shield: ${ensureReportError.message}`,
    );
  }

  const response = await fetch(webhookUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-HCS-Shared-Secret": sharedSecret,
  },
  body: JSON.stringify({
    ...event,
    secret: sharedSecret,
    shared_secret: sharedSecret,
  }),
});
  const responsePayload = await readResponsePayload(response);

  if (!response.ok) {
    await supabase.rpc("hcs_update_intake_event_dispatch_failure", {
      p_event_id: event.event_id,
      p_error_message: `n8n webhook trả về HTTP ${response.status}.`,
      p_n8n_response: responsePayload,
    });

    return buildRedirect(
      "failed",
      `n8n webhook trả về HTTP ${response.status}.`,
    );
  }

  const saveReturnedAnalysisError = await maybeSaveReturnedScamAnalysis(
    supabase,
    scamReportId,
    responsePayload,
  );

  if (saveReturnedAnalysisError) {
    return buildRedirect(
      "failed",
      `n8n đã phản hồi nhưng web không lưu được kết quả phân tích: ${saveReturnedAnalysisError.message}`,
    );
  }

  revalidatePath("/caregiver/scam-shield");
  revalidatePath("/station/scam-shield");
  revalidatePath("/admin/ai-intake");

  return buildRedirect(
    "success",
    "Đã lưu báo cáo và gửi nội dung sang Scam Shield n8n.",
  );
}

export async function submitScamReportAction(formData: FormData) {
  let redirectTo = buildRedirect("failed", "Không gửi được báo cáo lừa đảo.");

  try {
    redirectTo = await submitScamReportFlow(formData);
  } catch (error) {
    redirectTo = buildRedirect(
      "failed",
      error instanceof Error ? error.message : "Có lỗi không xác định.",
    );
  }

  redirect(redirectTo);
}