"use server";

import { revalidatePath } from "next/cache";

import {
  normalizeAlertSeverity,
  toRequiredString,
  toStringArray,
  type AlertEscalationActionState,
} from "@/lib/ai-alert-escalation";
import { createClient } from "@/lib/supabase/server";

function parseJsonResponse(text: string): Record<string, unknown> {
  if (!text.trim()) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(text);

    if (
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, unknown>;
    }

    return {
      value: parsed,
    };
  } catch {
    return {
      raw: text,
    };
  }
}

function getResultObject(data: Record<string, unknown>): Record<string, unknown> {
  const result = data.result;

  if (
    result !== null &&
    typeof result === "object" &&
    !Array.isArray(result)
  ) {
    return result as Record<string, unknown>;
  }

  return data;
}

export async function submitAlertEscalationAction(
  _prevState: AlertEscalationActionState,
  formData: FormData,
): Promise<AlertEscalationActionState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "Bạn cần đăng nhập trước khi gửi cảnh báo AI.",
    };
  }

  const webhookUrl = process.env.N8N_HCS_INTAKE_WEBHOOK_URL;
  const sharedSecret = process.env.N8N_HCS_SHARED_SECRET;

  if (!webhookUrl || !sharedSecret) {
    return {
      status: "error",
      message:
        "Thiếu N8N_HCS_INTAKE_WEBHOOK_URL hoặc N8N_HCS_SHARED_SECRET trong .env.local.",
    };
  }

  const elderlyProfileId = String(
    formData.get("elderly_profile_id") || "",
  ).trim();

  const manualElderlyName = String(
    formData.get("manual_elderly_name") || "",
  ).trim();

  const alertSource = String(
    formData.get("alert_source") || "caregiver_manual",
  ).trim();

  const suggestedUrgency = String(
    formData.get("suggested_urgency") || "urgent",
  ).trim();

  const sourceText = String(formData.get("source_text") || "").trim();

  if (!sourceText) {
    return {
      status: "error",
      message: "Hãy nhập mô tả tình huống trước khi gửi AI.",
    };
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(appUser?.role || "caregiver");
  const eventId = `evt_alert_escalation_${user.id}_${Date.now()}`;

  const payload = {
    secret: sharedSecret,
    route: "ai_alert_escalation",
    event_type: "ai_alert_escalation_requested",
    source: "caregiver_web_localhost",

    event_id: eventId,
    requested_by_user_id: user.id,
    requested_role: role,
    role,

    elderly_profile_id: elderlyProfileId || null,
    elderly_name: manualElderlyName || null,

    alert_source: alertSource,
    suggested_urgency: suggestedUrgency,
    source_text: sourceText,
    content: sourceText,

    created_at: new Date().toISOString(),
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await response.text();
    const data = parseJsonResponse(text);

    if (!response.ok || data.ok === false) {
      return {
        status: "error",
        message: `n8n trả lỗi: ${response.status}. ${JSON.stringify(data)}`,
      };
    }

    const result = getResultObject(data);

    const severity = normalizeAlertSeverity(
      result.severity ?? result.risk_level ?? suggestedUrgency,
    );

    const summary = toRequiredString(
      result.summary,
      "AI phát hiện dấu hiệu có thể nguy hiểm, cần caregiver hoặc bác sĩ xem ngay.",
    );

    const advice = toRequiredString(
      result.advice,
      "Liên hệ caregiver/bác sĩ phụ trách ngay. Nếu triệu chứng nặng lên, hãy liên hệ cấp cứu địa phương.",
    );

    const title = toRequiredString(
      result.title,
      "Cảnh báo khẩn cấp AI",
    );

    const warningSigns = toStringArray(result.warning_signs);

    const { error: saveError } = await supabase.rpc(
      "hcs_n8n_save_alert_escalation_report",
      {
        p_event_id: eventId,
        p_elderly_profile_id: elderlyProfileId || null,
        p_requested_by_user_id: user.id,
        p_requested_role: role,
        p_title: title,
        p_severity: severity,
        p_alert_source: alertSource,
        p_suggested_urgency: suggestedUrgency,
        p_source_text: sourceText,
        p_summary: summary,
        p_advice: advice,
        p_warning_signs: warningSigns,
        p_n8n_raw: data,
      },
    );

    if (saveError) {
      return {
        status: "error",
        message: `AI đã trả kết quả nhưng lưu lịch sử Supabase lỗi: ${saveError.message}`,
      };
    }

    revalidatePath("/caregiver/ai_alert_escalation");

    return {
      status: "success",
      message: "Đã gửi cảnh báo AI sang n8n và lưu kết quả vào Supabase.",
      result: {
        severity,
        summary,
        advice,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Không gọi được n8n webhook.",
    };
  }
}