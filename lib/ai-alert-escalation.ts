export type AlertEscalationProfile = {
  id: string;
  full_name: string;
  relation_label: string;
};

export type AiAlertEscalationReport = {
  id: string;
  event_id: string | null;
  elderly_profile_id: string | null;
  elderly_name: string;
  requested_by_user_id: string | null;
  requested_role: string;
  title: string;
  severity: string;
  alert_source: string;
  suggested_urgency: string;
  source_text: string;
  summary: string;
  advice: string;
  warning_signs: string[];
  created_at: string;
};

export type AlertEscalationActionState = {
  status: "idle" | "success" | "error";
  message: string;
  result?: {
    severity?: string;
    summary?: string;
    advice?: string;
  };
};

export const initialAlertEscalationState: AlertEscalationActionState = {
  status: "idle",
  message: "",
};

export function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export function toRequiredString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : fallback;
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(trimmed);

      if (Array.isArray(parsed)) {
        return parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    } catch {
      return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export function normalizeAlertSeverity(value: unknown): string {
  const raw =
    typeof value === "string" ? value.trim().toLowerCase() : "";

  if (
    raw.includes("critical") ||
    raw.includes("emergency") ||
    raw.includes("khẩn") ||
    raw.includes("cap cuu") ||
    raw.includes("cấp cứu")
  ) {
    return "critical";
  }

  if (
    raw.includes("high") ||
    raw.includes("urgent") ||
    raw.includes("cao") ||
    raw.includes("nguy")
  ) {
    return "high";
  }

  if (raw.includes("medium") || raw.includes("trung")) {
    return "medium";
  }

  if (raw.includes("low") || raw.includes("thấp")) {
    return "low";
  }

  return "high";
}