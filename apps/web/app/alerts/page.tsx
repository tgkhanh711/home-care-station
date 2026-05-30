import { RoleDashboardPreview } from "@/components/dashboard/role-dashboard-preview";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export default async function AlertsPage() {
  const user = await requireRole(["admin", "doctor", "caregiver"]);

  return (
    <RoleDashboardPreview
      role={user.role}
      activeHref="/alerts"
      userEmail={user.email}
      title="Trung tâm cảnh báo"
      description="Alert stream sẽ hiển thị cấp cứu đỏ, cảnh báo cam, missed medication, CV mismatch và SOS escalation."
    />
  );
}