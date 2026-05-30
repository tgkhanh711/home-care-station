import { StationVoiceButton } from "@/components/station/station-voice-button";

const mainMessage =
  "Đã đến giờ uống thuốc. Vui lòng bấm nút Đã sẵn sàng để tiếp tục.";

export default function StationDashboardPage() {
  return (
    <main className="min-h-screen bg-yellow-100 p-4 text-black">
      <section className="mx-auto flex min-h-[calc(100vh-32px)] max-w-5xl flex-col justify-between rounded-[40px] border-8 border-black bg-white p-6 shadow-[0_12px_0_#000]">
        <header className="rounded-4xl border-4 border-black bg-yellow-300 p-6 text-center">
          <p className="text-3xl font-black uppercase tracking-wide">
            Home Care Station
          </p>
          <h1 className="mt-4 text-5xl font-black leading-tight lg:text-7xl">
            GIỜ UỐNG THUỐC
          </h1>
        </header>

        <form action="/logout" method="post">
          <button
            type="submit"
            className="h-11 rounded-2xl bg-blue-500 px-4 text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-400"
          >
                  Đăng xuất
                </button>
              </form>

        <section className="my-8 flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-8 grid size-32 place-items-center rounded-full border-8 border-black bg-blue-200 text-7xl">
            💊
          </div>

          <p className="max-w-4xl text-4xl font-black leading-tight lg:text-6xl">
            {mainMessage}
          </p>

          <p className="mt-8 rounded-[28px] border-4 border-black bg-white px-6 py-4 text-3xl font-black">
            Không cần kéo hoặc vuốt. Chỉ bấm nút lớn bên dưới.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          <button
            type="button"
            className="rounded-4xl border-4 border-black bg-emerald-300 px-8 py-8 text-4xl font-black text-black shadow-[0_8px_0_#000] active:translate-y-1 active:shadow-[0_4px_0_#000]"
          >
            ✅ ĐÃ SẴN SÀNG
          </button>

          <button
            type="button"
            className="rounded-4xl border-4 border-black bg-blue-300 px-8 py-8 text-4xl font-black text-black shadow-[0_8px_0_#000] active:translate-y-1 active:shadow-[0_4px_0_#000]"
          >
            📞 GỌI NGƯỜI NHÀ
          </button>

          <StationVoiceButton text={mainMessage} />
        </section>
      </section>
    </main>
  );
}