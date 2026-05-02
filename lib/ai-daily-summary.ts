export type AiDailySummaryProfile = {
  elderly_profile_id: string;
  elderly_name: string;
};

export type AiDailySummaryReport = {
  id: string;

  report_id?: string | null;
  daily_summary_id?: string | null;

  elderly_profile_id: string | null;
  elderly_name: string;

  created_by: string | null;
  requested_by_user_id?: string | null;
  requested_by_role: string;
  role?: string | null;

  summary_type: string;
  input_context: string;
  manual_note?: string | null;

  status: "pending" | "completed" | "failed" | string;
  risk_level: "low" | "medium" | "high" | "critical" | string;

  /**
   * Các field frontend cũ từng dùng.
   */
  ai_summary?: string | null;
  care_priorities?: unknown;
  follow_up_actions?: unknown;
  raw_result?: unknown;

  /**
   * Các field thật đang có trong bảng public.ai_daily_summaries.
   */
  summary_title?: string | null;
  summary_text?: string | null;
  key_points?: unknown;
  recommendations?: unknown;
  warning_signs?: unknown;
  n8n_raw?: unknown;

  n8n_execution_id: string | null;

  created_at: string;
  updated_at: string;
};

export type AiDailySummaryActionResult = {
  ok: boolean;
  message: string;
  error?: string;
};