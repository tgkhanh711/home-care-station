export const hcsAiEventTypes = [
  "scam_report_submitted",
  "medication_due",
  "medication_taken",
  "pill_image_uploaded",
  "vital_sign_submitted",
  "sos_pressed",
  "device_heartbeat",
  "device_command_result",
  "test_event",
] as const;

export type HcsAiEventType = (typeof hcsAiEventTypes)[number];

export type HcsAiEventSource =
  | "web_admin"
  | "web_caregiver"
  | "web_doctor"
  | "web_station"
  | "station_device"
  | "n8n"
  | "system";

export type HcsAiIntakePayload = {
  event_id: string;
  event_type: HcsAiEventType;
  source: HcsAiEventSource | string;
  actor_user_id: string | null;
  elderly_profile_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export function isHcsAiEventType(value: string): value is HcsAiEventType {
  return hcsAiEventTypes.includes(value as HcsAiEventType);
}

export function getSourceFromRole(role: string | null | undefined): HcsAiEventSource {
  if (role === "admin") return "web_admin";
  if (role === "caregiver") return "web_caregiver";
  if (role === "doctor") return "web_doctor";
  if (role === "station") return "web_station";

  return "system";
}