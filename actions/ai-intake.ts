"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getSourceFromRole,
  isHcsAiEventType,
  type HcsAiIntakePayload,
} from "@/lib/ai/intake-types";
import { createClient } from "@/lib/supabase/server";

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parsePayload(payloadText: string, note: string) {
  const basePayload: Record<string, unknown> = {};

  if (note) {
    basePayload.note = note;
  }

  if (!payloadText) {
    return basePayload;
  }

  try {
    const parsed = JSON.parse(payloadText);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return {
        ...basePayload,
        ...parsed,
      };
    }

    return {
      ...basePayload,
      value: parsed,
    };
  } catch {
    return {
      ...basePayload,
      raw_text: payloadText,
    };
  }
}

async function safeReadJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {
      raw_response: text,
    };
  }
}

export async function createHcsAiIntakeEventAction(formData: FormData) {
  let nextUrl = "/admin/ai-intake?status=failed";

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const eventType = readString(formData, "event_type");
  const elderlyProfileIdRaw = readString(formData, "elderly_profile_id");
  const payloadText = readString(formData, "payload");
  const note = readString(formData, "note");

  const elderlyProfileId = elderlyProfileIdRaw || null;

  if (!isHcsAiEventType(eventType)) {
    nextUrl = `/admin/ai-intake?status=failed&message=${encodeURIComponent(
      "event_type không hợp lệ.",
    )}`;
    redirect(nextUrl);
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = typeof userRow?.role === "string" ? userRow.role : "";
  const source = getSourceFromRole(role);

  const payload = parsePayload(payloadText, note);

  const { data: createdEvent, error: createError } = await supabase.rpc(
    "create_ai_intake_event",
    {
      p_event_type: eventType,
      p_source: source,
      p_elderly_profile_id: elderlyProfileId,
      p_payload: payload,
    },
  );

  if (createError || !createdEvent) {
    nextUrl = `/admin/ai-intake?status=failed&message=${encodeURIComponent(
      createError?.message || "Không tạo được AI intake event.",
    )}`;
    redirect(nextUrl);
  }

  const event = Array.isArray(createdEvent) ? createdEvent[0] : createdEvent;

  const webhookUrl = process.env.N8N_HCS_INTAKE_WEBHOOK_URL;
  const sharedSecret = process.env.N8N_HCS_SHARED_SECRET;

  if (!webhookUrl || !sharedSecret) {
    await supabase
      .from("ai_intake_events")
      .update({
        status: "failed",
        n8n_status: "missing_env",
        error_message:
          "Thiếu N8N_HCS_INTAKE_WEBHOOK_URL hoặc N8N_HCS_SHARED_SECRET trong .env.local.",
      })
      .eq("id", event.id);

    revalidatePath("/admin/ai-intake");

    nextUrl = `/admin/ai-intake?status=failed&message=${encodeURIComponent(
      "Thiếu biến môi trường n8n trong .env.local.",
    )}`;
    redirect(nextUrl);
  }

  const outgoingPayload: HcsAiIntakePayload = {
    event_id: event.event_id,
    event_type: event.event_type,
    source: event.source,
    actor_user_id: event.actor_user_id,
    elderly_profile_id: event.elderly_profile_id,
    payload: event.payload ?? {},
    created_at: event.created_at,
  };

  await supabase
    .from("ai_intake_events")
    .update({
      status: "dispatched",
      n8n_status: "sending",
      dispatched_at: new Date().toISOString(),
    })
    .eq("id", event.id);

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-HCS-Secret": sharedSecret,
      },
      body: JSON.stringify(outgoingPayload),
      cache: "no-store",
    });

    const responseBody = await safeReadJson(response);

    if (!response.ok) {
      await supabase
        .from("ai_intake_events")
        .update({
          status: "failed",
          n8n_status: `http_${response.status}`,
          n8n_response: responseBody,
          error_message: `n8n webhook trả về HTTP ${response.status}.`,
        })
        .eq("id", event.id);

      nextUrl = `/admin/ai-intake?status=failed&message=${encodeURIComponent(
        `n8n webhook lỗi HTTP ${response.status}.`,
      )}`;
    } else {
      await supabase
        .from("ai_intake_events")
        .update({
          n8n_status: "webhook_returned",
          n8n_response: responseBody,
        })
        .eq("id", event.id);

      nextUrl = `/admin/ai-intake?status=success&message=${encodeURIComponent(
        "Đã gửi event sang n8n.",
      )}`;
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Không gọi được n8n webhook.";

    await supabase
      .from("ai_intake_events")
      .update({
        status: "failed",
        n8n_status: "fetch_error",
        error_message: message,
      })
      .eq("id", event.id);

    nextUrl = `/admin/ai-intake?status=failed&message=${encodeURIComponent(
      message,
    )}`;
  }

  revalidatePath("/admin/ai-intake");
  redirect(nextUrl);
}