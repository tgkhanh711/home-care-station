import { NextResponse } from "next/server";
import { normalizeIntakeEvent, type HcsAiOutput } from "@/lib/ai/intake-contract";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  // 1. Đọc dữ liệu đầu vào
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body phải là JSON hợp lệ." },
      { status: 400 }
    );
  }

  // 2. Chuẩn hóa Event qua Lễ tân (Intake Contract)
  const parsed = normalizeIntakeEvent(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: parsed.error },
      { status: 400 }
    );
  }

  const event = parsed.event;
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  const n8nSecret = process.env.N8N_SHARED_SECRET || "";

  if (!n8nWebhookUrl) {
    console.error("Lỗi hệ thống: Chưa cấu hình N8N_WEBHOOK_URL trong .env");
    return NextResponse.json(
      { ok: false, error: "Thiếu cấu hình kết nối AI/n8n." },
      { status: 500 }
    );
  }

  const supabase = await createSupabaseServerClient();

  // 2.5. Kiểm tra Idempotency (Chống trùng lặp sự kiện)
  try {
    const { data: existingLog } = await supabase
      .from("ai_analysis_logs")
      .select("raw_output")
      .eq("event_id", event.event_id)
      .maybeSingle();

    if (existingLog) {
      console.log(`[Idempotency] Bỏ qua event bị trùng: ${event.event_id}`);
      // Trả về kết quả cũ đã lưu trong Database thay vì gọi lại n8n
      return NextResponse.json({
        ...(existingLog.raw_output as object),
        normalized_event: event,
        _idempotent_cached: true, // Cờ báo hiệu đây là kết quả lấy từ cache
      });
    }
  } catch (err) {
    console.error("Lỗi khi check idempotency:", err);
    // Nếu có lỗi truy vấn DB lúc check, cứ cho phép chạy tiếp để ưu tiên tính sẵn sàng
  }

  // 3. Chuyển tiếp (Forward) Event sang n8n qua Webhook
  try {
    const n8nResponse = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${n8nSecret}`,
      },
      body: JSON.stringify(event),
    });

    if (!n8nResponse.ok) {
      throw new Error(`Mạng lưới n8n từ chối kết nối (Status: ${n8nResponse.status})`);
    }

    const n8nData = (await n8nResponse.json()) as HcsAiOutput;

    // 4. Bắt buộc: Ghi Log mọi quyết định của AI vào Database (ai_analysis_logs)
    await supabase.from("ai_analysis_logs").insert({
      event_id: event.event_id,
      elderly_profile_id: event.elderly_profile_id || null,
      intent: n8nData.intent || "unknown",
      severity: n8nData.severity || "info",
      raw_input: event,
      raw_output: n8nData,
    });

    // 5. Trả kết quả của n8n về cho Web/App
    return NextResponse.json({
      ...n8nData,
      normalized_event: event,
    });

  } catch (error) {
    console.error("Lỗi gọi n8n:", error);
    
    // Ghi Log thất bại khẩn cấp
    await supabase.from("ai_analysis_logs").insert({
      event_id: event.event_id,
      elderly_profile_id: event.elderly_profile_id || null,
      intent: "error_connection",
      severity: "critical",
      raw_input: event,
      raw_output: { error: error instanceof Error ? error.message : "Unknown error" },
    });

    return NextResponse.json(
      {
        ok: false,
        error: "Trạm AI đang bận hoặc quá tải. Vui lòng thử lại sau.",
      },
      { status: 502 }
    );
  }
}