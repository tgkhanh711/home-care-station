"use client";

import { useState, useTransition } from "react";

import { createAiDailySummary } from "@/actions/ai-daily-summary";
import type {
  AiDailySummaryActionResult,
  AiDailySummaryProfile,
} from "@/lib/ai-daily-summary";

type DailySummaryFormProps = {
  profiles: AiDailySummaryProfile[];
  errorMessage?: string;
};

export default function DailySummaryForm({
  profiles,
  errorMessage,
}: DailySummaryFormProps) {
  const [result, setResult] = useState<AiDailySummaryActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        const actionResult = await createAiDailySummary(formData);
        setResult(actionResult);

        if (actionResult.ok) {
          window.setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      })();
    });
  }

  const hasProfiles = profiles.length > 0;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
        AI Daily Summary
      </p>

      <h2 className="mt-2 text-2xl font-bold text-slate-950">
        Tổng hợp tình hình chăm sóc trong ngày
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        Caregiver nhập tình hình trong ngày. n8n sẽ phân tích, tạo bản tóm tắt,
        đánh giá rủi ro và lưu lịch sử vào Supabase.
      </p>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {!hasProfiles ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Không có hồ sơ người cao tuổi phù hợp. Hãy kiểm tra tài khoản
          caregiver đã được liên kết với elderly profile chưa.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">
            Hồ sơ người cao tuổi
          </span>
          <select
            name="elderly_profile_id"
            disabled={!hasProfiles || isPending}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-red-500"
            required
          >
            {profiles.map((profile) => (
              <option
                key={profile.elderly_profile_id}
                value={profile.elderly_profile_id}
              >
                {profile.elderly_name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">
            Loại tổng hợp
          </span>
          <select
            name="summary_type"
            disabled={isPending}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-red-500"
          >
            <option value="daily">Tổng hợp trong ngày</option>
            <option value="shift_handover">Bàn giao ca chăm sóc</option>
            <option value="weekly">Tổng hợp tuần</option>
            <option value="incident_followup">Theo dõi sau sự cố</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-900">
            Nội dung tình hình
          </span>
          <textarea
            name="input_context"
            disabled={!hasProfiles || isPending}
            rows={8}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-red-500"
            placeholder="Ví dụ: Hôm nay ông B ăn uống bình thường, hơi chóng mặt buổi chiều, đã uống thuốc sáng nhưng quên thuốc tối, huyết áp 150/95..."
            required
          />
        </label>

        <button
          type="submit"
          disabled={!hasProfiles || isPending}
          className="rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isPending ? "Đang gửi sang n8n..." : "Tạo AI Daily Summary"}
        </button>
      </form>

      {result ? (
        <div
          className={
            result.ok
              ? "mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              : "mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          }
        >
          <p className="font-semibold">{result.message}</p>
          {result.error ? <p className="mt-2">{result.error}</p> : null}
        </div>
      ) : null}
    </section>
  );
}