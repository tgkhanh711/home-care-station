"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type AiHealthRiskState = {
  ok: boolean;
  message: string;
  result?: unknown;
  payload?: unknown;
};

function toText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function runAiHealthRiskAction(
  _prevState: AiHealthRiskState,
  formData: FormData,
): Promise<AiHealthRiskState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      message: "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.",
    };
  }

  const elderlyProfileId = toText(formData.get("elderly_profile_id"));
  const healthNote = toText(formData.get("health_note"));

  if (!elderlyProfileId) {
    return {
      ok: false,
      message: "Thiếu hồ sơ người già.",
    };
  }

  if (!healthNote) {
    return {
      ok: false,
      message: "Bạn cần nhập nội dung tình trạng sức khỏe.",
    };
  }

  const webhookUrl = process.env.N8N_HCS_INTAKE_WEBHOOK_URL;
  const sharedSecret = process.env.N8N_HCS_SHARED_SECRET;

  if (!webhookUrl || !sharedSecret) {
    return {
      ok: false,
      message:
        "Thiếu N8N_HCS_INTAKE_WEBHOOK_URL hoặc N8N_HCS_SHARED_SECRET trong file .env.local.",
    };
  }

  const payload = {
    route: "ai_health_risk",
    event_type: "ai_health_risk_requested",
    source: "caregiver_web_localhost",
    role: "caregiver",
    requested_role: "caregiver",

    elderly_profile_id: elderlyProfileId,
    health_note: healthNote,
    content: healthNote,

    user: {
      id: user.id,
      email: user.email,
    },

    event_id: `evt_ai_health_risk_${Date.now()}`,
    created_at: new Date().toISOString(),

    shared_secret: sharedSecret,

    payload: {
      elderly_profile_id: elderlyProfileId,
      health_note: healthNote,
      requested_from: "caregiver_ai_health_risk_page",
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hcs-secret": sharedSecret,
        "x-hcs-shared-secret": sharedSecret,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const rawText = await response.text();

    let parsed: unknown = rawText;

    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = {
        raw_response: rawText,
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        message: `n8n trả về lỗi HTTP ${response.status}.`,
        result: parsed,
        payload,
      };
    }

    revalidatePath("/caregiver/ai-health-risk");

    return {
      ok: true,
      message: "Đã gửi đánh giá nguy cơ sức khỏe sang n8n thành công.",
      result: parsed,
      payload,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? `Không gọi được n8n: ${error.message}`
          : "Không gọi được n8n.",
      payload,
    };
  }
}