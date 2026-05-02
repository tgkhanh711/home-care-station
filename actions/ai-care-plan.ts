"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type AiCarePlanActionState = {
  ok: boolean;
  message: string;
  data?: Record<string, unknown> | null;
};

function formText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

async function readResponse(response: Response) {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {
      raw: text,
    };
  }
}

export async function requestAiCarePlanAction(
  _prevState: AiCarePlanActionState,
  formData: FormData,
): Promise<AiCarePlanActionState> {
  try {
    const message = formText(formData.get("message"));
    const goal = formText(formData.get("goal"));
    const elderlyProfileId = formText(formData.get("elderlyProfileId"));

    if (!message) {
      return {
        ok: false,
        message: "Bạn cần nhập nội dung để AI tạo kế hoạch chăm sóc.",
      };
    }

    const webhookUrl = process.env.N8N_HCS_INTAKE_WEBHOOK_URL;
    const sharedSecret = process.env.N8N_HCS_SHARED_SECRET;

    if (!webhookUrl || !sharedSecret) {
      return {
        ok: false,
        message:
          "Thiếu N8N_HCS_INTAKE_WEBHOOK_URL hoặc N8N_HCS_SHARED_SECRET trong web/.env.local.",
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        ok: false,
        message: "Bạn cần đăng nhập caregiver trước khi tạo kế hoạch chăm sóc.",
      };
    }

    const { data: caregiver, error: caregiverError } = await supabase
      .from("caregivers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (caregiverError || !caregiver) {
      return {
        ok: false,
        message:
          "Không tìm thấy caregiver tương ứng với tài khoản đang đăng nhập.",
      };
    }

    let profileQuery = supabase
      .from("elderly_profiles")
      .select("*")
      .eq("caregiver_id", caregiver.id);

    if (elderlyProfileId) {
      profileQuery = profileQuery.eq("id", elderlyProfileId);
    } else {
      profileQuery = profileQuery.order("created_at", { ascending: true }).limit(1);
    }

    const { data: profile, error: profileError } =
      await profileQuery.maybeSingle();

    if (profileError || !profile) {
      return {
        ok: false,
        message:
          "Không tìm thấy hồ sơ người cao tuổi thuộc caregiver hiện tại.",
      };
    }

    const profileId = String(profile.id);

    const [medicationLogsResult, vitalSignsResult, prescriptionsResult] =
      await Promise.all([
        supabase
          .from("medication_logs")
          .select("*")
          .eq("elderly_profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("vital_sign_logs")
          .select("*")
          .eq("elderly_profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("prescriptions")
          .select("*")
          .eq("elderly_profile_id", profileId)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

    const requestBody = {
      secret: sharedSecret,
      route: "ai_care_plan",
      event_type: "ai_care_plan_requested",
      source: "caregiver_web",
      role: "caregiver",
      created_at: new Date().toISOString(),
      elderly_profile_id: profileId,
      caregiver_id: caregiver.id,
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      message,
      goal,
      note: message,
      payload: {
        route: "ai_care_plan",
        event_type: "ai_care_plan_requested",
        source: "caregiver_web",
        role: "caregiver",
        elderly_profile_id: profileId,
        caregiver_id: caregiver.id,
        user: {
          id: user.id,
          email: user.email,
        },
        profile,
        message,
        goal,
        note: message,
        medicationLogs: medicationLogsResult.data ?? [],
        vitalSigns: vitalSignsResult.data ?? [],
        prescriptions: prescriptionsResult.data ?? [],
      },
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hcs-shared-secret": sharedSecret,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await readResponse(response);

    if (!response.ok) {
      return {
        ok: false,
        message: `n8n trả lỗi HTTP ${response.status}. Hãy mở execution mới nhất trong n8n để xem node bị đỏ.`,
        data: responseData,
      };
    }

    revalidatePath("/caregiver/care-plans");

    return {
      ok: true,
      message:
        "Đã gửi yêu cầu tạo kế hoạch chăm sóc sang n8n. Nếu workflow lưu thành công, lịch sử sẽ có bản ghi mới.",
      data: responseData,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Có lỗi không xác định khi gửi yêu cầu AI Care Plan.",
    };
  }
}