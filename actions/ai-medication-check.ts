"use server";

import { revalidatePath } from "next/cache";

import type { MedicationCheckActionState } from "@/lib/ai-medication-check";
import { toOptionalString } from "@/lib/ai-medication-check";
import { createClient } from "@/lib/supabase/server";

type JsonObject = Record<string, unknown>;

function toJsonObject(value: unknown): JsonObject | null {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return null;
}

function parseN8nResponse(text: string): JsonObject {
  if (!text.trim()) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(text);

    return toJsonObject(parsed) ?? {
      value: parsed,
    };
  } catch {
    return {
      raw: text,
    };
  }
}

function readN8nString(data: JsonObject, key: string): string | undefined {
  const nestedResult = toJsonObject(data.result);

  return (
    toOptionalString(nestedResult?.[key]) ??
    toOptionalString(data[key])
  );
}

export async function submitMedicationCheckAction(
  _prevState: MedicationCheckActionState,
  formData: FormData,
): Promise<MedicationCheckActionState> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      status: "error",
      message: "Bạn cần đăng nhập trước khi gửi kiểm tra thuốc AI.",
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

  const expectedMedicine = String(
    formData.get("expected_medicine") || "",
  ).trim();

  const observedMedicine = String(
    formData.get("observed_medicine") || "",
  ).trim();

  const imageNote = String(formData.get("image_note") || "").trim();

  if (!expectedMedicine || !observedMedicine) {
    return {
      status: "error",
      message: "Hãy nhập cả thuốc dự kiến và thuốc quan sát được.",
    };
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(appUser?.role || "caregiver");

  const content =
    imageNote ||
    `Thuốc dự kiến: ${expectedMedicine}. Thuốc quan sát được: ${observedMedicine}.`;

  const payload = {
    secret: sharedSecret,
    route: "ai_medication_check",
    event_type: "ai_medication_check_requested",
    source: "caregiver_web_localhost",

    event_id: `evt_medication_check_${Date.now()}`,

    role,
    requested_role: role,
    requested_by_user_id: user.id,
    elderly_profile_id: elderlyProfileId || null,

    expected_medicine: expectedMedicine,
    observed_medicine: observedMedicine,
    image_note: imageNote,
    content,

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
    const data = parseN8nResponse(text);

    if (!response.ok || data.ok === false) {
      return {
        status: "error",
        message: `n8n trả lỗi: ${response.status}. ${JSON.stringify(data)}`,
      };
    }

    revalidatePath("/caregiver/ai_medication_check");

    return {
      status: "success",
      message: "Đã gửi kiểm tra thuốc sang n8n và lưu kết quả vào Supabase.",
      result: {
        risk_level: readN8nString(data, "risk_level"),
        status: readN8nString(data, "status"),
        summary: readN8nString(data, "summary"),
        advice: readN8nString(data, "advice"),
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