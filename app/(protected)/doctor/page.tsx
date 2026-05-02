import {
  approveDoctorRequestAction,
  createPrescriptionAction,
  rejectDoctorRequestAction,
} from "@/actions/doctor";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type DoctorPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

type PendingRequest = {
  request_id: string;
  elderly_profile_id: string;
  elderly_name: string;
  birth_year: number | null;
  gender: string | null;
  chronic_conditions: string | null;
  caregiver_name: string;
  caregiver_phone: string | null;
  message: string | null;
  created_at: string;
};

type Patient = {
  id: string;
  full_name: string;
  birth_year: number | null;
  gender: string | null;
  address: string | null;
  chronic_conditions: string | null;
  allergies: string | null;
  emergency_note: string | null;
  caregiver_name: string;
  station_email: string | null;
  created_at: string;
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
  placeholder,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string | number;
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
  placeholder,
}: {
  label: string;
  name: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
        {label}
      </span>
      <textarea
        name={name}
        rows={3}
        placeholder={placeholder}
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
        <div key={prescription.id} className="rounded-4xl border border-black/10 bg-black/2 p-4">
          <p className="font-semibold text-black">{prescription.title}</p>
          <p className="mt-1 text-xs text-black/50">
            {prescription.start_date} · {prescription.is_active ? "Đang dùng" : "Đã tắt"}
          </p>

          {prescription.prescription_items?.map((item) => (
            <div key={item.id} className="mt-3 rounded-xl bg-white p-3">
              <p className="text-sm font-semibold text-black">
                {item.medicine_name} · {item.dose} · {item.quantity_per_time} viên/lần
              </p>
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
      ))}
    </div>
  );
}

