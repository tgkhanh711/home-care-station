export type HcsRole = "admin" | "doctor" | "caregiver" | "station";

export type HcsIntakeSource =
  | "admin_web"
  | "doctor_web"
  | "caregiver_web"
  | "station_web";

export type HcsSeverity = "info" | "warning" | "critical" | "emergency";

export type HcsIntakeEvent = {
  event_id: string;
  event_type: string;
  source: HcsIntakeSource;
  role: HcsRole;
  user_id?: string;
  elderly_profile_id?: string;
  caregiver_id?: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type HcsAiAction = {
  type: string;
  label: string;
  payload: Record<string, unknown>;
};

export type HcsAiOutput = {
  ok: boolean;
  intent: string;
  severity: HcsSeverity;
  answer: string;
  actions: HcsAiAction[];
  created_records: string[];
  requires_human_confirmation: boolean;
};

export type IntakeParseResult =
  | {
      ok: true;
      event: HcsIntakeEvent;
    }
  | {
      ok: false;
      error: string;
    };

const ROLE_SET = new Set<HcsRole>(["admin", "doctor", "caregiver", "station"]);

const SOURCE_SET = new Set<HcsIntakeSource>([
  "admin_web",
  "doctor_web",
  "caregiver_web",
  "station_web",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function readRecord(
  record: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const value = record[key];
  return isRecord(value) ? value : {};
}

function createEventId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function isHcsRole(value: string): value is HcsRole {
  return ROLE_SET.has(value as HcsRole);
}

export function isHcsIntakeSource(value: string): value is HcsIntakeSource {
  return SOURCE_SET.has(value as HcsIntakeSource);
}

export function normalizeIntakeEvent(input: unknown): IntakeParseResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      error: "Payload phải là object.",
    };
  }

  const eventType = readString(input, "event_type");
  const rawSource = readString(input, "source");
  const rawRole = readString(input, "role");

  if (!eventType) {
    return {
      ok: false,
      error: "Thiếu event_type.",
    };
  }

  if (!rawSource || !isHcsIntakeSource(rawSource)) {
    return {
      ok: false,
      error: "source không hợp lệ.",
    };
  }

  if (!rawRole || !isHcsRole(rawRole)) {
    return {
      ok: false,
      error: "role không hợp lệ.",
    };
  }

  return {
    ok: true,
    event: {
      event_id: readString(input, "event_id") ?? createEventId(),
      event_type: eventType,
      source: rawSource,
      role: rawRole,
      user_id: readString(input, "user_id"),
      elderly_profile_id: readString(input, "elderly_profile_id"),
      caregiver_id: readString(input, "caregiver_id"),
      payload: readRecord(input, "payload"),
      created_at: readString(input, "created_at") ?? new Date().toISOString(),
    },
  };
}