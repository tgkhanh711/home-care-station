"use server";

import { revalidatePath } from "next/cache";

import type { AiDailySummaryActionResult } from "@/lib/ai-daily-summary";
import { createClient } from "@/lib/supabase/server";

export async function createAiDailySummary(
  formData: FormData,
): Promise<AiDailySummaryActionResult> {
  const supabase = await createClient();

  const elderlyProfileId = String(
    formData.get("elderly_profile_id") || "",
  ).trim();

  const summaryType = String(formData.get("summary_type") || "daily").trim();
  const inputContext = String(formData.get("input_context") || "").trim();

  if (!elderlyProfileId) {
    return {
      ok: false,
      message: "Thiếu hồ sơ người cao tuổi.",
      error: "Thiếu elderly_profile_id.",
    };
  }

  if (inputContext.length < 5) {
    return {
      ok: false,
      message: "Nội dung tổng hợp quá ngắn.",
      error: "Hãy nhập tình hình trong ngày rõ hơn.",
    };
  }

  const webhookUrl = process.env.N8N_HCS_INTAKE_WEBHOOK_URL;
  const sharedSecret = process.env.N8N_HCS_SHARED_SECRET;

  if (!webhookUrl || !sharedSecret) {
    return {
      ok: false,
      message: "Thiếu biến môi trường n8n.",
      error:
        "Hãy kiểm tra N8N_HCS_INTAKE_WEBHOOK_URL và N8N_HCS_SHARED_SECRET trong .env.local.",
    };
  }

  const { data: requestData, error: requestError } = await supabase.rpc(
    "create_ai_daily_summary_request",
    {
      p_elderly_profile_id: elderlyProfileId,
      p_summary_type: summaryType,
      p_input_context: inputContext,
    },
  );

  if (requestError) {
    return {
      ok: false,
      message: "Không tạo được bản ghi AI Daily Summary.",
      error: requestError.message,
    };
  }

  const requestRow = Array.isArray(requestData) ? requestData[0] : null;

  if (!requestRow?.report_id) {
    return {
      ok: false,
      message: "Không nhận được report_id từ Supabase.",
      error: "RPC create_ai_daily_summary_request không trả về report_id.",
    };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "ai_daily_summary",
        event_type: "ai_daily_summary",
        shared_secret: sharedSecret,
        report_id: requestRow.report_id,
        elderly_profile_id: requestRow.elderly_profile_id,
        elderly_name: requestRow.elderly_name,
        summary_type: requestRow.summary_type,
        input_context: requestRow.input_context,
        requested_by_user_id: requestRow.requested_by_user_id,
        source: "home-care-station-web",
        created_at: new Date().toISOString(),
      }),
    });

    let responseJson: unknown = null;

    try {
      responseJson = await response.json();
    } catch {
      responseJson = null;
    }

    if (!response.ok) {
      return {
        ok: false,
        message: "n8n đã nhận lỗi khi xử lý AI Daily Summary.",
        error:
          typeof responseJson === "object" && responseJson !== null
            ? JSON.stringify(responseJson)
            : `HTTP ${response.status}`,
      };
    }

    revalidatePath("/caregiver/ai_daily_summary");
    revalidatePath("/doctor/ai_daily_summary");
    revalidatePath("/station/ai_daily_summary");

    return {
      ok: true,
      message:
        "Đã gửi AI Daily Summary sang n8n và lưu kết quả vào Supabase.",
    };
  } catch (error) {
    return {
      ok: false,
      message: "Không gọi được webhook n8n.",
      error: error instanceof Error ? error.message : "Lỗi không xác định.",
    };
  }
}