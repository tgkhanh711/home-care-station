"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type MedicationAdherenceReport = {
  id: string;
  event_id: string;
  elderly_profile_id: string;
  requested_by_user_id: string;
  requested_role: string;
  title: string;
  risk_level: "low" | "medium" | "high";
  adherence_score: number;
  taken_count: number;
  missed_count: number;
  skipped_count: number;
  summary: string;
  recommendations: string[];
  source_text: string;
  status: string;
  created_at: string;
};

type ElderlyProfileOption = {
  id: string;
  full_name: string | null;
};

const PAGE_PATH = "/caregiver/ai_medication_adherence";

function statusUrl(status: "success" | "error", message: string) {
  return `${PAGE_PATH}?status=${status}&message=${encodeURIComponent(message)}`;
}

export async function getMedicationAdherencePageData(): Promise<{
  elderlyProfiles: ElderlyProfileOption[];
  reports: MedicationAdherenceReport[];
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      elderlyProfiles: [],
      reports: [],
    };
  }

  const { data: elderlyProfiles } = await supabase
    .from("elderly_profiles")
    .select("id, full_name")
    .order("created_at", { ascending: false });

  const { data: reports } = await supabase
    .from("ai_medication_adherence_reports")
    .select(
      "id, event_id, elderly_profile_id, requested_by_user_id, requested_role, title, risk_level, adherence_score, taken_count, missed_count, skipped_count, summary, recommendations, source_text, status, created_at"
    )
    .eq("requested_by_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    elderlyProfiles: elderlyProfiles ?? [],
    reports: (reports ?? []) as MedicationAdherenceReport[],
  };
}

export async function createMedicationAdherenceReportAction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let targetUrl = statusUrl("error", "Không tìm thấy phiên đăng nhập.");

  if (!user) {
    redirect("/login");
  }

  try {
    const elderlyProfileId = String(formData.get("elderly_profile_id") ?? "").trim();
    const medicationNote = String(formData.get("medication_note") ?? "").trim();

    if (!elderlyProfileId) {
      targetUrl = statusUrl("error", "Bạn cần chọn hồ sơ người cao tuổi.");
    } else if (medicationNote.length < 10) {
      targetUrl = statusUrl("error", "Ghi chú dùng thuốc quá ngắn. Hãy nhập ít nhất 10 ký tự.");
    } else {
      const n8nUrl = process.env.N8N_HCS_INTAKE_WEBHOOK_URL;
      const sharedSecret = process.env.N8N_HCS_SHARED_SECRET;

      if (!n8nUrl || !sharedSecret) {
        targetUrl = statusUrl(
          "error",
          "Thiếu N8N_HCS_INTAKE_WEBHOOK_URL hoặc N8N_HCS_SHARED_SECRET trong .env.local."
        );
      } else {
        const { data: appUser } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        const requestedRole = String(appUser?.role ?? "caregiver");

        const eventId = `evt_ai_medication_adherence_${Date.now()}`;

        const payload = {
          route: "ai_medication_adherence",
          event_type: "ai_medication_adherence_requested",
          source: "caregiver_web_localhost",

          event_id: eventId,
          elderly_profile_id: elderlyProfileId,
          requested_by_user_id: user.id,
          requested_role: requestedRole,

          medication_note: medicationNote,
          content: medicationNote,

          shared_secret: sharedSecret,
          secret: sharedSecret,

          created_at: new Date().toISOString(),
        };

        const response = await fetch(n8nUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-HCS-SECRET": sharedSecret,
            "X-HCS-Shared-Secret": sharedSecret,
          },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();

        let responseJson: Record<string, unknown> | null = null;

        try {
          responseJson = responseText ? JSON.parse(responseText) : null;
        } catch {
          responseJson = null;
        }

        if (!response.ok) {
          targetUrl = statusUrl(
            "error",
            `n8n trả về lỗi HTTP ${response.status}. Kiểm tra execution mới nhất trong n8n.`
          );
        } else if (responseJson && responseJson.ok === false) {
          targetUrl = statusUrl("error", "n8n đã chạy nhưng trả về ok=false.");
        } else {
          targetUrl = statusUrl(
            "success",
            "Đã gửi phân tích tuân thủ dùng thuốc sang n8n và lưu báo cáo."
          );
        }
      }
    }
  } catch (error) {
    console.error("createMedicationAdherenceReportAction error:", error);

    targetUrl = statusUrl(
      "error",
      "Có lỗi khi gửi dữ liệu sang n8n. Hãy kiểm tra terminal Next.js và execution n8n."
    );
  }

  revalidatePath(PAGE_PATH);
  redirect(targetUrl);
}