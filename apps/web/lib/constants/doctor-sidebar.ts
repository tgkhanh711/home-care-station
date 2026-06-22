import type { LucideIcon } from "lucide-react";
import {
  Bot,
  ClipboardList,
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
  { href: "/doctor/aibot", label: "Trợ lý AI", description: "HR, BP, SpO2", icon: Bot },
];
