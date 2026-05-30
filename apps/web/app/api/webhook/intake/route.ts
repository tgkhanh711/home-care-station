import { NextResponse } from "next/server";

import {
  normalizeIntakeEvent,
  type HcsAiOutput,
} from "@/lib/ai/intake-contract";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Body phải là JSON hợp lệ.",
      },
      {
        status: 400,
      },
    );
  }

  const parsed = normalizeIntakeEvent(body);

  if (!parsed.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: parsed.error,
      },
      {
        status: 400,
      },
    );
  }

  const message =
    typeof parsed.event.payload.message === "string"
      ? parsed.event.payload.message.trim()
      : "";

  const output: HcsAiOutput = {
    ok: true,
    intent: "dashboard_command",
    severity: "info",
    answer:
      message.length > 0
        ? "Đã nhận yêu cầu. Ở cụm sau, event này sẽ được nối vào AI Assistant/n8n để phân loại và xử lý thật."
        : "Đã nhận event dashboard.",
    actions: [
      {
        type: "queued_for_ai_workflow",
        label: "Chuẩn bị chuyển sang AI/n8n",
        payload: {
          event_id: parsed.event.event_id,
          event_type: parsed.event.event_type,
          source: parsed.event.source,
          role: parsed.event.role,
        },
      },
    ],
    created_records: [],
    requires_human_confirmation: false,
  };

  return NextResponse.json({
    ...output,
    normalized_event: parsed.event,
  });
}