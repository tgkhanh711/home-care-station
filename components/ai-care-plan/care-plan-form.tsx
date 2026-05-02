"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  requestAiCarePlanAction,
  type AiCarePlanActionState,
} from "@/actions/ai-care-plan";

type ElderlyProfileOption = {
  id: string;
  full_name: string;
  birth_year?: number | null;
};

type CarePlanFormProps = {
  profiles: ElderlyProfileOption[];
};

const initialState: AiCarePlanActionState = {
  ok: false,
  message: "",
  data: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Đang gửi sang n8n..." : "Tạo kế hoạch chăm sóc bằng AI"}
    </button>
  );
}

export function CarePlanForm({ profiles }: CarePlanFormProps) {
  const [state, formAction] = useActionState(
    requestAiCarePlanAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            Tạo kế hoạch chăm sóc
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Caregiver nhập tình huống thực tế, hệ thống sẽ gửi sang n8n để AI tạo
            kế hoạch chăm sóc phù hợp.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Hồ sơ người cao tuổi
          </label>
          <select
            name="elderlyProfileId"
            required
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-950"
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name}
                {profile.birth_year ? ` - ${profile.birth_year}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Mục tiêu chăm sóc
          </label>
          <input
            name="goal"
            placeholder="Ví dụ: Theo dõi trong ngày, giảm rủi ro quên thuốc, hỗ trợ huyết áp..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-950"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-800">
            Tình huống cần AI phân tích
          </label>
          <textarea
            name="message"
            required
            rows={6}
            placeholder="Ví dụ: Hôm nay người cao tuổi quên uống thuốc buổi sáng, hơi chóng mặt và huyết áp cao hơn bình thường. Hãy tạo kế hoạch chăm sóc trong ngày."
            className="w-full resize-y rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-950"
          />
        </div>

        <SubmitButton />

        {state.message ? (
          <div
            className={
              state.ok
                ? "rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                : "rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            }
          >
            <p className="font-semibold">{state.ok ? "Thành công" : "Lỗi"}</p>
            <p className="mt-1">{state.message}</p>
          </div>
        ) : null}

        {state.data ? (
          <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-800">
              Xem phản hồi từ n8n
            </summary>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap text-xs text-slate-700">
              {JSON.stringify(state.data, null, 2)}
            </pre>
          </details>
        ) : null}
      </div>
    </form>
  );
}