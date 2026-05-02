"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  AiHealthRiskState,
  runAiHealthRiskAction,
} from "@/actions/ai-health-risk";

type ElderlyProfile = {
  id: string;
  full_name: string | null;
};

type AiHealthRiskFormProps = {
  profiles: ElderlyProfile[];
};

const initialState: AiHealthRiskState = {
  ok: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Đang gửi sang n8n..." : "Phân tích nguy cơ sức khỏe"}
    </button>
  );
}

export function AiHealthRiskForm({ profiles }: AiHealthRiskFormProps) {
  const [state, formAction] = useActionState(
    runAiHealthRiskAction,
    initialState,
  );

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="space-y-5">
          <div>
            <label
              htmlFor="elderly_profile_id"
              className="mb-2 block text-sm font-semibold text-slate-900"
            >
              Hồ sơ người già
            </label>

            <select
              id="elderly_profile_id"
              name="elderly_profile_id"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.full_name || "Người già chưa đặt tên"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="health_note"
              className="mb-2 block text-sm font-semibold text-slate-900"
            >
              Tình trạng sức khỏe cần AI đánh giá
            </label>

            <textarea
              id="health_note"
              name="health_note"
              required
              rows={7}
              defaultValue="Ông B hôm nay chóng mặt, khó thở nhẹ, huyết áp 170/100, quên uống thuốc sáng."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <SubmitButton />
        </div>
      </form>

      {state.message ? (
        <div
          className={
            state.ok
              ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900"
              : "rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900"
          }
        >
          <p className="font-semibold">{state.message}</p>
        </div>
      ) : null}

      {state.result ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            Kết quả n8n trả về
          </h2>

          <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-50">
            {JSON.stringify(state.result, null, 2)}
          </pre>
        </section>
      ) : null}

      {state.payload ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            Payload đã gửi sang n8n
          </h2>

          <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-50">
            {JSON.stringify(state.payload, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}