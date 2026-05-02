import {
  createElderlyProfileAction,
  linkStationAction,
  requestDoctorAction,
  unlinkStationAction,
  updateElderlyProfileAction,
} from "@/actions/caregiver";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type CaregiverPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

type ElderlyProfile = {
  id: string;
  full_name: string;
  birth_year: number | null;
  gender: string | null;
  address: string | null;
  chronic_conditions: string | null;
  allergies: string | null;
  emergency_note: string | null;
  assigned_doctor_id: string | null;
  assigned_doctor_name: string | null;
  station_user_id: string | null;
  station_email: string | null;
  station_name: string | null;
  created_at: string;
  updated_at: string;
};

type Doctor = {
  id: string;
  display_name: string;
  specialization: string | null;
  workplace: string | null;
  verified: boolean;
};

type Prescription = {
  id: string;
  elderly_profile_id: string;
  title: string;
  diagnosis: string | null;
  instruction: string | null;
  start_date: string;
  is_active: boolean;
  prescription_items:
    | {
        id: string;
        medicine_name: string;
        dose: string;
        quantity_per_time: number;
        note: string | null;
        medication_schedules:
          | {
              id: string;
              scheduled_time: string;
              time_note: string | null;
              is_active: boolean;
            }[]
          | null;
      }[]
    | null;
};

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
        {label}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black"
      />
    </label>
  );
}

