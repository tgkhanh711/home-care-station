"use client";

import { useRef, useState } from "react";
import { submitVitalSigns } from "@/app/actions/vitals";
import { PlusCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; // Import useRouter để ép tải lại trang

export function VitalsForm({ patientId }: { patientId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAction(formData: FormData) {
    try {
      setIsSubmitting(true);
      const hr = formData.get("hr") ? Number(formData.get("hr")) : undefined;
      const sys = formData.get("sys") ? Number(formData.get("sys")) : undefined;
      const dia = formData.get("dia") ? Number(formData.get("dia")) : undefined;
      const spo2 = formData.get("spo2") ? Number(formData.get("spo2")) : undefined;
      const temp = formData.get("temp") ? Number(formData.get("temp")) : undefined;

      // Validate: Cần nhập ít nhất 1 ô
      if (!hr && !sys && !dia && !spo2 && !temp) {
        alert("Vui lòng nhập ít nhất một chỉ số để lưu!");
        setIsSubmitting(false);
        return;
      }
      
      const result = await submitVitalSigns(patientId, { 
        heart_rate: hr, 
        blood_pressure_sys: sys, 
        blood_pressure_dia: dia, 
        spo2: spo2,
        temperature: temp
      });
      
      if (result.success) {
        formRef.current?.reset(); // 🟢 Xóa sạch dữ liệu trong form
        alert("Đã lưu chỉ số sinh tồn thành công!"); // 🟢 Hiện thông báo phản hồi
        router.refresh(); // 🟢 Ép trang web gọi lại API và cập nhật giao diện mới nhất
      } else {
        alert("Lỗi khi lưu dữ liệu: " + result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-900 dark:border-white/10">
      <div className="mb-3 flex items-center gap-2">
        <PlusCircle className="size-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Cập nhật chỉ số lâm sàng mới</h3>
      </div>
      <form 
        ref={formRef}
        action={handleAction} 
        className="flex flex-wrap items-center gap-3"
      >
        <input disabled={isSubmitting} type="number" name="hr" placeholder="Nhịp tim (HR)" className="w-full sm:flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950 dark:text-white disabled:opacity-50" />
        <div className="flex w-full sm:flex-1 items-center gap-1">
           <input disabled={isSubmitting} type="number" name="sys" placeholder="Tâm thu" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950 dark:text-white disabled:opacity-50" />
           <span className="text-slate-400">/</span>
           <input disabled={isSubmitting} type="number" name="dia" placeholder="Tâm trương" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950 dark:text-white disabled:opacity-50" />
        </div>
        <input disabled={isSubmitting} type="number" name="spo2" placeholder="SpO2 (%)" className="w-full sm:flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950 dark:text-white disabled:opacity-50" />
        
        <input disabled={isSubmitting} type="number" step="0.1" name="temp" placeholder="Nhiệt độ (°C)" className="w-full sm:flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-slate-950 dark:text-white disabled:opacity-50" />
        
        <button type="submit" disabled={isSubmitting} className="flex w-full sm:w-auto items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 disabled:opacity-50">
          {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          {isSubmitting ? "Đang lưu..." : "Lưu kết quả"}
        </button>
      </form>
    </div>
  );
}