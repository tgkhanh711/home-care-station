import {
  Activity,
  Bell,
  CheckCircle2,
  HeartPulse,
  LogOut,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import { logoutAction } from "@/app/auth/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const protectedRoutes = [
  {
    href: "/admin",
    title: "/admin",
    description: "Protected route",
  },
  {
    href: "/doctor",
    title: "/doctor",
    description: "Protected route",
  },
  {
    href: "/caregiver",
    title: "/caregiver",
    description: "Protected route",
  },
];

type RoleDashboardPreviewProps = {
  role: string;
  activeHref: string;
  userEmail: string;
  title: string;
  description: string;
};

export function RoleDashboardPreview({
  role,
  activeHref,
  userEmail,
  title,
  description,
}: RoleDashboardPreviewProps) {
  return (
    <Card className="mt-8 overflow-hidden border-slate-200/80 bg-white/90 shadow-xl shadow-blue-500/5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
      <CardHeader className="border-b border-slate-200/80 bg-linear-to-r from-sky-50 via-cyan-50/80 to-white px-5 py-4 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
              <Stethoscope className="size-5 shrink-0 text-blue-600" />
              <span>{title}</span>
            </CardTitle>

            <CardDescription className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {description}
            </CardDescription>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Badge
                variant="outline"
                className="rounded-full border-slate-300 bg-white/80 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
              >
                Role: {role}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full border-slate-300 bg-white/80 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
              >
                Route: {activeHref}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full border-slate-300 bg-white/80 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
              >
                User: {userEmail}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <form action={logoutAction}>
              <Button type="submit" variant="outline" size="sm">
                <LogOut className="mr-2 size-4" />
                Đăng xuất
              </Button>
            </form>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 bg-white/80 p-5 dark:bg-slate-950/40">
        <Alert className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
          <Bell className="size-4" />
          <AlertTitle>Luồng bảo mật đã bật</AlertTitle>
          <AlertDescription>
            Người chưa đăng nhập sẽ bị chặn khỏi các route dashboard. Người
            đăng nhập sai role sẽ bị redirect về dashboard đúng role.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-3">
          {protectedRoutes.map((route) => (
            <Card
              key={route.href}
              className="border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
            >
              <CardHeader className="space-y-3 p-4">
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
                  <Activity className="size-4" />
                </div>

                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {route.title}
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs">
                    {route.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100">
          <CheckCircle2 className="size-4" />
          <AlertTitle>Auth + RLS profile lookup đã sẵn sàng cho cụm dashboard.</AlertTitle>
        </Alert>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <HeartPulse className="size-4" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Caregiver
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
              Quản lý hồ sơ người cao tuổi, lịch thuốc, cảnh báo và báo cáo AI.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <ShieldCheck className="size-4" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Doctor
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
              Xem dữ liệu được phân quyền, theo dõi tình trạng và hỗ trợ y tế.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300">
              <Stethoscope className="size-4" />
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              Station
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-400">
              Giao diện dành cho thiết bị/trạm, tách khỏi dashboard web thường.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RoleDashboardPreview;