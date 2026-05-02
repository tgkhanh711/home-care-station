"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

function cleanString(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function cleanOptionalString(value: FormDataEntryValue | null) {
  const text = cleanString(value);
  return text.length > 0 ? text : null;
}

function cleanOptionalNumber(value: FormDataEntryValue | null) {
  const text = cleanString(value);

  if (!text) {
    return null;
  }

  const numberValue = Number(text);

  if (Number.isNaN(numberValue)) {
    return null;
  }

  return numberValue;
}

function redirectWithError(message: string): never {
  redirect(`/caregiver?error=${encodeURIComponent(message)}`);
}

function redirectWithMessage(message: string): never {
  redirect(`/caregiver?message=${encodeURIComponent(message)}`);
}

const elderlySchema = z.object({
  fullName: z.string().min(2, "Tên người cao tuổi phải có ít nhất 2 ký tự."),
  birthYear: z.number().int().min(1900).max(2100).nullable(),
  gender: z.string().nullable(),
  address: z.string().nullable(),
  chronicConditions: z.string().nullable(),
  allergies: z.string().nullable(),
  emergencyNote: z.string().nullable(),
});

export async function createElderlyProfileAction(formData: FormData) {
  await requireRole(["caregiver"]);

  const parsed = elderlySchema.safeParse({
    fullName: cleanString(formData.get("fullName")),
    birthYear: cleanOptionalNumber(formData.get("birthYear")),
    gender: cleanOptionalString(formData.get("gender")),
    address: cleanOptionalString(formData.get("address")),
    chronicConditions: cleanOptionalString(formData.get("chronicConditions")),
    allergies: cleanOptionalString(formData.get("allergies")),
    emergencyNote: cleanOptionalString(formData.get("emergencyNote")),
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Dữ liệu hồ sơ không hợp lệ.");
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.rpc("create_elderly_profile", {
    p_full_name: data.fullName,
    p_birth_year: data.birthYear,
    p_gender: data.gender,
    p_address: data.address,
    p_chronic_conditions: data.chronicConditions,
    p_allergies: data.allergies,
    p_emergency_note: data.emergencyNote,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/caregiver");
  redirectWithMessage("Đã tạo hồ sơ người cao tuổi.");
}

export async function updateElderlyProfileAction(formData: FormData) {
  await requireRole(["caregiver"]);

  const elderlyProfileId = cleanString(formData.get("elderlyProfileId"));

  if (!elderlyProfileId) {
    redirectWithError("Thiếu ID hồ sơ cần sửa.");
  }

  const parsed = elderlySchema.safeParse({
    fullName: cleanString(formData.get("fullName")),
    birthYear: cleanOptionalNumber(formData.get("birthYear")),
    gender: cleanOptionalString(formData.get("gender")),
    address: cleanOptionalString(formData.get("address")),
    chronicConditions: cleanOptionalString(formData.get("chronicConditions")),
    allergies: cleanOptionalString(formData.get("allergies")),
    emergencyNote: cleanOptionalString(formData.get("emergencyNote")),
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Dữ liệu hồ sơ không hợp lệ.");
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.rpc("update_elderly_profile", {
    p_elderly_profile_id: elderlyProfileId,
    p_full_name: data.fullName,
    p_birth_year: data.birthYear,
    p_gender: data.gender,
    p_address: data.address,
    p_chronic_conditions: data.chronicConditions,
    p_allergies: data.allergies,
    p_emergency_note: data.emergencyNote,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/caregiver");
  redirectWithMessage("Đã cập nhật hồ sơ.");
}

export async function linkStationAction(formData: FormData) {
  await requireRole(["caregiver"]);

  const elderlyProfileId = cleanString(formData.get("elderlyProfileId"));
  const stationEmail = cleanString(formData.get("stationEmail"));

  if (!elderlyProfileId || !stationEmail) {
    redirectWithError("Cần nhập đủ hồ sơ và email station.");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("link_station_to_elderly", {
    p_elderly_profile_id: elderlyProfileId,
    p_station_email: stationEmail,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/caregiver");
  revalidatePath("/station");
  redirectWithMessage("Đã liên kết station với hồ sơ người cao tuổi.");
}

export async function unlinkStationAction(formData: FormData) {
  await requireRole(["caregiver"]);

  const elderlyProfileId = cleanString(formData.get("elderlyProfileId"));

  if (!elderlyProfileId) {
    redirectWithError("Thiếu ID hồ sơ cần gỡ station.");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("unlink_station_from_elderly", {
    p_elderly_profile_id: elderlyProfileId,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/caregiver");
  revalidatePath("/station");
  redirectWithMessage("Đã gỡ liên kết station.");
}

export async function requestDoctorAction(formData: FormData) {
  await requireRole(["caregiver"]);

  const elderlyProfileId = cleanString(formData.get("elderlyProfileId"));
  const doctorId = cleanString(formData.get("doctorId"));
  const message = cleanOptionalString(formData.get("message"));

  if (!elderlyProfileId || !doctorId) {
    redirectWithError("Cần chọn hồ sơ và bác sĩ.");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("request_doctor_for_elderly", {
    p_elderly_profile_id: elderlyProfileId,
    p_doctor_id: doctorId,
    p_message: message,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/caregiver");
  revalidatePath("/doctor");
  redirectWithMessage("Đã gửi yêu cầu kết nối bác sĩ.");
}