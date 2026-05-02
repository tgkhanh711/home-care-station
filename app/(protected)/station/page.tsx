import { redirect } from "next/navigation";

import {
  createMedicationLogAction,
  saveVitalSignLogAction,
  sendSosAction,
} from "@/actions/station";

import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  message?: string;
  error?: string;
}>;

type StationDashboardData = {
  elderly: {
    id: string;
    fullName: string;
    birthYear: number | null;
    gender: string | null;
    address: string | null;
    chronicConditions: string | null;
    allergies: string | null;
    emergencyNote: string | null;
  } | null;
  schedules: MedicationSchedule[];
  alerts: AlertItem[];
  vitals: VitalItem[];
  medicationHistory: MedicationHistoryItem[];
};

type MedicationSchedule = {
  id: string;
  scheduleTime: string | null;
  medicineName: string | null;
  dose: string | null;
  quantityPerTime: number | null;
  instruction: string | null;
  latestStatus: string | null;
  latestNote: string | null;
  latestLoggedAt: string | null;
};

type AlertItem = {
  id: string;
  category: string | null;
  severity: string | null;
  title: string | null;
  message: string | null;
  status: string | null;
  createdAt: string | null;
};

type VitalItem = {
  id: string;
  heartRate: number | null;
  spo2: number | null;
  temperatureC: number | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  note: string | null;
  createdAt: string | null;
};

type MedicationHistoryItem = {
  id: string;
  medicineName: string | null;
  scheduleTime: string | null;
  status: string | null;
  note: string | null;
  createdAt: string | null;
};

function getText(value: string | undefined) {
  if (!value) {
    return null;
  }

  return decodeURIComponent(value);
}

function statusLabel(status: string | null) {
  if (status === "taken") {
    return "Đã uống";
  }

  if (status === "skipped") {
    return "Bỏ qua";
  }

  if (status === "missed") {
    return "Quên uống";
  }

  return "Chưa ghi nhận";
}

function severityLabel(severity: string | null) {
  if (severity === "high") {
    return "Khẩn cấp";
  }

  if (severity === "medium") {
    return "Cần chú ý";
  }

  if (severity === "low") {
    return "Theo dõi";
  }

  return "Thông tin";
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Chưa có";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function normalizeDashboardData(value: unknown): StationDashboardData {
  const data = value as Partial<StationDashboardData> | null;

  return {
    elderly: data?.elderly ?? null,
    schedules: Array.isArray(data?.schedules) ? data.schedules : [],
    alerts: Array.isArray(data?.alerts) ? data.alerts : [],
    vitals: Array.isArray(data?.vitals) ? data.vitals : [],
    medicationHistory: Array.isArray(data?.medicationHistory)
      ? data.medicationHistory
      : [],
  };
}

