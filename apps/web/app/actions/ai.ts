"use server";

export async function sendToAIAssistant(data: {
  elderly_profile_id: string;
  message: string;
}) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  
  if (!webhookUrl) {
    return { error: "Chưa cấu hình N8N_WEBHOOK_URL trong file .env.local" };
  }

  try {
    // Đóng gói Payload chuẩn theo yêu cầu của hệ thống Intake Router / AI
    const payload = {
      event_id: crypto.randomUUID(),
      event_type: "ai_chat_message",
      source: "doctor_web",
      elderly_profile_id: data.elderly_profile_id || null, // Có thể null nếu bác sĩ hỏi chung chung
      doctor_id: "current-doctor-id", // TODO: Sẽ gắn auth ID thật sau khi tích hợp Middleware Login
      caregiver_id: null,
      payload: {
        message: data.message,
      },
      created_at: new Date().toISOString(),
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Lỗi kết nối Webhook: ${response.statusText}`);
    }

    const result = await response.json();
    return { data: result };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("N8N AI Fetch Error:", error);
    return { error: errorMessage || "Không thể kết nối đến n8n AI Agent." };
  }
}