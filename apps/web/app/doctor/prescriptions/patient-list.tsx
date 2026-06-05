"use client";

import { useState } from "react";
import Link from "next/link";
import { UserCircle2, Search, AlertCircle } from "lucide-react";
import type { Database } from "@/database";

type Profile = Database["public"]["Tables"]["elderly_profiles"]["Row"];

export function PatientList({ profiles }: { profiles: Profile[] }) {
  const [search, setSearch] = useState("");

  const filteredProfiles = profiles?.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.medical_conditions?.join(" ") || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Chọn bệnh nhân để kê đơn</h2>
          <p className="text-sm text-slate-500">Danh sách bệnh nhân đang được theo dõi</p>
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Nhập tên hoặc bệnh nền..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredProfiles?.map((profile) => (
          <Link
            href={`/doctor/prescriptions?patientId=${profile.id}`}
            key={profile.id}
            className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-400 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-blue-500/50"
          >
            <div className="flex items-center gap-3">
              <div className="grid size-14 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <UserCircle2 className="size-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-black text-slate-900 dark:text-white">{profile.full_name}</h3>
                <p className="truncate text-xs font-semibold text-slate-500">
                  {profile.gender || "Chưa rõ GT"} • {profile.dob ? new Date().getFullYear() - new Date(profile.dob).getFullYear() + " tuổi" : "Chưa rõ tuổi"}
                </p>
              </div>
            </div>

            <div className="mt-2 space-y-2 rounded-xl bg-slate-50 p-3 text-[13px] dark:bg-slate-900/50">
              <p className="text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-700 dark:text-slate-200">Bệnh nền:</span> {profile.medical_conditions?.join(", ") || "Không có"}
              </p>
              {profile.allergies && profile.allergies.length > 0 && (
                <p className="flex items-start gap-1.5 text-red-600 dark:text-red-400">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  <span><span className="font-bold">Dị ứng:</span> {profile.allergies.join(", ")}</span>
                </p>
              )}
            </div>
          </Link>
        ))}
        {filteredProfiles?.length === 0 && (
          <div className="col-span-full rounded-[24px] border border-dashed border-slate-200 py-12 text-center font-semibold text-slate-500 dark:border-white/10">
            Không tìm thấy bệnh nhân nào.
          </div>
        )}
      </div>
    </div>
  );
}