function PrescriptionList({
  prescriptions,
}: {
  prescriptions: Prescription[];
}) {
  if (prescriptions.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/15 p-4 text-sm text-black/50">
        Chưa có đơn thuốc.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {prescriptions.map((prescription) => (
        <div key={prescription.id} className="rounded-2xl border border-black/10 bg-black/2 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-black">{prescription.title}</p>
              <p className="mt-1 text-xs text-black/50">
                Bắt đầu: {prescription.start_date} · {prescription.is_active ? "Đang dùng" : "Đã tắt"}
              </p>
            </div>
            <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
              Doctor
            </span>
          </div>

          {prescription.diagnosis ? (
            <p className="mt-3 text-sm text-black/60">Chẩn đoán: {prescription.diagnosis}</p>
          ) : null}

          {prescription.instruction ? (
            <p className="mt-2 text-sm text-black/60">Hướng dẫn: {prescription.instruction}</p>
          ) : null}

          <div className="mt-4 space-y-3">
            {prescription.prescription_items?.map((item) => (
              <div key={item.id} className="rounded-xl bg-white p-3">
                <p className="text-sm font-semibold text-black">
                  {item.medicine_name} · {item.dose} · {item.quantity_per_time} viên/lần
                </p>
                {item.note ? <p className="mt-1 text-xs text-black/50">{item.note}</p> : null}

                <div className="mt-2 flex flex-wrap gap-2">
                  {item.medication_schedules?.map((schedule) => (
                    <span
                      key={schedule.id}
                      className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/60"
                    >
                      {schedule.scheduled_time.slice(0, 5)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function CaregiverPage({ searchParams }: CaregiverPageProps) {
  const profile = await requireRole(["caregiver"]);
  const params = await searchParams;
  const supabase = await createClient();

  const { data: elderlyData } = await supabase.rpc("get_my_caregiver_elderly_profiles");
  const elderlyProfiles = (elderlyData ?? []) as ElderlyProfile[];

  const { data: doctorsData } = await supabase
    .from("doctors")
    .select("id,display_name,specialization,workplace,verified")
    .order("created_at", { ascending: false });

  const doctors = (doctorsData ?? []) as Doctor[];
  const elderlyIds = elderlyProfiles.map((elderly) => elderly.id);

  const { data: prescriptionsData } =
    elderlyIds.length > 0
      ? await supabase
          .from("prescriptions")
          .select(
            `
            id,
            elderly_profile_id,
            title,
            diagnosis,
            instruction,
            start_date,
            is_active,
            prescription_items (
              id,
              medicine_name,
              dose,
              quantity_per_time,
              note,
              medication_schedules (
                id,
                scheduled_time,
                time_note,
                is_active
              )
            )
          `,
          )
          .in("elderly_profile_id", elderlyIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  const prescriptions = (prescriptionsData ?? []) as Prescription[];

  return (
    <section className="space-y-8">
      <div className="rounded-4xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-black/45">
          Caregiver dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-black">
          Quản lý chăm sóc tại nhà
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-black/60">
          Tạo hồ sơ người cao tuổi, liên kết tài khoản, gửi yêu cầu kết nối bác sĩ
          và theo dõi đơn thuốc đã được bác sĩ tạo.
        </p>
        <p className="mt-3 text-sm text-black/45">
          Đang đăng nhập: {profile.full_name} · {profile.email}
        </p>
      </div>

      {params.error ? (
        <div className="rounded-2xl border border-black bg-black px-5 py-4 text-sm text-white">
          {params.error}
        </div>
      ) : null}

      {params.message ? (
        <div className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-black/70">
          {params.message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-black">Hồ sơ người bệnh</p>
          <p className="mt-4 text-4xl font-semibold text-black">{elderlyProfiles.length}</p>
          <p className="mt-2 text-sm text-black/50">Người bệnh gắn với tài khoản.</p>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-black">Tài khoản người bệnh đã liên kết</p>
          <p className="mt-4 text-4xl font-semibold text-black">
            {elderlyProfiles.filter((elderly) => elderly.station_user_id).length}
          </p>
          <p className="mt-2 text-sm text-black/50">Người bệnh được gắn với tài khoản.</p>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-black">Đơn thuốc</p>
          <p className="mt-4 text-4xl font-semibold text-black">{prescriptions.length}</p>
          <p className="mt-2 text-sm text-black/50">Chỉ bác sĩ/y tá được tạo đơn.</p>
        </div>
      </div>

      <div className="rounded-4xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-black">Tạo hồ sơ người cao tuổi</h2>
        <p className="mt-2 text-sm text-black/50">
          Tạo hồ sơ trước, sau đó liên kết tài khoản và gửi yêu cầu bác sĩ.
        </p>

        <form action={createElderlyProfileAction} className="mt-6 grid gap-4 lg:grid-cols-2">
          <Field label="Họ tên" name="fullName" placeholder="Ví dụ: Nguyễn Văn B" />
          <Field label="Năm sinh" name="birthYear" type="number" placeholder="Ví dụ: 1945" />
          <Field label="Giới tính" name="gender" placeholder="Nam/Nữ/Khác" />
          <Field label="Địa chỉ" name="address" placeholder="Địa chỉ tại nhà" />
          <TextArea label="Bệnh nền" name="chronicConditions" placeholder="Tăng huyết áp, tiểu đường..." />
          <TextArea label="Dị ứng" name="allergies" placeholder="Dị ứng thuốc/thức ăn nếu có" />
          <div className="lg:col-span-2">
            <TextArea label="Ghi chú khẩn cấp" name="emergencyNote" placeholder="Số điện thoại khẩn cấp, lưu ý chăm sóc..." />
          </div>
          <div className="lg:col-span-2">
            <button
              type="submit"
              className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/80"
            >
              Tạo hồ sơ
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-5">
        <h2 className="text-xl font-semibold text-black">Hồ sơ đang quản lý</h2>

        {elderlyProfiles.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-black/15 bg-white p-8 text-sm text-black/50">
            Chưa có hồ sơ người cao tuổi. Hãy tạo hồ sơ đầu tiên ở form bên trên.
          </div>
        ) : null}

        {elderlyProfiles.map((elderly) => {
          const profilePrescriptions = prescriptions.filter(
            (prescription) => prescription.elderly_profile_id === elderly.id,
          );

          return (
            <article
              key={elderly.id}
              className="rounded-4xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-black">
                    {elderly.full_name}
                  </p>
                  <p className="mt-2 text-sm text-black/50">
                    {elderly.birth_year ?? "Chưa có năm sinh"} · {elderly.gender ?? "Chưa có giới tính"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/60">
                    Doctor: {elderly.assigned_doctor_name ?? "Chưa gán"}
                  </span>
                  <span className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/60">
                    Station: {elderly.station_email ?? "Chưa liên kết"}
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-black/10 p-4">
                  <h3 className="font-semibold text-black">Sửa hồ sơ</h3>

                  <form action={updateElderlyProfileAction} className="mt-4 grid gap-3">
                    <input type="hidden" name="elderlyProfileId" value={elderly.id} />
                    <Field label="Họ tên" name="fullName" defaultValue={elderly.full_name} />
                    <Field label="Năm sinh" name="birthYear" type="number" defaultValue={elderly.birth_year} />
                    <Field label="Giới tính" name="gender" defaultValue={elderly.gender} />
                    <Field label="Địa chỉ" name="address" defaultValue={elderly.address} />
                    <TextArea label="Bệnh nền" name="chronicConditions" defaultValue={elderly.chronic_conditions} />
                    <TextArea label="Dị ứng" name="allergies" defaultValue={elderly.allergies} />
                    <TextArea label="Ghi chú khẩn cấp" name="emergencyNote" defaultValue={elderly.emergency_note} />

                    <button
                      type="submit"
                      className="rounded-2xl border border-black px-4 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
                    >
                      Lưu hồ sơ
                    </button>
                  </form>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-black/10 p-4">
                    <h3 className="font-semibold text-black">Tài khoản đã liên kết</h3>
                    <p className="mt-2 text-sm text-black/50">
                      Nhập email tài khoản người bệnh. Ví dụ: station.demo@example.com
                    </p>

                    {elderly.station_email ? (
                      <div className="mt-4 rounded-xl bg-black/3 p-4">
                        <p className="text-sm font-semibold text-black">
                          Đã liên kết: {elderly.station_email}
                        </p>
                        <p className="mt-1 text-xs text-black/50">
                          Tài khoản này sẽ xem được hồ sơ và đơn thuốc của người bệnh này.
                        </p>

                        <form action={unlinkStationAction} className="mt-4">
                          <input type="hidden" name="elderlyProfileId" value={elderly.id} />
                          <button
                            type="submit"
                            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80"
                          >
                            Gỡ station
                          </button>
                        </form>
                      </div>
                    ) : (
                      <form action={linkStationAction} className="mt-4 space-y-3">
                        <input type="hidden" name="elderlyProfileId" value={elderly.id} />
                        <Field label="Email station" name="stationEmail" placeholder="station.demo@example.com" />
                        <button
                          type="submit"
                          className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-black/80"
                        >
                          Liên kết station
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="rounded-2xl border border-black/10 p-4">
                    <h3 className="font-semibold text-black">Kết nối bác sĩ</h3>

                    {elderly.assigned_doctor_name ? (
                      <p className="mt-3 rounded-xl bg-black/30 p-4 text-sm text-black/60">
                        Đã được phân công cho bác sĩ:{" "}
                        <span className="font-semibold text-black">{elderly.assigned_doctor_name}</span>
                      </p>
                    ) : (
                      <form action={requestDoctorAction} className="mt-4 space-y-3">
                        <input type="hidden" name="elderlyProfileId" value={elderly.id} />

                        <label className="block">
                          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                            Chọn bác sĩ/y tá
                          </span>
                          <select
                            name="doctorId"
                            required
                            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black"
                          >
                            <option value="">Chọn doctor</option>
                            {doctors.map((doctor) => (
                              <option key={doctor.id} value={doctor.id}>
                                {doctor.display_name}
                                {doctor.specialization ? ` · ${doctor.specialization}` : ""}
                              </option>
                            ))}
                          </select>
                        </label>

                        <TextArea
                          label="Tin nhắn gửi bác sĩ"
                          name="message"
                          placeholder="Mong bác sĩ hỗ trợ theo dõi đơn thuốc và chỉ số sức khỏe."
                        />

                        <button
                          type="submit"
                          className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-black/80"
                        >
                          Gửi yêu cầu
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 font-semibold text-black">Đơn thuốc của hồ sơ này</h3>
                <PrescriptionList prescriptions={profilePrescriptions} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}