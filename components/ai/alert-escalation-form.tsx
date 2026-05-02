"use client";

import { useActionState } from "react";

import { submitAlertEscalationAction } from "@/actions/ai-alert-escalation";
import {
  initialAlertEscalationState,
  type AlertEscalationProfile,
} from "@/lib/ai-alert-escalation";

type AlertEscalationFormProps = {
  profiles: AlertEscalationProfile[];
  profileErrorMessage?: string;
};

export function AlertEscalationForm({
  profiles,
  profileErrorMessage,
}: AlertEscalationFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitAlertEscalationAction,
    initialAlertEscalationState,
  );

  return (
    <section className="rounded-3xl border border-black bg-white p-6">
      <p className="text-sm font-black uppercase tracking-widest text-red-600">
        AI Alert Escalation
      </p>

      <h2 className="mt-2 text-2xl font-black text-black">
        Gửi cảnh báo khẩn cấp cho AI
      </h2>

      <p className="mt-3 text-sm text-slate-700">
        Dùng khi người cao tuổi có dấu hiệu bất thường như khó thở, đau ngực,
        chóng mặt, quên uống thuốc, hành vi lạ hoặc tình huống cần người chăm
        sóc chú ý ngay.
      </p>

      {profileErrorMessage ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Lỗi tải hồ sơ: {profileErrorMessage}
        </div>
      ) : null}

      <form action={formAction} className="mt-6 space-y-5">
        <div>
          <label className="text-sm font-bold text-black">
            Hồ sơ người cao tuổi
          </label>

          <select
            name="elderly_profile_id"
            className="mt-2 w-full rounded-2xl border border-black bg-white px-4 py-3 text-black outline-none focus:border-red-500"
          >
            <option value="">Không gắn hồ sơ / nhập tay</option>

            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name}
              </option>
            ))}
          </select>

          {profiles.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              Chưa tìm thấy hồ sơ qua RPC. Bạn vẫn có thể nhập tay tên người cao
              tuổi bên dưới.
            </p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-bold text-black">
            Tên người cao tuổi nếu nhập tay
          </label>

          <input
            name="manual_elderly_name"
            placeholder="Ví dụ: Ông B"
            className="mt-2 w-full rounded-2xl border border-black bg-white px-4 py-3 text-black outline-none focus:border-red-500"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-bold text-black">
              Nguồn cảnh báo
            </label>

            <select
              name="alert_source"
              defaultValue="caregiver_manual"
              className="mt-2 w-full rounded-2xl border border-black bg-white px-4 py-3 text-black outline-none focus:border-red-500"
            >
              <option value="caregiver_manual">Nhập tay từ caregiver</option>
              <option value="station_observation">Quan sát từ station</option>
              <option value="medication_issue">Vấn đề thuốc</option>
              <option value="vital_sign_issue">Vấn đề chỉ số sức khỏe</option>
              <option value="behavior_issue">Hành vi bất thường</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-bold text-black">
              Mức khẩn cấp gợi ý
            </label>

            <select
              name="suggested_urgency"
              defaultValue="urgent"
              className="mt-2 w-full rounded-2xl border border-black bg-white px-4 py-3 text-black outline-none focus:border-red-500"
            >
              <option value="urgent">Khẩn cấp</option>
              <option value="high">Nguy cơ cao</option>
              <option value="medium">Theo dõi sát</option>
              <option value="low">Thông tin tham khảo</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-black">
            Mô tả tình huống
          </label>

          <textarea
            name="source_text"
            required
            rows={7}
            placeholder="Ví dụ: Ông B hôm nay chóng mặt, khó thở nhẹ, huyết áp 170/100, quên uống thuốc sáng..."
            className="mt-2 w-full rounded-2xl border border-black bg-white px-4 py-3 text-black outline-none focus:border-red-500"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-2xl bg-red-600 px-5 py-4 text-base font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isPending ? "Đang gửi sang n8n..." : "Gửi cảnh báo AI"}
        </button>
      </form>

      {state.status !== "idle" ? (
        <div
          className={`mt-5 rounded-2xl border p-4 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <p className="font-black">{state.message}</p>

          {state.result?.summary ? (
            <p className="mt-3">
              <span className="font-bold">Tóm tắt: </span>
              {state.result.summary}
            </p>
          ) : null}

          {state.result?.advice ? (
            <p className="mt-2">
              <span className="font-bold">Gợi ý: </span>
              {state.result.advice}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}