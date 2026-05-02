"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AiChatRole = "caregiver" | "doctor" | "station" | "admin";

type ChatOption = {
  elderly_profile_id: string;
  elderly_label: string;
};

type ChatLog = {
  chat_log_id: string;
  elderly_label: string;
  role: string;
  message: string;
  answer: string | null;
  risk_level: string | null;
  source: string;
  created_at: string;
  answered_at: string | null;
};

function getText(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function safeRole(value: string): AiChatRole {
  if (value === "doctor") return "doctor";
  if (value === "station") return "station";
  if (value === "admin") return "admin";
  return "caregiver";
}

function getRolePath(role: AiChatRole) {
  if (role === "doctor") return "/doctor/ai-chat";
  if (role === "station") return "/station/ai-chat";
  if (role === "admin") return "/admin/ai-chat";
  return "/caregiver/ai-chat";
}

function buildLocalAnswer(message: string) {
  const lower = message.toLowerCase();

  const highRisk =
    lower.includes("khó thở") ||
    lower.includes("ngất") ||
    lower.includes("đau ngực") ||
    lower.includes("cấp cứu") ||
    lower.includes("huyết áp cao");

  const mediumRisk =
    lower.includes("chóng mặt") ||
    lower.includes("quên uống thuốc") ||
    lower.includes("mệt") ||
    lower.includes("đau đầu");

  if (highRisk) {
    return {
      riskLevel: "high",
      answer:
        "Mức rủi ro có thể cao. Cần kiểm tra lại chỉ số sức khỏe ngay, đặc biệt là huyết áp, nhịp tim và tình trạng khó thở/đau ngực/ngất nếu có. Nếu triệu chứng nặng hoặc kéo dài, hãy liên hệ bác sĩ hoặc cơ sở y tế. Không tự ý uống bù thuốc nếu chưa có hướng dẫn.",
    };
  }

  if (mediumRisk) {
    return {
      riskLevel: "medium",
      answer:
        "Mức rủi ro trung bình. Cần kiểm tra lại lịch uống thuốc, ghi nhận triệu chứng hiện tại và theo dõi thêm chỉ số sức khỏe. Nếu chóng mặt, mệt nhiều, huyết áp bất thường hoặc quên thuốc lặp lại nhiều lần, caregiver nên báo bác sĩ phụ trách.",
    };
  }

  return {
    riskLevel: "low",
    answer:
      "Mức rủi ro hiện tại có vẻ thấp. Nên tiếp tục theo dõi tình trạng người cao tuổi, duy trì lịch uống thuốc và ghi lại các dấu hiệu bất thường nếu có.",
  };
}

export async function getAiChatPageData(role: AiChatRole) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [optionsResult, logsResult] = await Promise.all([
    supabase.rpc("hcs_ai_get_chat_elderly_options"),
    supabase.rpc("hcs_ai_get_my_chat_logs"),
  ]);

  return {
    role,
    options: ((optionsResult.data ?? []) as ChatOption[]).slice(0, 50),
    logs: ((logsResult.data ?? []) as ChatLog[]).slice(0, 10),
    optionsError: optionsResult.error?.message ?? null,
    logsError: logsResult.error?.message ?? null,
  };
}

export async function sendAiChatMessageAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = safeRole(getText(formData.get("role")));
  const basePath = getRolePath(role);

  const elderlyProfileId = getText(formData.get("elderly_profile_id"));
  const message = getText(formData.get("message"));

  if (!message) {
    redirect(`${basePath}?status=error&message=Vui lòng nhập nội dung cần hỏi AI.`);
  }

  const { data: shell, error: shellError } = await supabase.rpc(
    "hcs_ai_create_chat_shell",
    {
      p_elderly_profile_id: elderlyProfileId || null,
      p_message: message,
      p_role: role,
    },
  );

  if (shellError) {
    redirect(`${basePath}?status=error&message=${encodeURIComponent(shellError.message)}`);
  }

  const chatLogId =
    typeof shell === "object" && shell && "chat_log_id" in shell
      ? String(shell.chat_log_id)
      : "";

  if (!chatLogId) {
    redirect(`${basePath}?status=error&message=Không tạo được bản ghi AI Chat.`);
  }

  const webhookUrl = process.env.N8N_HCS_INTAKE_WEBHOOK_URL?.trim();
  const sharedSecret = process.env.N8N_HCS_SHARED_SECRET?.trim();

  let usedN8n = false;

  if (webhookUrl && sharedSecret) {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hcs-shared-secret": sharedSecret,
        },
        body: JSON.stringify({
          secret: sharedSecret,
          route: "ai_chat",
          event_type: "ai_chat_message_sent",
          source: `${role}_web`,
          role,
          ai_chat_log_id: chatLogId,
          elderly_profile_id: elderlyProfileId || null,
          message,
          user: {
            id: user.id,
            email: user.email,
          },
          payload: {
            route: "ai_chat",
            event_type: "ai_chat_message_sent",
            ai_chat_log_id: chatLogId,
            elderly_profile_id: elderlyProfileId || null,
            message,
            role,
          },
          created_at: new Date().toISOString(),
        }),
      });

      usedN8n = response.ok;
    } catch {
      usedN8n = false;
    }
  }

  if (!usedN8n) {
    const local = buildLocalAnswer(message);

    await supabase.rpc("hcs_n8n_save_ai_chat_response", {
      p_chat_log_id: chatLogId,
      p_answer: local.answer,
      p_risk_level: local.riskLevel,
      p_n8n_response: {
        source: "local_fallback",
        reason: "n8n webhook was not configured or did not respond successfully",
      },
    });
  }

  revalidatePath(basePath);

  const messageText = usedN8n
    ? "Đã gửi câu hỏi sang n8n AI Chat."
    : "Đã tạo câu trả lời local vì n8n chưa phản hồi.";

  redirect(`${basePath}?status=success&message=${encodeURIComponent(messageText)}`);
}