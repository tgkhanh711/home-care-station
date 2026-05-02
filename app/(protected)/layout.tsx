import Link from "next/link";
import { redirect } from "next/navigation";

import { logoutAction } from "@/actions/auth";
import {
  MobileProtectedNavigation,
  ProtectedNavigation,
  type ProtectedNavItem,
} from "@/components/protected-navigation";
import { createClient } from "@/lib/supabase/server";

type AppRole = "admin" | "caregiver" | "doctor" | "station";

type NavUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
};

type NavItem = ProtectedNavItem;

const navByRole: Record<AppRole, NavItem[]> = {
  admin: [
    {
      label: "Admin",
      href: "/admin",
      description: "Quản trị người dùng, bác sĩ, caregiver và station.",
    },
    {
      label: "AI",
      href: "/admin/ai",
      description: "Trung tâm AI dành riêng cho admin.",
    },
    {
      label: "AI Intake",
      href: "/admin/ai-intake",
      description: "AI Intake để quản lý dữ liệu đầu vào cho AI.",
    },
  ],
  caregiver: [
    {
      label: "Hồ sơ",
      href: "/caregiver",
      description: "Quản lý người cao tuổi, bác sĩ và station.",
    },
    {
      label: "Theo dõi",
      href: "/caregiver/monitor",
      description: "Theo dõi thuốc, chỉ số sức khỏe và cảnh báo.",
    },
    {
      label: "AI",
      href: "/caregiver/ai",
      description: "AI hỗ trợ phân tích chăm sóc người cao tuổi.",
    },
    {
      href: "/caregiver/scam-shield",
      label: "Scam Shield",
      description: "Bảo vệ trước các mối đe dọa lừa đảo.",
    },
    {
      href: "/caregiver/ai-chat",
      label: "AI Chat",
      description: "Trò chuyện với AI để được tư vấn chăm sóc người cao tuổi.",
    },
    {
      label: "Care plans",
      href: "/caregiver/care-plans",
      description: "Tạo và quản lý kế hoạch chăm sóc cho người cao tuổi.",
    },
    {
      label: "Health risk",
      href: "/caregiver/ai-health-risk",
      description: "Gửi tình trạng sức khỏe của người già sang n8n để được đánh giá nguy cơ.",
    },
    {
      label: "Medication adherence",
      href: "/caregiver/ai_medication_adherence",
      description: "Gửi tình trạng uống thuốc của người già sang n8n để được phân tích.",
    },
    {
      label: "Medication check",
      href: "/caregiver/ai_medication_check",
      description: "Gửi thông tin thuốc dự kiến và quan sát được sang n8n để được phân tích đúng/sai/chưa chắc chắn.",
    },
    {
      label: "Cảnh báo AI",
      href: "/caregiver/ai_alert_escalation",
      description: "Gửi tình huống nguy hiểm của người già sang n8n để được phân loại mức độ và lưu lịch sử cảnh báo.",
    },
    {
      label: "Daily summary",
      href: "/caregiver/ai_daily_summary",
      description: "Nhận bản tóm tắt hàng ngày về tình trạng và hoạt động của người cao tuổi.",
    }
  ],
  doctor: [
    {
      label: "Bác sĩ",
      href: "/doctor",
      description: "Quản lý yêu cầu, bệnh nhân và đơn thuốc.",
    },
    {
      label: "Theo dõi",
      href: "/doctor/monitor",
      description: "Theo dõi tuân thủ thuốc, chỉ số và cảnh báo.",
    },
    {
      label: "AI",
      href: "/doctor/ai",
      description: "AI hỗ trợ bác sĩ phân tích hồ sơ bệnh nhân.",
    },
    {
      href: "/doctor/ai-chat",
      label: "AI Chat",
      description: "Trò chuyện với AI để được tư vấn chăm sóc người cao tuổi.",
    },
    {
      href: "/doctor/ai_alert_escalation",
      label: "Cảnh báo AI",
      description: "Xem cảnh báo AI liên quan đến bệnh nhân đã liên kết. Trang này chỉ đọc, không tạo cảnh báo mới.",
    },
    {
      label: "Daily summary",
      href: "/doctor/ai_daily_summary",
      description: "Nhận bản tóm tắt hàng ngày về tình trạng và hoạt động của bệnh nhân.",
    }
  ],
  station: [
    {
      label: "Station",
      href: "/station",
      description: "Màn hình thiết bị tại nhà cho người cao tuổi.",
    },
    {
      label: "AI",
      href: "/station/ai",
      description: "AI hỗ trợ station phân tích thuốc và cảnh báo.",
    },
    {
      href: "/station/scam-shield",
      label: "Cảnh báo scam",
      description: "Bảo vệ trước các mối đe dọa lừa đảo.",
    },
    {
      href: "/station/ai-chat",
      label: "AI Chat",
      description: "Trò chuyện với AI để được tư vấn chăm sóc người cao tuổi.",
    },
    {
      href: "/station/ai_daily_summary",
      label: "Daily summary",
      description: "Nhận bản tóm tắt hàng ngày về tình trạng và hoạt động của người cao tuổi.",
    }
  ],
};

const homeByRole: Record<AppRole, string> = {
  admin: "/admin",
  caregiver: "/caregiver",
  doctor: "/doctor",
  station: "/station",
};

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase.rpc("get_current_nav_user");
  const navUser = data as NavUser | null;

  if (!navUser?.role) {
    redirect("/login");
  }

  const navItems = navByRole[navUser.role] ?? [];
  const homeHref = homeByRole[navUser.role] ?? "/login";

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4 px-6 py-3 sm:px-8 lg:px-10">
          <Link href={homeHref} className="group shrink-0">
            <div className="text-sm font-semibold uppercase tracking-[0.26em] text-neutral-950">
              Home Care Station
            </div>
            <div className="mt-0.5 text-xs text-neutral-500">
              {navUser.full_name ?? navUser.email ?? "Người dùng"}
            </div>
          </Link>

          <ProtectedNavigation items={navItems} />

          <form action={logoutAction} className="shrink-0">
            <button
              type="submit"
              className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-950 hover:text-white"
            >
              Đăng xuất
            </button>
          </form>
        </div>

        <MobileProtectedNavigation items={navItems} />
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}