export default async function StationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const message = getText(params?.message);
  const error = getText(params?.error);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: appUser } = await supabase
    .from("users")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (!appUser || String(appUser.role) !== "station") {
    redirect("/login");
  }

  const { data, error: rpcError } = await supabase.rpc(
    "station_get_dashboard_data_v2",
  );

  const dashboard = normalizeDashboardData(data);
  const visibleSchedules = dashboard.schedules.slice(0, 10);
  const visibleAlerts = dashboard.alerts.slice(0, 10);
  const visibleMedicationHistory = dashboard.medicationHistory.slice(0, 10);
  const visibleVitals = dashboard.vitals.slice(0, 10);

  return (
    <main className="min-h-screen bg-neutral-50 text-black">

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8">
        {rpcError ? (
          <div className="rounded-3xl border border-black bg-white p-5 text-sm">
            {rpcError.message}
          </div>
        ) : null}

        {message ? (
          <div className="rounded-3xl border border-emerald-300 bg-emerald-50 p-5 text-sm text-emerald-900">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-black bg-white p-5 text-sm">
            {error}
          </div>
        ) : null}

        {!dashboard.elderly ? (
          <section className="rounded-4xl border border-neutral-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-black tracking-[0.35em] text-neutral-500">
              CHƯA LIÊN KẾT
            </p>
            <h1 className="mt-4 text-3xl font-black">
              Station chưa được liên kết với caregiver
            </h1>
            <p className="mt-3 max-w-2xl text-neutral-600">
              Hãy đăng nhập tài khoản caregiver, vào hồ sơ người cao tuổi và
              liên kết tài khoản station này trước.
            </p>
          </section>
        ) : (
          <>
            <section className="rounded-4xl border border-neutral-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
                <div>
                  <p className="text-sm font-black tracking-[0.35em] text-neutral-500">
                    STATION HÔM NAY
                  </p>
                  <h1 className="mt-4 text-4xl font-black">
                    {dashboard.elderly.fullName}
                  </h1>
                  <p className="mt-3 text-neutral-700">
                    Màn hình mock thiết bị: uống thuốc, nhập chỉ số sức khỏe và
                    gửi SOS.
                  </p>
                </div>

                <form
                  action={sendSosAction}
                  className="w-full rounded-3xl border border-neutral-200 p-5 lg:w-80"
                >
                  <label className="text-sm">Ghi chú SOS</label>
                  <input
                    name="sosNote"
                    placeholder="Ví dụ: đau ngực, chóng mặt..."
                    className="mt-3 w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                  />
                  <button className="mt-3 w-full rounded-2xl bg-black px-4 py-4 font-semibold text-white hover:bg-neutral-800">
                    Gửi SOS
                  </button>
                </form>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
              <div className="rounded-4xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black tracking-[0.35em] text-neutral-500">
                      THUỐC HÔM NAY
                    </p>
                    <h2 className="mt-3 text-3xl font-black">
                      Lịch uống thuốc
                    </h2>
                  </div>
                  <span className="rounded-full border border-neutral-200 px-4 py-2 text-sm">
                    {visibleSchedules.length} lịch
                  </span>
                </div>

                <div className="mt-6 max-h-155 space-y-4 overflow-y-auto pr-2">
                  {visibleSchedules.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      Chưa có lịch uống thuốc.
                    </p>
                  ) : (
                    visibleSchedules.map((schedule) => (
                      <article
                        key={schedule.id}
                        className="rounded-3xl border border-neutral-200 p-5"
                      >
                        <div className="flex flex-col justify-between gap-4 md:flex-row">
                          <div>
                            <p className="text-sm font-bold text-neutral-500">
                              {schedule.scheduleTime ?? "--:--"}
                            </p>
                            <h3 className="mt-2 text-2xl font-black">
                              {schedule.medicineName ?? "Thuốc chưa đặt tên"}
                            </h3>
                            <p className="mt-2 text-neutral-700">
                              Liều: {schedule.dose ?? "Chưa có"} · Số
                              lượng/lần: {schedule.quantityPerTime ?? "Chưa có"}
                            </p>
                            <p className="mt-3 text-sm text-neutral-500">
                              {schedule.instruction ?? "Không có hướng dẫn"}
                            </p>
                          </div>

                          <div className="min-w-40 rounded-2xl border border-neutral-200 p-4 text-sm">
                            <p className="font-semibold">
                              {statusLabel(schedule.latestStatus)}
                            </p>
                            <p className="mt-1 text-neutral-500">
                              {formatDateTime(schedule.latestLoggedAt)}
                            </p>
                          </div>
                        </div>

                        <form
                          action={createMedicationLogAction}
                          className="mt-5 grid gap-3"
                        >
                          <input
                            type="hidden"
                            name="scheduleId"
                            value={schedule.id}
                          />

                          <input
                            name="note"
                            placeholder="Ghi chú nếu cần"
                            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                          />

                          <div className="grid gap-3 md:grid-cols-3">
                            <button
                              name="status"
                              value="taken"
                              className="rounded-2xl bg-black px-4 py-3 font-semibold text-white hover:bg-neutral-800"
                            >
                              Đã uống
                            </button>

                            <button
                              name="status"
                              value="skipped"
                              className="rounded-2xl border border-neutral-300 px-4 py-3 hover:bg-neutral-100"
                            >
                              Bỏ qua
                            </button>

                            <button
                              name="status"
                              value="missed"
                              className="rounded-2xl border border-black px-4 py-3 hover:bg-neutral-100"
                            >
                              Quên uống
                            </button>
                          </div>
                        </form>
                      </article>
                    ))
                  )}
                </div>
              </div>

              <div className="grid gap-6">
                <section className="rounded-4xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-black tracking-[0.35em] text-neutral-500">
                    CHỈ SỐ
                  </p>
                  <h2 className="mt-3 text-3xl font-black">Nhập thủ công</h2>

                  <form
                    action={saveVitalSignLogAction}
                    className="mt-6 grid gap-3"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        name="heartRate"
                        type="number"
                        placeholder="Nhịp tim"
                        className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                      />
                      <input
                        name="spo2"
                        type="number"
                        placeholder="SpO2"
                        className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                      />
                      <input
                        name="temperatureC"
                        type="number"
                        step="0.1"
                        placeholder="Nhiệt độ"
                        className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                      />
                      <input
                        name="systolicBp"
                        type="number"
                        placeholder="Huyết áp tâm thu"
                        className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                      />
                      <input
                        name="diastolicBp"
                        type="number"
                        placeholder="Huyết áp tâm trương"
                        className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                      />
                      <input
                        name="note"
                        placeholder="Ghi chú"
                        className="rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                      />
                    </div>

                    <button className="rounded-2xl bg-black px-4 py-4 font-semibold text-white hover:bg-neutral-800">
                      Lưu chỉ số
                    </button>
                  </form>
                </section>

                <section className="rounded-4xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <p className="text-sm font-black tracking-[0.35em] text-neutral-500">
                    CẢNH BÁO MỞ
                  </p>

                  <div className="mt-5 max-h-130 space-y-3 overflow-y-auto pr-2">
                    {visibleAlerts.length === 0 ? (
                      <p className="text-sm text-neutral-500">
                        Chưa có cảnh báo mở.
                      </p>
                    ) : (
                      visibleAlerts.map((alert) => (
                        <article
                          key={alert.id}
                          className={`rounded-2xl border p-4 text-sm ${
                            alert.severity === "high"
                              ? "border-black bg-black text-white"
                              : "border-neutral-300 bg-neutral-100 text-black"
                          }`}
                        >
                          <p className="font-bold">
                            {alert.title ?? severityLabel(alert.severity)}
                          </p>
                          <p className="mt-1 opacity-80">
                            {alert.message ?? "Không có nội dung."}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-4xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-black tracking-[0.35em] text-neutral-500">
                  LỊCH SỬ UỐNG THUỐC
                </p>

                <div className="mt-5 max-h-130 space-y-3 overflow-y-auto pr-2">
                  {visibleMedicationHistory.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      Chưa có lịch sử uống thuốc.
                    </p>
                  ) : (
                    visibleMedicationHistory.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-neutral-200 p-4 text-sm"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-bold">
                            {item.medicineName ?? "Thuốc"}
                          </p>
                          <p className="text-neutral-500">
                            {statusLabel(item.status)}
                          </p>
                        </div>
                        <p className="mt-1 text-neutral-500">
                          {item.scheduleTime ?? "--:--"} ·{" "}
                          {formatDateTime(item.createdAt)}
                        </p>
                        {item.note ? (
                          <p className="mt-2 text-neutral-600">{item.note}</p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-4xl border border-neutral-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-black tracking-[0.35em] text-neutral-500">
                  LỊCH SỬ CHỈ SỐ GẦN ĐÂY
                </p>

                <div className="mt-5 max-h-130 space-y-3 overflow-y-auto pr-2">
                  {visibleVitals.length === 0 ? (
                    <p className="text-sm text-neutral-500">
                      Chưa có chỉ số nào.
                    </p>
                  ) : (
                    visibleVitals.map((vital) => (
                      <div
                        key={vital.id}
                        className="rounded-2xl border border-neutral-200 p-4 text-sm"
                      >
                        <p className="font-bold">
                          {formatDateTime(vital.createdAt)}
                        </p>
                        <p className="mt-2 text-neutral-600">
                          Nhịp tim: {vital.heartRate ?? "--"} · SpO2:{" "}
                          {vital.spo2 ?? "--"} · Nhiệt độ:{" "}
                          {vital.temperatureC ?? "--"}
                        </p>
                        <p className="mt-1 text-neutral-600">
                          Huyết áp: {vital.systolicBp ?? "--"}/
                          {vital.diastolicBp ?? "--"}
                        </p>
                        {vital.note ? (
                          <p className="mt-2 text-neutral-500">
                            {vital.note}
                          </p>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </section>
          </>
        )}
      </section>
    </main>
  );
}