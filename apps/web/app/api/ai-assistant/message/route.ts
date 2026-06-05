import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const RoleEnum = z.enum(["doctor", "caregiver", "station", "admin"] as const);

const aiMessageSchema = z.object({
  message: z.string().min(1, "Tin nhắn không được để trống").max(1000, "Tin nhắn quá dài"),
  role: RoleEnum,
  patientId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = aiMessageSchema.parse(body);

    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const eventId = crypto.randomUUID();

    await supabase.from("ai_messages").insert({
      user_id: user?.id || null,
      role: validatedData.role,
      patient_id: validatedData.patientId || null,
      message: validatedData.message,
      is_from_ai: false
    });

    const n8nPayload = {
      event_id: eventId,
      event_type: "ai_assistant_message",
      source: "web_client",
      role: validatedData.role,
      user_id: user?.id || "anonymous",
      elderly_profile_id: validatedData.patientId || null,
      payload: { message: validatedData.message },
      created_at: new Date().toISOString()
    };

    await supabase.from("ai_analysis_logs").insert({
      event_id: eventId,
      event_type: n8nPayload.event_type,
      source: n8nPayload.source,
      role: n8nPayload.role,
      user_id: n8nPayload.user_id,
      payload: n8nPayload.payload,
      status: "processing"
    });

    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";
    const N8N_SHARED_SECRET = process.env.N8N_SHARED_SECRET || "";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${N8N_SHARED_SECRET}`
        },
        body: JSON.stringify(n8nPayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const responseText = await n8nResponse.text();

      if (!n8nResponse.ok) {
        throw new Error(`n8n trả về mã lỗi: ${n8nResponse.status} - ${responseText}`);
      }

      let n8nData;
      try {
        n8nData = JSON.parse(responseText);
      } catch {
        throw new Error("n8n server trả về dữ liệu lạ, không phải JSON");
      }

      const aiReplyMessage = n8nData?.answer || n8nData?.reply || "Tôi đã nhận thông tin nhưng không có câu trả lời.";

      await supabase.from("ai_analysis_logs").update({ status: "success", result: n8nData }).eq("event_id", eventId);

      await supabase.from("ai_messages").insert({
        user_id: user?.id || null,
        role: validatedData.role,
        patient_id: validatedData.patientId || null,
        message: aiReplyMessage,
        is_from_ai: true
      });

      return NextResponse.json({ success: true, reply: aiReplyMessage });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("[N8N_FETCH_ERROR]", fetchError);
      await supabase.from("ai_analysis_logs").update({ status: "failed", result: { error: String(fetchError) } }).eq("event_id", eventId);
      
      return NextResponse.json({ success: false, error: "Hệ thống AI đang bảo trì hoặc mạng lỗi. Vui lòng thử lại sau." });
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: "Dữ liệu không hợp lệ", details: error.issues }, { status: 400 });
    }
    console.error("[AI_API_ERROR]", error);
    return NextResponse.json({ success: false, error: "Lỗi máy chủ nội bộ" }, { status: 500 });
  }
}