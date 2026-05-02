"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { submitMedicationCheckAction } from "@/actions/ai-medication-check";
import { initialMedicationCheckState } from "@/lib/ai-medication-check";

type ElderlyProfileOption = {
  id: string;
  full_name: string | null;
};

type MedicationCheckFormProps = {
  elderlyProfiles: ElderlyProfileOption[];
};

export function MedicationCheckForm({
  elderlyProfiles,
}: MedicationCheckFormProps) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    submitMedicationCheckAction,
    initialMedicationCheckState,
  );

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          AI Medication Check
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">
          Kiểm tra thuốc trước khi uống
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Cụm này đang mô phỏng bước kiểm tra bằng ảnh/camera. Bạn nhập tên
          thuốc dự kiến và thuốc quan sát được để n8n phân tích đúng, sai hoặc
          chưa chắc chắn.
        </p>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Hồ sơ người cao tuổi
          </span>
          <select
            name="elderly_profile_id"
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
          >
            <option value="">Không chọn hồ sơ</option>
            {elderlyProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.full_name || "Người cao tuổi chưa có tên"}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Thuốc dự kiến theo đơn/lịch uống
          </span>
          <input
            name="expected_medicine"
            required
            placeholder="Ví dụ: Amlodipine 5mg"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Thuốc quan sát được
          </span>
          <input
            name="observed_medicine"
            required
            placeholder="Ví dụ: Amlodipine 5mg hoặc Paracetamol 500mg"
            className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">
            Ghi chú ảnh/mô tả camera giả lập
          </span>
          <textarea
            name="image_note"
            rows={5}
            placeholder="Ví dụ: Ảnh rõ, thấy vỉ thuốc màu trắng, chữ Amlodipine 5mg. Hoặc: ảnh mờ, không nhìn rõ tên thuốc."
            className="rounded-2xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-slate-900"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-3 text-base font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Đang gửi sang n8n..." : "Gửi kiểm tra thuốc AI"}
      </button>

      {state.status !== "idle" ? (
        <div
          className={
            state.status === "success"
              ? "mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900"
              : "mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-900"
          }
        >
          <p className="font-bold">{state.message}</p>

          {state.result ? (
            <div className="mt-3 space-y-1 text-sm">
              <p>
                <span className="font-semibold">Mức rủi ro:</span>{" "}
                {state.result.risk_level || "Không rõ"}
              </p>
              <p>
                <span className="font-semibold">Trạng thái:</span>{" "}
                {state.result.status || "Không rõ"}
              </p>
              <p>
                <span className="font-semibold">Tóm tắt:</span>{" "}
                {state.result.summary || "Không có"}
              </p>
              <p>
                <span className="font-semibold">Khuyến nghị:</span>{" "}
                {state.result.advice || "Không có"}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}