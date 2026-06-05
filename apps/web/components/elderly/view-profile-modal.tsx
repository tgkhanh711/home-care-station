"use client";

import { useState } from "react";
import type { Database } from "@/database";
import { Eye, X, UserRound, Phone, MapPin, HeartPulse, ShieldAlert } from "lucide-react";

export function ViewProfileModal({ profile }: { profile: Database["public"]["Tables"]["elderly_profiles"]["Row"] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!profile) return null;

  // Tính tuổi
  const age = profile.dob ? new Date().getFullYear() - new Date(profile.dob).getFullYear() : "Chưa cập nhật";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        title="Xem chi tiết hồ sơ"
        className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-blue-600 dark:border-white/8 dark:bg-white/4 dark:text-slate-400 dark:hover:text-white"
      >
        <Eye className="size-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-all">
          <div className="custom-scrollbar w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            
            {/* Header Modal */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <UserRound className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black leading-tight text-slate-900 dark:text-white">Hồ sơ: {profile.full_name}</h2>
                  <p className="text-xs font-semibold text-slate-500">Mã BN: {profile.id.split('-')[0].toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-400">
                <X className="size-4" />
              </button>
            </div>

            {/* Nội dung chi tiết */}
            <div className="p-6 space-y-6">
              
              {/* Cụm 1: Thông tin cá nhân & Liên hệ */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400">
                  <UserRound className="size-4" /> Thông tin Hành chính
                </h3>
                <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/[0.02] sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Tuổi / Giới tính</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{age} tuổi • {profile.gender || "Chưa cập nhật"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">Ngày sinh</p>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {profile.dob ? new Date(profile.dob).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><MapPin className="size-3.5"/> Địa chỉ hiện tại</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{profile.address || "Chưa cập nhật"}</p>
                  </div>
                  <div className="sm:col-span-2 rounded-xl bg-orange-100/50 p-3 dark:bg-orange-500/10">
                    <p className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5"><Phone className="size-3.5"/> Liên hệ khẩn cấp (Người nhà)</p>
                    <p className="font-black text-orange-700 dark:text-orange-300">
                      {profile.emergency_contact_name || "Chưa có tên"} • {profile.emergency_contact_phone || profile.emergency_contact || "Chưa có SĐT"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Cụm 2: Thông tin y tế */}
              <section>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-400">
                  <HeartPulse className="size-4" /> Dữ liệu Y khoa
                </h3>
                <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/[0.02]">
                  <div>
                    <p className="text-xs font-bold text-slate-500">Trạng thái rủi ro hiện tại</p>
                    <span className="mt-1 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {profile.care_status || "Ổn định"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500">Bệnh nền (Tiền sử)</p>
                    <p className="font-semibold leading-relaxed text-slate-900 dark:text-white">
                      {profile.medical_conditions?.length > 0 ? profile.medical_conditions.join(", ") : "Không ghi nhận"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5"><ShieldAlert className="size-3.5 text-red-500"/> Dị ứng thuốc/thức ăn</p>
                    <p className="font-semibold text-red-600 dark:text-red-400">
                      {profile.allergies?.length > 0 ? profile.allergies.join(", ") : "Không có"}
                    </p>
                  </div>
                  {profile.notes && (
                    <div className="rounded-xl bg-yellow-50 p-3 dark:bg-yellow-500/10">
                      <p className="text-xs font-bold text-yellow-700 dark:text-yellow-500">Ghi chú lâm sàng</p>
                      <p className="mt-1 text-sm font-medium text-yellow-900 dark:text-yellow-200">{profile.notes}</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}