import Link from "next/link";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  id: string;
  full_name: string;
  birth_year: number | null;
  gender: string | null;
  chronic_conditions: string | null;
  allergies: string | null;
  emergency_note: string | null;
  station_email: string | null;
  station_name: string | null;
  doctor_id: string | null;
};

type Medication = {
  elderly_profile_id: string;
  elderly_name: string;
  schedule_id: string;
  scheduled_time: string | null;
  medicine_name: string;
  dose: string;
  quantity_per_time: number;
  log_status: string | null;
  logged_at: string | null;
};

type Vital = {
  id: string;
  elderly_name: string;
  recorded_at: string;
  heart_rate: number | null;
  spo2: number | null;
  temperature: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  risk_level: string;
  risk_reason: string | null;
};

type AlertItem = {
  id: string;
  elderly_name: string;
  type: string;
  severity: string;
  title: string | null;
  message: string | null;
  created_at: string;
};

type Dashboard = {
  profiles: Profile[];
  today_medications: Medication[];
  recent_vitals: Vital[];
  open_alerts: AlertItem[];
};

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(status: string | null) {
  if (!status) {
    return "Chưa ghi nhận";
  }

  const labels: Record<string, string> = {
    taken: "Đã uống",
    skipped: "Bỏ qua",
    missed: "Quên uống",
    late: "Uống muộn",
  };

  return labels[status] ?? status;
}

function riskClass(level: string | null | undefined) {
  if (level === "high") {
    return "border-neutral-950 bg-neutral-950 text-white";
  }

  if (level === "medium") {
    return "border-neutral-400 bg-neutral-200 text-neutral-950";
  }

  return "border-neutral-200 bg-white text-neutral-800";
}

export default async function CaregiverMonitorPage() {
  await requireRole(["caregiver"]);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_caregiver_monitor_dashboard");

  const dashboard = (data ?? {
    profiles: [],
    today_medications: [],
    recent_vitals: [],
    open_alerts: [],
  }) as Dashboard;

  const uniqueTodayMedications = Array.from(
    new Map(
      (dashboard.today_medications ?? []).map((item) => [item.schedule_id, item]),
    ).values(),
  );
  const visibleTodayMedications = uniqueTodayMedications.slice(0, 10);
  const visibleRecentVitals = (dashboard.recent_vitals ?? []).slice(0, 10);
  const visibleOpenAlerts = (dashboard.open_alerts ?? []).slice(0, 10);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">
              Caregiver Monitor
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-neutral-950">
              Theo dõi chăm sóc
            </h1>
            <p className="mt-3 max-w-3xl text-neutral-600">
              Xem tuân thủ uống thuốc, chỉ số sức khỏe và cảnh báo từ station.
            </p>
          </div>

          <Link
            href="/caregiver"
            className="rounded-2xl border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-950 hover:text-white"
          >
            Quay lại hồ sơ
          </Link>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-neutral-950 bg-white px-4 py-3 text-sm font-medium text-neutral-950">
            {error.message}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm lg:col-span-1">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Hồ sơ
          </p>
          <div className="mt-5 space-y-4">
            {dashboard.profiles.length === 0 ? (
              <p className="text-sm text-neutral-500">Chưa có hồ sơ người cao tuổi.</p>
            ) : (
              dashboard.profiles.map((profile) => (
                <article key={profile.id} className="rounded-3xl border border-neutral-200 p-4">
                  <h2 className="text-xl font-semibold text-neutral-950">
                    {profile.full_name}
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600">
                    Năm sinh: {profile.birth_year ?? "Chưa nhập"}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Station: {profile.station_email ?? "Chưa liên kết"}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Bệnh nền: {profile.chronic_conditions ?? "Chưa nhập"}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="mt-5 max-h-130 space-y-3 overflow-y-auto pr-2">
  {visibleTodayMedications.length === 0 ? (
    <p className="text-sm text-neutral-500">Chưa có lịch thuốc hôm nay.</p>
  ) : null}

  {visibleTodayMedications.map((item, index) => (
    <article
      key={[
        item.schedule_id,
        item.elderly_name,
        item.medicine_name,
        item.scheduled_time,
        item.log_status ?? "none",
        item.logged_at ?? "none",
        index,
      ].join("-")}
      className="rounded-3xl border border-neutral-200 p-4"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-semibold text-neutral-500">
            {item.elderly_name} · {item.scheduled_time ?? "--:--"}
          </div>

          <h3 className="mt-1 text-xl font-semibold text-neutral-950">
            {item.medicine_name}
          </h3>

          <p className="mt-1 text-sm text-neutral-600">
            {item.dose} · {item.quantity_per_time} đơn vị/lần
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
          <div className="font-semibold text-neutral-950">
            {statusLabel(item.log_status)}
          </div>

          <div className="text-neutral-500">
            {formatDateTime(item.logged_at)}
          </div>
        </div>
      </div>
    </article>
  ))}
</div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Cảnh báo mở
          </p>
          <div className="mt-5 max-h-130 space-y-3 overflow-y-auto pr-2">
            {visibleOpenAlerts.length === 0 ? (
              <p className="text-sm text-neutral-500">Không có cảnh báo mở.</p>
            ) : (
              visibleOpenAlerts.map((alert) => (
                <article
                  key={alert.id}
                  className={`rounded-3xl border p-4 ${riskClass(alert.severity)}`}
                >
                  <div className="text-sm font-semibold">{alert.elderly_name}</div>
                  <h3 className="mt-1 text-lg font-semibold">{alert.title}</h3>
                  <p className="mt-2 text-sm opacity-80">{alert.message}</p>
                  <p className="mt-3 text-xs opacity-70">{formatDateTime(alert.created_at)}</p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-neutral-500">
            Chỉ số gần đây
          </p>
          <div className="mt-5 max-h-130 space-y-3 overflow-y-auto pr-2">
            {visibleRecentVitals.length === 0 ? (
              <p className="text-sm text-neutral-500">Chưa có chỉ số sức khỏe.</p>
            ) : (
              visibleRecentVitals.map((vital) => (
                <article
                  key={vital.id}
                  className={`rounded-3xl border p-4 ${riskClass(vital.risk_level)}`}
                >
                  <div className="text-sm font-semibold">{vital.elderly_name}</div>
                  <p className="mt-1 text-xs opacity-70">{formatDateTime(vital.recorded_at)}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p>HR: {vital.heart_rate ?? "--"}</p>
                    <p>SpO2: {vital.spo2 ?? "--"}</p>
                    <p>Nhiệt độ: {vital.temperature ?? "--"}</p>
                    <p>
                      HA: {vital.systolic_bp ?? "--"}/{vital.diastolic_bp ?? "--"}
                    </p>
                  </div>
                  <p className="mt-3 text-sm opacity-80">{vital.risk_reason}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}