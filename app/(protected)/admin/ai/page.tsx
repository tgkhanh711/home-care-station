import Link from "next/link";

export default function AdminAiPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          Admin AI Center
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">
          Admin AI
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
          Đây là trang AI riêng cho tài khoản admin. Trang này dùng để xem định
          hướng AI cấp hệ thống: tổng hợp rủi ro, thống kê báo cáo, kiểm tra
          cảnh báo và giám sát hoạt động toàn bộ Home Care Station.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-950 hover:text-white"
          >
            Về admin dashboard
          </Link>

          <Link
            href="/system"
            className="rounded-2xl bg-neutral-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Kiểm tra trạng thái web
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            AI Reports
          </p>
          <h2 className="mt-3 text-xl font-bold">Báo cáo toàn hệ thống</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Admin có thể xem tổng hợp báo cáo AI từ caregiver, doctor và
            station trong các cụm AI/n8n tiếp theo.
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            Risk Monitor
          </p>
          <h2 className="mt-3 text-xl font-bold">Theo dõi rủi ro</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Chuẩn bị cho phần phân tích nguy cơ quên thuốc, bỏ thuốc, chỉ số
            bất thường và cảnh báo khẩn cấp.
          </p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            n8n Ready
          </p>
          <h2 className="mt-3 text-xl font-bold">Sẵn sàng nối n8n</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Khi sang phần AI/n8n, trang này có thể gọi webhook để tạo phân tích
            cấp hệ thống.
          </p>
        </div>
      </div>
    </section>
  );
}
