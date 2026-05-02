import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type AppRole = "admin" | "caregiver" | "doctor" | "station";

type NavUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
};

const homeByRole: Record<AppRole, string> = {
  admin: "/admin",
  caregiver: "/caregiver",
  doctor: "/doctor",
  station: "/station",
};

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data } = await supabase.rpc("get_current_nav_user");
    const navUser = data as NavUser | null;

    if (navUser?.role) {
      redirect(homeByRole[navUser.role]);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-950 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm md:p-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
              Home Care Station
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-tight md:text-7xl">
              Trạm chăm sóc sức khỏe tại nhà
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-700">
              Hệ thống hỗ trợ người cao tuổi uống thuốc đúng lịch, theo dõi chỉ
              số sức khỏe, gửi cảnh báo cho người nhà và bác sĩ, đồng thời chuẩn
              bị tích hợp AI/n8n và phần cứng trong các cụm tiếp theo.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-2xl bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Đăng nhập
              </Link>

              <Link
                href="/register"
                className="rounded-2xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-950 hover:text-white"
              >
                Đăng ký caregiver
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
                Caregiver
              </p>
              <h2 className="mt-3 text-2xl font-bold">Theo dõi tại nhà</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Quản lý hồ sơ người cao tuổi, theo dõi thuốc, chỉ số và cảnh
                báo.
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
                Doctor
              </p>
              <h2 className="mt-3 text-2xl font-bold">Giám sát y tế</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Quản lý bệnh nhân, đơn thuốc, lịch uống thuốc và báo cáo AI.
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
                Station
              </p>
              <h2 className="mt-3 text-2xl font-bold">Thiết bị tại nhà</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Màn hình cho người cao tuổi, chuẩn bị kết nối phần cứng và AI
                nhận diện.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}