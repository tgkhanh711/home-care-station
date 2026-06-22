import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopHeader } from "@/components/layout/app-top-header";
import type { AppRole } from "@/lib/constants";

type DashboardShellProps = {
  role: AppRole;
  activeHref: string;
  userEmail?: string;
  children: React.ReactNode;
};

export function DashboardShell({
  role,
  activeHref,
  userEmail,
  children
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppTopHeader role={role} userEmail={userEmail} />
      <div className="flex flex-1">
        <AppSidebar role={role} activeHref={activeHref} />
        <main className="min-w-0 flex-1 p-4 lg:p-6 pb-24">
          {children}
        </main>
      </div>

    </div>
  );
}