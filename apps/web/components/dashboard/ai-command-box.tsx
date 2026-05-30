"use client";

import { FormEvent, useMemo, useState } from "react";

import type {
  HcsIntakeEvent,
  HcsIntakeSource,
  HcsRole,
} from "@/lib/ai/intake-contract";

type AiCommandBoxProps = {
  role: HcsRole;
};

type SubmitState =
  | {
      type: "idle";
      message: string;
    }
  | {
      type: "success";
      message: string;
    }
  | {
      type: "error";
      message: string;
    };

type IntakeResponse =
  | {
      ok: true;
      answer: string;
      intent: string;
      severity: string;
    }
  | {
      ok: false;
      error: string;
    };

const SOURCE_BY_ROLE: Record<HcsRole, HcsIntakeSource> = {
  admin: "admin_web",
  doctor: "doctor_web",
  caregiver: "caregiver_web",
  station: "station_web",
};

function createEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function AiCommandBox({ role }: AiCommandBoxProps) {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>({
    type: "idle",
    message: "Nhập yêu cầu nhanh cho AI Assistant hoặc điều phối hệ thống.",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const placeholder = useMemo(() => {
    if (role === "doctor") {
      return "Ví dụ: Tóm tắt bệnh nhân có cảnh báo đỏ hôm nay...";
    }

    if (role === "caregiver") {
      return "Ví dụ: Kiểm tra lịch thuốc hôm nay hoặc phân tích tin nhắn nghi lừa đảo...";
    }

    if (role === "admin") {
      return "Ví dụ: Kiểm tra log AI lỗi gần nhất hoặc trạng thái device queue...";
    }

    return "Ví dụ: Nhắc lại hướng dẫn uống thuốc...";
  }, [role]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (trimmedMessage.length === 0) {
      setState({
        type: "error",
        message: "Bạn cần nhập nội dung trước khi gửi.",
      });
      return;
    }

    const payload: HcsIntakeEvent = {
      event_id: createEventId(),
      event_type: "ai_command_submitted",
      source: SOURCE_BY_ROLE[role],
      role,
      payload: {
        message: trimmedMessage,
        ui_entry: "dashboard_shell_command_box",
      },
      created_at: new Date().toISOString(),
    };

    setIsSubmitting(true);
    setState({
      type: "idle",
      message: "Đang gửi event vào intake endpoint...",
    });

    try {
      const response = await fetch("/api/webhook/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as IntakeResponse;

      if (!response.ok || !data.ok) {
        setState({
          type: "error",
          message: data.ok ? "Gửi thất bại." : data.error,
        });
        return;
      }

      setState({
        type: "success",
        message: data.answer,
      });
      setMessage("");
    } catch {
      setState({
        type: "error",
        message: "Không gọi được /api/webhook/intake. Kiểm tra lại dev server.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-blue-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-700">AI Command</p>
          <p className="text-xs text-slate-500">
            Một khung AI trung tâm, sau này nối n8n theo intent.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          READY
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={[
              "text-xs",
              state.type === "success"
                ? "text-emerald-700"
                : state.type === "error"
                  ? "text-red-700"
                  : "text-slate-500",
            ].join(" ")}
          >
            {state.message}
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi lệnh AI"}
          </button>
        </div>
      </form>
    </section>
  );
}