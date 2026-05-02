import type {
  AiAlertEscalationReport,
  AlertEscalationProfile,
} from "@/lib/ai-alert-escalation";
import { toRequiredString, toStringArray } from "@/lib/ai-alert-escalation";
import { createClient } from "@/lib/supabase/server";

type RpcRow = Record<string, unknown>;

export async function getMyAlertEscalationProfiles(): Promise<{
  profiles: AlertEscalationProfile[];
  errorMessage?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_my_ai_alert_escalation_profiles",
  );

  if (error) {
    return {
      profiles: [],
      errorMessage: error.message,
    };
  }

  const rows = Array.isArray(data) ? (data as RpcRow[]) : [];

  return {
    profiles: rows.map((row) => ({
      id: toRequiredString(row.id, ""),
      full_name: toRequiredString(row.full_name, "Người cao tuổi"),
      relation_label: toRequiredString(
        row.relation_label,
        "Hồ sơ người cao tuổi được liên kết",
      ),
    })),
  };
}

export async function getMyAlertEscalationReports(): Promise<{
  reports: AiAlertEscalationReport[];
  errorMessage?: string;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "get_my_ai_alert_escalation_reports",
  );

  if (error) {
    return {
      reports: [],
      errorMessage: error.message,
    };
  }

  const rows = Array.isArray(data) ? (data as RpcRow[]) : [];

  return {
    reports: rows.map((row) => ({
      id: toRequiredString(row.id, ""),
      event_id: toRequiredString(row.event_id, "") || null,
      elderly_profile_id:
        toRequiredString(row.elderly_profile_id, "") || null,
      elderly_name: toRequiredString(row.elderly_name, "Không gắn hồ sơ"),
      requested_by_user_id:
        toRequiredString(row.requested_by_user_id, "") || null,
      requested_role: toRequiredString(row.requested_role, "caregiver"),
      title: toRequiredString(row.title, "Cảnh báo khẩn cấp AI"),
      severity: toRequiredString(row.severity, "high"),
      alert_source: toRequiredString(row.alert_source, "caregiver_manual"),
      suggested_urgency: toRequiredString(row.suggested_urgency, "urgent"),
      source_text: toRequiredString(row.source_text, ""),
      summary: toRequiredString(row.summary, ""),
      advice: toRequiredString(row.advice, ""),
      warning_signs: toStringArray(row.warning_signs),
      created_at: toRequiredString(row.created_at, new Date().toISOString()),
    })),
  };
}