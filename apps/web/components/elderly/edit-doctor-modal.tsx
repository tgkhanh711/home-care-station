"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, X, Loader2 } from "lucide-react";
import { updateElderlyProfileDoctor } from "@/app/actions/elderly";

import type { Database } from "@/database";

export function EditDoctorModal({ profile }: { profile: Database["public"]["Tables"]["elderly_profiles"]["Row"] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [careStatus, setCareStatus] = useState(profile.care_status || "Ổn định");
  const [medicalConditions, setMedicalConditions] = useState(profile.medical_conditions?.join(", ") || "");
  const [allergies, setAllergies] = useState(profile.allergies?.join(", ") || "");
  const [notes, setNotes] = useState(profile.notes || "");

  // Initialize fields when opening modal to reflect latest `profile` values

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const conditionsArray = medicalConditions.split(",").map((s: string) => s.trim()).filter(Boolean);
      const allergiesArray = allergies.split(",").map((s: string) => s.trim()).filter(Boolean);

      const res = await updateElderlyProfileDoctor(profile.id, {
        care_status: careStatus,
        medical_conditions: conditionsArray,
        allergies: allergiesArray,
        notes
      });

      if (res?.error) {
        alert("Lỗi khi lưu: " + res.error);
      } else {
        setIsOpen(false);
        router.refresh(); // Tải lại UI Next.js
      }
    } catch (err) {
      // Fallback for unexpected errors
      console.error(err);
      alert("Có lỗi xảy ra khi lưu. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => {
          setCareStatus(profile.care_status || "Ổn định");
          setMedicalConditions(profile.medical_conditions?.join(", ") || "");
          setAllergies(profile.allergies?.join(", ") || "");
          setNotes(profile.notes || "");
          setIsOpen(true);
        }}
        title="Chỉnh sửa hồ sơ"
        className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-blue-600 dark:border-white/8 dark:bg-white/4 dark:text-slate-400 dark:hover:text-white"
      >
        <MoreHorizontal className="size-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Cập nhật y khoa</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-400">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Mức độ rủi ro (Care Status)</label>
                <select 
                  value={careStatus} onChange={(e) => setCareStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-white/10 dark:bg-slate-950"
                >
                  <option value="Ổn định">Ổn định (Xanh)</option>
                  <option value="Cần theo dõi">Cần theo dõi (Cam)</option>
                  <option value="Nguy hiểm">Nguy hiểm (Đỏ)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Bệnh nền (Cách nhau bằng dấu phẩy)</label>
                <input 
                  type="text" value={medicalConditions} onChange={(e) => setMedicalConditions(e.target.value)}
                  placeholder="VD: Tăng huyết áp, Đái tháo đường..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-white/10 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Dị ứng</label>
                <input 
                  type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)}
                  placeholder="VD: Phấn hoa, Penicillin..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-white/10 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Ghi chú lâm sàng</label>
                <textarea 
                  rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú nội bộ cho bác sĩ..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-white/10 dark:bg-slate-950"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="submit" disabled={isLoading} className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-70 dark:bg-blue-500">
                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}