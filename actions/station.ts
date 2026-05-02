"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

function cleanText(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function readText(formData: FormData, names: string[]): string {
  for (const name of names) {
    const value = cleanText(formData.get(name));

    if (value) {
      return value;
    }
  }

  return "";
}

function readOptionalText(formData: FormData, names: string[]): string | null {
  const value = readText(formData, names);
  return value ? value : null;
}

function readOptionalNumber(formData: FormData, names: string[]): number | null {
  const value = readText(formData, names);

  if (!value) {
    return null;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return numberValue;
}

function redirectWithError(error: string): never {
  redirect(`/station?error=${encodeURIComponent(error)}`);
}

function redirectWithMessage(message: string): never {
  redirect(`/station?message=${encodeURIComponent(message)}`);
}

async function createStationSupabaseClient() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: appUser, error: userError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (userError || !appUser) {
    redirect("/login");
  }

  if (String(appUser.role) !== "station") {
    redirect("/login");
  }

  return supabase;
}

function normalizeMedicationStatus(status: string) {
  const normalized = status.toLowerCase().trim();

  if (
    normalized === "taken" ||
    normalized === "da_uong" ||
    normalized === "đã uống" ||
    normalized === "da uong"
  ) {
    return "taken";
  }

  if (
    normalized === "skipped" ||
    normalized === "bo_qua" ||
    normalized === "bỏ qua" ||
    normalized === "bo qua"
  ) {
    return "skipped";
  }

  if (
    normalized === "missed" ||
    normalized === "quen_uong" ||
    normalized === "quên uống" ||
    normalized === "quen uong"
  ) {
    return "missed";
  }

  return normalized;
}

const medicationLogSchema = z.object({
  scheduleId: z.string().uuid("Thiếu ID lịch uống thuốc."),
  status: z.enum(["taken", "skipped", "missed"], {
    message: "Trạng thái uống thuốc không hợp lệ.",
  }),
  note: z.string().nullable(),
});

const vitalSignSchema = z.object({
  heartRate: z.number().int().positive().nullable(),
  spo2: z.number().int().positive().nullable(),
  temperatureC: z.number().positive().nullable(),
  systolicBp: z.number().int().positive().nullable(),
  diastolicBp: z.number().int().positive().nullable(),
  note: z.string().nullable(),
});

const sosSchema = z.object({
  note: z.string().nullable(),
});

export async function createMedicationLogAction(formData: FormData) {
  const parsed = medicationLogSchema.safeParse({
    scheduleId: readText(formData, [
      "scheduleId",
      "medicationScheduleId",
      "medication_schedule_id",
      "schedule_id",
    ]),
    status: normalizeMedicationStatus(
      readText(formData, ["status", "medicationStatus", "medication_status"]),
    ),
    note: readOptionalText(formData, ["note", "medicationNote"]),
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Dữ liệu uống thuốc không hợp lệ.");
  }

  const data = parsed.data;
  const supabase = await createStationSupabaseClient();

  const { error } = await supabase.rpc("station_record_medication_log", {
    p_schedule_id: data.scheduleId,
    p_status: data.status,
    p_note: data.note,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/station");

  if (data.status === "taken") {
    redirectWithMessage("Đã ghi nhận uống thuốc.");
  }

  if (data.status === "skipped") {
    redirectWithMessage("Đã ghi nhận bỏ qua thuốc và tạo cảnh báo.");
  }

  redirectWithMessage("Đã ghi nhận quên uống thuốc và tạo cảnh báo.");
}

export async function recordMedicationLogAction(formData: FormData) {
  return createMedicationLogAction(formData);
}

export async function recordMedicationAction(formData: FormData) {
  return createMedicationLogAction(formData);
}

export async function saveVitalSignLogAction(formData: FormData) {
  const parsed = vitalSignSchema.safeParse({
    heartRate: readOptionalNumber(formData, ["heartRate", "heart_rate"]),
    spo2: readOptionalNumber(formData, ["spo2", "spO2", "SpO2"]),
    temperatureC: readOptionalNumber(formData, [
      "temperatureC",
      "temperature",
      "temperature_c",
    ]),
    systolicBp: readOptionalNumber(formData, [
      "systolicBp",
      "systolic_bp",
      "bpSystolic",
      "bp_systolic",
    ]),
    diastolicBp: readOptionalNumber(formData, [
      "diastolicBp",
      "diastolic_bp",
      "bpDiastolic",
      "bp_diastolic",
    ]),
    note: readOptionalText(formData, ["note", "vitalNote"]),
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Dữ liệu chỉ số không hợp lệ.");
  }

  const data = parsed.data;

  const hasAnyVital =
    data.heartRate !== null ||
    data.spo2 !== null ||
    data.temperatureC !== null ||
    data.systolicBp !== null ||
    data.diastolicBp !== null;

  if (!hasAnyVital) {
    redirectWithError("Bạn cần nhập ít nhất một chỉ số sức khỏe.");
  }

  const supabase = await createStationSupabaseClient();

  const { error } = await supabase.rpc("station_create_vital_sign_log", {
    p_heart_rate: data.heartRate,
    p_spo2: data.spo2,
    p_temperature_c: data.temperatureC,
    p_systolic_bp: data.systolicBp,
    p_diastolic_bp: data.diastolicBp,
    p_note: data.note,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/station");
  redirectWithMessage("Đã lưu chỉ số sức khỏe.");
}

export async function createVitalSignLogAction(formData: FormData) {
  return saveVitalSignLogAction(formData);
}

export async function saveVitalSignsAction(formData: FormData) {
  return saveVitalSignLogAction(formData);
}

export async function saveVitalSignAction(formData: FormData) {
  return saveVitalSignLogAction(formData);
}

export async function sendSosAction(formData: FormData) {
  const parsed = sosSchema.safeParse({
    note: readOptionalText(formData, ["note", "sosNote", "emergencyNote"]),
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Dữ liệu SOS không hợp lệ.");
  }

  const supabase = await createStationSupabaseClient();

  const { error } = await supabase.rpc("station_send_sos_alert", {
    p_note: parsed.data.note,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/station");
  redirectWithMessage("Đã gửi SOS cho caregiver.");
}

export async function createSosAlertAction(formData: FormData) {
  return sendSosAction(formData);
}

export async function sendSosAlertAction(formData: FormData) {
  return sendSosAction(formData);
}