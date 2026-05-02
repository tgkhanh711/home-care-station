import Link from "next/link";
import { redirect } from "next/navigation";

import { createHcsAiIntakeEventAction } from "@/actions/ai-intake";
import { hcsAiEventTypes } from "@/lib/ai/intake-types";
import { createClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  status?: string;
  message?: string;
}>;

type PageProps = {
  searchParams?: SearchParams;
};

type ElderlyProfileOption = {
  id: string;
  display_name: string;
};

function formatTime(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "processed"
      ? "Đã xử lý"
      : status === "dispatched"
        ? "Đã gửi"
        : status === "failed"
          ? "Lỗi"
          : "Đã tạo";

  return (
    <span className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-800">
      {label}
    </span>
  );
}

function N8nBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">
      n8n: {status || "not_sent"}
    </span>
  );
}

export default async function AdminAiIntakePage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = typeof userRow?.role === "string" ? userRow.role : "";

  if (role !== "admin") {
    redirect(role ? `/${role}` : "/login");
  }

  const { data: profiles } = await supabase.rpc(
    "get_hcs_ai_accessible_elderly_profiles",
  );

  const { data: events } = await supabase
    .from("ai_intake_events")
    .select(
      "id,event_id,event_type,source,elderly_profile_id,payload,status,n8n_status,n8n_response,error_message,created_at,dispatched_at,processed_at",
    )
    .order("created_at", { ascending: false })
    .limit(15);

  const webhookReady = Boolean(process.env.N8N_HCS_INTAKE_WEBHOOK_URL);
  const secretReady = Boolean(process.env.N8N_HCS_SHARED_SECRET);
  const message = params.message ? decodeURIComponent(params.message) : "";

  const defaultPayload = JSON.stringify(
    {
      message: "Test event từ Admin AI Intake Router",
      priority: "normal",
      client_time: new Date().toISOString(),
    },
    null,
    2,
  );

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 md:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-3xl border border-zinc-300 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-600">
                Home Care Station
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                AI Intake Router
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-700">
                Đây là cổng vào trung tâm cho toàn bộ workflow AI/n8n. Mọi event
                như scam report, nhắc thuốc, xác thực thuốc, chỉ số sức khỏe,
                SOS và lệnh thiết bị sẽ đi qua chuẩn này.
              </p>
            </div>

            <Link
              href="/admin"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-950 hover:text-white"
            >
              Quay lại Admin
            </Link>
          </div>
        </section>

        {params.status ? (
          <section
            className={`rounded-3xl border p-4 text-sm ${
              params.status === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-red-300 bg-red-50 text-red-800"
            }`}
          >
            {message ||
              (params.status === "success" ? "Thành công." : "Có lỗi xảy ra.")}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-300 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Trạng thái kết nối</h2>

            <div className="mt-5 grid gap-3">
              <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-4">
                <span className="text-sm text-zinc-700">Webhook URL</span>
                <span className="text-sm font-medium">
                  {webhookReady ? "Đã cấu hình" : "Thiếu"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-4">
                <span className="text-sm text-zinc-700">Shared secret</span>
                <span className="text-sm font-medium">
                  {secretReady ? "Đã cấu hình" : "Thiếu"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-zinc-50 p-4">
                <span className="text-sm text-zinc-700">Bảng log</span>
                <span className="text-sm font-medium">ai_intake_events</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-300 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Event chuẩn của hệ thống</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {hcsAiEventTypes.map((eventType) => (
                <span
                  key={eventType}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700"
                >
                  {eventType}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-300 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">
              Gửi event kiểm tra vào n8n
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-700">
              Đây là công cụ admin dùng lại đến Cụm 10 để kiểm tra, replay và
              debug workflow AI.
            </p>
          </div>

          <form action={createHcsAiIntakeEventAction} className="mt-6 grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-800">
                  Loại event
                </span>
                <select
                  name="event_type"
                  defaultValue="test_event"
                  className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                >
                  {hcsAiEventTypes.map((eventType) => (
                    <option key={eventType} value={eventType}>
                      {eventType}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-800">
                  Hồ sơ người cao tuổi
                </span>
                <select
                  name="elderly_profile_id"
                  className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                >
                  <option value="">Không gắn hồ sơ cụ thể</option>
                  {((profiles ?? []) as ElderlyProfileOption[]).map(
                    (profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.display_name}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800">Ghi chú</span>
              <input
                name="note"
                placeholder="Ví dụ: Kiểm tra Intake Router lần đầu"
                className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
              />
            </label>

            <div className="grid gap-3">

            <button
              type="submit"
              style={{
                display: "inline-flex",
                width: "fit-content",
                minWidth: "180px",
                minHeight: "48px",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "9999px",
                border: "1px solid #09090b",
                backgroundColor: "#09090b",
                color: "#ffffff",
                padding: "12px 24px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Gửi test event
            </button>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800">
                Payload JSON
              </span>
              <textarea
                name="payload"
                rows={7}
                defaultValue={defaultPayload}
                className="rounded-2xl border border-zinc-300 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-zinc-950"
              />
            </label>
          </form>
        </section>

        <section className="rounded-3xl border border-zinc-300 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold">15 event mới nhất</h2>
            <p className="mt-2 text-sm text-zinc-700">
              Dùng để kiểm tra web đã gửi event chưa và n8n đã xử lý chưa.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            {(events ?? []).length === 0 ? (
              <div className="rounded-2xl bg-zinc-50 p-5 text-sm text-zinc-700">
                Chưa có event nào.
              </div>
            ) : (
              (events ?? []).map((event) => (
                <article
                  key={event.id}
                  className="rounded-3xl border border-zinc-300 bg-zinc-50 p-5"
                >
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{event.event_type}</h3>
                        <StatusBadge status={event.status} />
                        <N8nBadge status={event.n8n_status} />
                      </div>

                      <p className="mt-2 break-all text-xs text-zinc-600">
                        event_id: {event.event_id}
                      </p>

                      <p className="mt-1 text-xs text-zinc-600">
                        source: {event.source}
                      </p>
                    </div>

                    <div className="text-left text-xs text-zinc-600 md:text-right">
                      <p>Tạo: {formatTime(event.created_at)}</p>
                      <p>Gửi: {formatTime(event.dispatched_at)}</p>
                      <p>Xử lý: {formatTime(event.processed_at)}</p>
                    </div>
                  </div>

                  {event.error_message ? (
                    <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
                      {event.error_message}
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="min-w-0">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                        Payload
                      </p>
                      <pre className="max-h-64 min-w-0 overflow-auto whitespace-pre-wrap wrap-break-word rounded-2xl bg-white p-4 text-xs text-zinc-800">
                        {JSON.stringify(event.payload ?? {}, null, 2)}
                      </pre>
                    </div>

                    <div className="min-w-0">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                        n8n response
                      </p>
                      <pre className="max-h-64 min-w-0 overflow-auto whitespace-pre-wrap wrap-break-word rounded-2xl bg-white p-4 text-xs text-zinc-800">
                        {JSON.stringify(event.n8n_response ?? {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}