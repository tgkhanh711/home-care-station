import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const RoleEnum = z.enum(["doctor", "caregiver", "station", "admin"] as const);

const aiMessageSchema = z.object({
  message: z.string().min(1, "Tin nhắn không được để trống").max(1000, "Tin nhắn quá dài"),
  role: RoleEnum,
  elderlyProfileId: z.string().nullable().optional(),
  eventType: z.string().default("ai_assistant_message"),
});

export async function POST(req: Request) {
  const eventId = crypto.randomUUID();
  const supabase = await createSupabaseServerClient();
  
  try {
    const body = await req.json();
    const validatedData = aiMessageSchema.parse(body);

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    // 1. Lưu tin nhắn của User vào database nội bộ
    await supabase.from("ai_messages").insert({
      user_id: userId,
      role: validatedData.role,
      elderly_profile_id: validatedData.elderlyProfileId || null,
      message: validatedData.message,
      is_from_ai: false
    });

    // 2. Chuẩn bị Payload gửi n8n
    const n8nPayload = {
      event_id: eventId,
      event_type: validatedData.eventType,
      source: "web_client",
      role: validatedData.role,
      user_id: userId, 
      elderly_profile_id: validatedData.elderlyProfileId || null,
      query: validatedData.message,
      timestamp: new Date().toISOString()
    };

    // 3. Khởi tạo Log trạng thái pending
    await supabase.from("ai_analysis_logs").insert({
      event_id: eventId,
      event_type: validatedData.eventType,
      status: "pending",
      payload: n8nPayload
    });

    // 4. Gọi n8n xử lý logic lõi của hệ thống
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) throw new Error("Thiếu cấu hình N8N_WEBHOOK_URL");

    const n8nSecret = process.env.N8N_SHARED_SECRET || "hcs_super_secret_key_2026";

    const n8nResponse = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${n8nSecret}` 
      },
      body: JSON.stringify(n8nPayload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!n8nResponse.ok) {
      throw new Error(`n8n trả về lỗi HTTP: ${n8nResponse.status}`);
    }

    const responseText = await n8nResponse.text();
    // 1. Thêm dòng này để in thẳng câu trả lời thực tế của n8n ra Terminal
    console.log("=== RAW N8N RESPONSE ===", responseText);
    let n8nData;
    try {
      n8nData = JSON.parse(responseText);
    } catch {
      throw new Error(`Dữ liệu n8n trả về không phải JSON. Nội dung thực tế n8n nói là: ${responseText}`);
    }

    // 🔴 CHẶN LỖI HIỂN THỊ CÂU TRẢ LỜI VÔ NGHĨA
    if (n8nData.ok === false || (!n8nData.answer && !n8nData.reply)) {
      throw new Error(n8nData.error || "AI không thể trích xuất câu trả lời hợp lệ.");
    }

    const aiReplyMessage = n8nData.answer || n8nData.reply;

    // 5. Cập nhật Log thành công & Lưu phản hồi từ AI Assistant
    await Promise.all([
      supabase.from("ai_analysis_logs").update({ status: "success", result: n8nData }).eq("event_id", eventId),
      supabase.from("ai_messages").insert({
        user_id: userId,
        role: "station", 
        elderly_profile_id: validatedData.elderlyProfileId || null,
        message: aiReplyMessage,
        is_from_ai: true
      })
    ]);

    return NextResponse.json({ success: true, reply: aiReplyMessage, data: n8nData });

  } catch (error: unknown) {
    console.error("[N8N_FETCH_ERROR]", error);
    
    let errorMessage = "Hệ thống AI đang bận hoặc gặp lỗi định dạng JSON. Đang thử lại...";
    if (error instanceof z.ZodError) {
      errorMessage = "Dữ liệu gửi lên không hợp lệ.";
    } else if (typeof error === 'object' && error !== null && 'name' in error && (error as { name?: string }).name === 'AbortError') {
      errorMessage = "AI xử lý quá lâu (Timeout). Vui lòng thử lại sau.";
    } else if (error instanceof Error) {
      errorMessage = "Lỗi xử lý AI: " + error.message;
    }

    // Cập nhật trạng thái log thất bại lên database bảo toàn lịch sử hệ thống
    await supabase.from("ai_analysis_logs").update({ 
      status: "failed", 
      result: { error: String((error as { message?: string }).message || error) } 
    }).eq("event_id", eventId);
    
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}