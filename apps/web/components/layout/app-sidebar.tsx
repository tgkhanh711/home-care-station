import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Bot,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Pill,
  Settings,
  ShieldCheck,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/constants";

type NavigationItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  roles: AppRole[];
};

const navigationItems: NavigationItem[] = [
  {
    href: "/admin",
    label: "Tổng quan",
    icon: LayoutDashboard,
    roles: ["admin"]
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    roles: ["admin"]
  },
  {
    href: "/admin/audit",
    label: "Audit logs",
    icon: ShieldCheck,
    roles: ["admin"],
    badge: "SEC"
  },
  {
    href: "/doctor",
    label: "Bệnh nhân",
    icon: ClipboardList,
    roles: ["doctor"]
  },
  {
    href: "/doctor/vitals",
    label: "Chỉ số sống",
    icon: Activity,
    roles: ["doctor"],
    badge: "24H"
  },
  {
    href: "/caregiver",
    label: "Tổng quan",
    icon: LayoutDashboard,
    roles: ["caregiver"]
  },
  {
    href: "/caregiver/medications",
    label: "Lịch thuốc",
    icon: Pill,
    roles: ["caregiver"]
  },
  {
    href: "/caregiver/calendar",
    label: "Lịch chăm sóc",
    icon: CalendarClock,
    roles: ["caregiver"]
  },
  {
    href: "/alerts",
    label: "Cảnh báo",
    icon: AlertTriangle,
    roles: ["admin", "doctor", "caregiver"],
    badge: "ALERT"
  },
  {
    href: "/assistant",
    label: "AI Assistant",
    icon: Bot,
    roles: ["admin", "doctor", "caregiver"],
    badge: "AI"
  },
  {
    href: "/settings",
    label: "Cài đặt",
    icon: Settings,
    roles: ["admin", "doctor", "caregiver"]
  }
];

type AppSidebarProps = {
  role: AppRole;
  activeHref: string;
};

export function AppSidebar({ role, activeHref }: AppSidebarProps) {
  const items = navigationItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/50 p-4 lg:block">
      <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Điều hướng
      </div>

      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeHref === item.href;

          return (
            <Link
              key={`${role}-${item.href}`}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.badge ? (
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className="h-5 px-1.5 text-[10px]"
                >
                  {item.badge}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}