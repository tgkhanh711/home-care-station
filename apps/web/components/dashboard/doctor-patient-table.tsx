"use client";

import { useMemo, useState } from "react";

export type DoctorPatientRow = {
  id: string;
  name: string;
  age: number;
  condition: string;
  hr: string;
  bp: string;
  spo2: string;
  alert: "critical" | "warning" | "stable";
  lastSeen: string;
};

type DoctorPatientTableProps = {
  rows: DoctorPatientRow[];
};

const ALERT_LABEL: Record<DoctorPatientRow["alert"], string> = {
  critical: "Đỏ - Cấp cứu",
  warning: "Cam - Cảnh báo",
  stable: "Ổn định",
};

const ALERT_CLASS: Record<DoctorPatientRow["alert"], string> = {
  critical: "bg-red-500/15 text-red-200 ring-1 ring-red-500/30",
  warning: "bg-orange-500/15 text-orange-200 ring-1 ring-orange-500/30",
  stable: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30",
};

export function DoctorPatientTable({ rows }: DoctorPatientTableProps) {
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length === 0) {
      return rows;
    }

    return rows.filter((row) => {
      const haystack = [
        row.name,
        row.age.toString(),
        row.condition,
        row.hr,
        row.bp,
        row.spo2,
        ALERT_LABEL[row.alert],
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [query, rows]);

  return (
    <section className="rounded-[28px] border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">Bảng bệnh nhân</h2>
          <p className="mt-1 text-sm text-slate-400">
            Lọc nhanh theo tên, bệnh nền, chỉ số hoặc mức cảnh báo.
          </p>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Lọc bệnh nhân..."
          className="h-11 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-215 border-separate border-spacing-y-2 text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-[0.16em] text-slate-500">
              <th className="px-3 py-2">Bệnh nhân</th>
              <th className="px-3 py-2">Bệnh nền</th>
              <th className="px-3 py-2">HR</th>
              <th className="px-3 py-2">BP</th>
              <th className="px-3 py-2">SpO2</th>
              <th className="px-3 py-2">Alert</th>
              <th className="px-3 py-2">Cập nhật</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="rounded-2xl bg-slate-950 text-slate-200">
                <td className="rounded-l-2xl px-3 py-4">
                  <p className="font-bold text-white">{row.name}</p>
                  <p className="text-xs text-slate-500">{row.age} tuổi</p>
                </td>
                <td className="px-3 py-4">{row.condition}</td>
                <td className="px-3 py-4 font-bold">{row.hr}</td>
                <td className="px-3 py-4 font-bold">{row.bp}</td>
                <td className="px-3 py-4 font-bold">{row.spo2}</td>
                <td className="px-3 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${ALERT_CLASS[row.alert]}`}>
                    {ALERT_LABEL[row.alert]}
                  </span>
                </td>
                <td className="rounded-r-2xl px-3 py-4 text-slate-400">
                  {row.lastSeen}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}