import { sendAiChatMessageAction, getAiChatPageData, type AiChatRole } from "@/actions/ai-chat";

type AiChatPageProps = {
  role: AiChatRole;
  searchParams?: Record<string, string | string[] | undefined>;
};

function getParam(
  searchParams: AiChatPageProps["searchParams"],
  key: string,
) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function getRoleLabel(role: AiChatRole) {
  if (role === "doctor") return "Bác sĩ";
  if (role === "station") return "Station";
  if (role === "admin") return "Admin";
  return "Người nhà";
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(value));
}

function getRiskLabel(risk: string | null) {
  if (!risk) return "Chưa phân loại";
  if (risk === "high") return "Rủi ro cao";
  if (risk === "medium") return "Rủi ro trung bình";
  if (risk === "low") return "Rủi ro thấp";
  return risk;
}

export async function AiChatPage({ role, searchParams }: AiChatPageProps) {
  const data = await getAiChatPageData(role);

  const status = getParam(searchParams, "status");
  const message = getParam(searchParams, "message");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      {message ? (
        <section className="rounded-3xl border border-black bg-white p-5">
          <p className="font-bold">
            {status === "error" ? "Có lỗi" : "Thành công"}
          </p>
          <p className="mt-2 text-sm">{message}</p>
        </section>
      ) : null}

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-neutral-500">
          AI Chat Assistant
        </p>

        <h1 className="mt-3 text-3xl font-black">
          Hỏi nhanh AI về chăm sóc người cao tuổi
        </h1>

        <p className="mt-3 text-sm text-neutral-700">
          {getRoleLabel(role)} có thể hỏi AI các tình huống chăm sóc, thuốc,
          triệu chứng, cảnh báo và cách xử lý ban đầu. Câu trả lời chỉ có tính
          hỗ trợ, không thay thế bác sĩ.
        </p>

        {(data.optionsError || data.logsError) ? (
          <div className="mt-4 rounded-2xl border border-black p-4 text-sm">
            {data.optionsError ? <p>Lỗi hồ sơ: {data.optionsError}</p> : null}
            {data.logsError ? <p>Lỗi lịch sử: {data.logsError}</p> : null}
          </div>
        ) : null}

        <form action={sendAiChatMessageAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="role" value={role} />

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">Chọn hồ sơ người cao tuổi</span>
            <select
              name="elderly_profile_id"
              className="rounded-2xl border px-4 py-3 outline-none"
              defaultValue={data.options[0]?.elderly_profile_id ?? ""}
            >
              <option value="">Không gắn hồ sơ cụ thể</option>
              {data.options.map((item) => (
                <option
                  key={item.elderly_profile_id}
                  value={item.elderly_profile_id}
                >
                  {item.elderly_label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold">Nội dung cần hỏi AI</span>
            <textarea
              name="message"
              rows={7}
              required
              className="rounded-2xl border px-4 py-3 outline-none"
              placeholder="Ví dụ: Hôm nay người cao tuổi quên uống thuốc buổi sáng, hơi chóng mặt và huyết áp cao hơn bình thường. Có cần báo bác sĩ không?"
            />
          </label>

          <button
            type="submit"
            className="rounded-2xl bg-black px-5 py-4 font-bold text-white"
          >
            Gửi AI Chat qua n8n
          </button>
        </form>
      </section>

      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-neutral-500">
              Lịch sử chat
            </p>
            <h2 className="mt-2 text-2xl font-black">10 câu hỏi mới nhất</h2>
          </div>

          <p className="text-sm text-neutral-600">
            Hiển thị {data.logs.length}/10 bản ghi mới nhất
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {data.logs.length === 0 ? (
            <div className="rounded-2xl border p-5 text-sm text-neutral-600">
              Chưa có lịch sử AI Chat.
            </div>
          ) : null}

          {data.logs.map((log) => (
            <article
              key={log.chat_log_id}
              className="rounded-2xl border border-black p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black">
                    {log.elderly_label}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-600">
                    Tạo: {formatDate(log.created_at)} · Trả lời:{" "}
                    {formatDate(log.answered_at)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-black px-3 py-1 text-xs font-bold">
                    {getRiskLabel(log.risk_level)}
                  </span>
                  <span className="rounded-full border px-3 py-1 text-xs">
                    {log.source}
                  </span>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-neutral-50 p-4">
                <p className="text-sm font-bold">Câu hỏi</p>
                <p className="mt-2 whitespace-pre-line text-sm">
                  {log.message}
                </p>
              </div>

              <div className="mt-4 rounded-2xl bg-neutral-50 p-4">
                <p className="text-sm font-bold">AI trả lời</p>
                <p className="mt-2 whitespace-pre-line text-sm">
                  {log.answer ?? "Đang chờ n8n trả lời..."}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}