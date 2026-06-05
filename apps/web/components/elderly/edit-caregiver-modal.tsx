"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, X, Loader2 } from "lucide-react";
import type { Database } from "@/database";
import { updateElderlyProfileCaregiver } from "@/app/actions/elderly";

export function EditCaregiverModal({ profile }: { profile: Database["public"]["Tables"]["elderly_profiles"]["Row"] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [address, setAddress] = useState(profile.address || "");
  const [contactName, setContactName] = useState(profile.emergency_contact_name || "");
  const [contactPhone, setContactPhone] = useState(profile.emergency_contact_phone || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await updateElderlyProfileCaregiver(profile.id, {
      address,
      emergency_contact_name: contactName,
      emergency_contact_phone: contactPhone,
    });
    setIsLoading(false);

    if (res.error) alert("Lỗi: " + res.error);
    else {
      setIsOpen(false);
      router.refresh();
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm border border-slate-200 transition hover:bg-slate-50 dark:bg-slate-900 dark:border-white/10 dark:text-slate-300"
      >
        <Settings className="size-4" />
        Cập nhật liên hệ
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Thông tin liên hệ</h2>
              <button onClick={() => setIsOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-400">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Địa chỉ nhà</label>
                <input 
                  type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Người liên hệ khẩn cấp</label>
                <input 
                  type="text" value={contactName} onChange={(e) => setContactName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">SĐT Khẩn cấp</label>
                <input 
                  type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-slate-950"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="submit" disabled={isLoading} className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-70">
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