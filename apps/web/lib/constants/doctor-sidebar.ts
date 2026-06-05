import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ClipboardList,
  ShieldAlert,
  UsersRound,
} from "lucide-react";

export type SidebarItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
};

export const doctorSidebarItems: SidebarItem[] = [
  { href: "/doctor", label: "Bệnh nhân", description: "Danh sách đang theo dõi", icon: UsersRound },
  { href: "/doctor/prescriptions", label: "Đơn thuốc", description: "Quản lý y lệnh", icon: ClipboardList },
  { href: "/doctor/vitals", label: "Chỉ số sống", description: "HR, BP, SpO2", icon: Activity, badge: "24H" },
  { href: "/doctor/alerts", label: "Cảnh báo", description: "Đỏ / cam cần xử lý", icon: ShieldAlert, badge: "3" },
];