export default async function DoctorPage({ searchParams }: DoctorPageProps) {
  const profile = await requireRole(["doctor"]);
  const params = await searchParams;
  const supabase = await createClient();

  const { data: doctor } = await supabase
    .from("doctors")
    .select("id,display_name,specialization,workplace,verified")
    .eq("user_id", profile.id)
    .single();

  const { data: pendingData } = await supabase.rpc("get_my_doctor_pending_requests");
  const pendingRequests = (pendingData ?? []) as PendingRequest[];

  const { data: patientsData } = await supabase.rpc("get_my_doctor_patients");
  const patients = (patientsData ?? []) as Patient[];
  const patientIds = patients.map((patient) => patient.id);

  const { data: prescriptionsData } =
    patientIds.length > 0
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
          .in("elderly_profile_id", patientIds)
          .order("created_at", { ascending: false })
      : { data: [] };

  const prescriptions = (prescriptionsData ?? []) as Prescription[];

  return (
    <section className="space-y-8">
      <div className="rounded-4xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-black/45">
          Doctor dashboard
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-black">
          Bác sĩ/Y tá theo dõi điều trị
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-black/60">
          Duyệt yêu cầu từ caregiver, xem bệnh nhân được phân công và tạo đơn thuốc kèm lịch uống.
        </p>
        <p className="mt-3 text-sm text-black/45">
          {doctor
            ? `${doctor.display_name} · ${doctor.specialization ?? "Chưa có chuyên khoa"} · ${doctor.verified ? "Đã xác thực" : "Chưa xác thực"}`
            : "Tài khoản này có role doctor nhưng chưa có dòng trong bảng doctors."}
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
          <p className="text-sm font-semibold text-black">Yêu cầu chờ duyệt</p>
          <p className="mt-4 text-4xl font-semibold text-black">{pendingRequests.length}</p>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-black">Bệnh nhân</p>
          <p className="mt-4 text-4xl font-semibold text-black">{patients.length}</p>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-black">Đơn thuốc</p>
          <p className="mt-4 text-4xl font-semibold text-black">{prescriptions.length}</p>
        </div>
      </div>

      <div className="rounded-4xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-black">Yêu cầu kết nối từ caregiver</h2>

        {pendingRequests.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-dashed border-black/15 p-5 text-sm text-black/50">
            Chưa có yêu cầu chờ duyệt.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {pendingRequests.map((request) => (
              <div key={request.request_id} className="rounded-2xl border border-black/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-black">{request.elderly_name}</p>
                    <p className="mt-1 text-sm text-black/50">
                      {request.birth_year ?? "Chưa có năm sinh"} · {request.gender ?? "Chưa có giới tính"}
                    </p>
                    <p className="mt-2 text-sm text-black/60">
                      Caregiver: {request.caregiver_name}
                      {request.caregiver_phone ? ` · ${request.caregiver_phone}` : ""}
                    </p>
                    {request.chronic_conditions ? (
                      <p className="mt-2 text-sm text-black/60">
                        Bệnh nền: {request.chronic_conditions}
                      </p>
                    ) : null}
                    {request.message ? (
                      <p className="mt-2 text-sm text-black/60">
                        Tin nhắn: {request.message}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <form action={approveDoctorRequestAction}>
                      <input type="hidden" name="requestId" value={request.request_id} />
                      <button
                        type="submit"
                        className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/80"
                      >
                        Duyệt
                      </button>
                    </form>

                    <form action={rejectDoctorRequestAction} className="flex gap-2">
                      <input type="hidden" name="requestId" value={request.request_id} />
                      <input
                        name="responseNote"
                        placeholder="Lý do từ chối"
                        className="w-40 rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:border-black"
                      />
                      <button
                        type="submit"
                        className="rounded-xl border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
                      >
                        Từ chối
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <h2 className="text-xl font-semibold text-black">Bệnh nhân được phân công</h2>

        {patients.length === 0 ? (
          <div className="rounded-4xl border border-dashed border-black/15 bg-white p-8 text-sm text-black/50">
            Chưa có bệnh nhân. Hãy duyệt yêu cầu từ caregiver trước.
          </div>
        ) : null}

        {patients.map((patient) => {
          const patientPrescriptions = prescriptions.filter(
            (prescription) => prescription.elderly_profile_id === patient.id,
          );

          return (
            <article key={patient.id} className="rounded-4xl border border-black/10 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-semibold tracking-tight text-black">
                    {patient.full_name}
                  </p>
                  <p className="mt-2 text-sm text-black/50">
                    {patient.birth_year ?? "Chưa có năm sinh"} · {patient.gender ?? "Chưa có giới tính"}
                  </p>
                  <p className="mt-2 text-sm text-black/60">
                    Caregiver: {patient.caregiver_name}
                  </p>
                  <p className="mt-1 text-sm text-black/60">
                    Station: {patient.station_email ?? "Chưa liên kết"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-black/10 p-4">
                  <h3 className="font-semibold text-black">Thông tin y tế</h3>
                  <div className="mt-4 space-y-2 text-sm text-black/60">
                    <p>Địa chỉ: {patient.address ?? "Chưa có"}</p>
                    <p>Bệnh nền: {patient.chronic_conditions ?? "Chưa có"}</p>
                    <p>Dị ứng: {patient.allergies ?? "Chưa có"}</p>
                    <p>Ghi chú khẩn cấp: {patient.emergency_note ?? "Chưa có"}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 p-4">
                  <h3 className="font-semibold text-black">Tạo đơn thuốc</h3>

                  <form action={createPrescriptionAction} className="mt-4 grid gap-3">
                    <input type="hidden" name="elderlyProfileId" value={patient.id} />

                    <Field label="Tên đơn thuốc" name="title" placeholder="Ví dụ: Đơn thuốc huyết áp buổi sáng" />
                    <TextArea label="Chẩn đoán" name="diagnosis" placeholder="Ví dụ: Tăng huyết áp, theo dõi SpO2..." />
                    <TextArea label="Hướng dẫn chung" name="instruction" placeholder="Ví dụ: Uống sau ăn, theo dõi chóng mặt..." />
                    <div className="rounded-2xl border border-black/10 bg-neutral-50 p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/45">
                            Danh sách thuốc
                          </p>
                          <h5 className="mt-1 text-base font-black">
                            Nhập nhiều loại thuốc trong cùng một lần tạo
                          </h5>
                        </div>
                        <p className="text-xs leading-5 text-black/55 md:max-w-xs">
                          Dòng 1 là bắt buộc. Các dòng còn lại có thể bỏ trống.
                          Mỗi dòng sẽ tạo một thuốc với liều lượng và số viên riêng.
                        </p>
                      </div>

                      <div className="mt-4 space-y-4">
                        {[1, 2, 3, 4, 5].map((index) => (
                          <div key={index} className="rounded-2xl border border-black/10 bg-white p-4">
                            <p className="mb-3 text-sm font-black">
                              Thuốc {index}{index === 1 ? " - bắt buộc" : " - tùy chọn"}
                            </p>
                            <div className="grid gap-3 md:grid-cols-[1fr_0.8fr_0.5fr]">
                              <Field
                                label="Tên thuốc"
                                name="medicineName"
                                placeholder={index === 1 ? "Ví dụ: Amlodipine" : "Có thể bỏ trống"}
                              />
                              <Field
                                label="Liều dùng"
                                name="dose"
                                placeholder={index === 1 ? "Ví dụ: 5mg" : "Ví dụ: 10mg"}
                              />
                              <Field
                                label="Số viên/lần"
                                name="quantityPerTime"
                                type="number"
                                defaultValue={1}
                              />
                            </div>
                            <div className="mt-3">
                              <TextArea
                                label="Ghi chú riêng cho thuốc này"
                                name="itemNote"
                                placeholder="Ví dụ: Uống sau ăn, không tự ý ngừng thuốc."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <TextArea
                      label="Giờ uống áp dụng cho các thuốc trên"
                      name="scheduleTimes"
                      placeholder="Nhập dạng: 08:00, 20:00 hoặc mỗi giờ một dòng"
                    />

                    <button
                      type="submit"
                      className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-black/80"
                    >
                      Tạo đơn thuốc
                    </button>
                  </form>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 font-semibold text-black">Đơn thuốc đã tạo</h3>
                <PrescriptionList prescriptions={patientPrescriptions} />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}