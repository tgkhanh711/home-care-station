import { RoleDashboardPreview } from "@/components/dashboard/role-dashboard-preview";
import { requireRole } from "@/lib/auth/require-role";

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  const user = await requireRole(["admin", "doctor", "caregiver"]);

  return (
    <RoleDashboardPreview
      role={user.role}
      activeHref="/assistant"
      userEmail={user.email}
      title="AI Assistant trung tâm"
      description="Khung AI sẽ gom Scam Shield, Daily Report, Vital Risk, Alert Escalation và Intake Router trong các cụm AI/n8n sau."
    />
  );
}