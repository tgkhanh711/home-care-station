import { RoleDashboardPreview } from "@/components/dashboard/role-dashboard-preview";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireRole(["admin", "doctor", "caregiver"]);

  return (
    <RoleDashboardPreview
      role={user.role}
      activeHref="/settings"
      userEmail={user.email}
      title="Cài đặt hệ thống"
      description="Cài đặt hồ sơ, thiết bị, notification, AI/n8n secret và tùy chọn giao diện sẽ được triển khai theo từng cụm."
    />
  );
}