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

function cleanPositiveInteger(value: FormDataEntryValue | null) {
  const text = cleanString(value);

  if (!text) {
    return 1;
  }

  const numberValue = Number(text);

  if (!Number.isInteger(numberValue) || numberValue < 1) {
    return 1;
  }

  return numberValue;
}

function redirectWithError(message: string): never {
  redirect(`/doctor?error=${encodeURIComponent(message)}`);
}

function redirectWithMessage(message: string): never {
  redirect(`/doctor?message=${encodeURIComponent(message)}`);
}

const medicineItemSchema = z.object({
  medicineName: z.string().min(2, "Tên thuốc phải có ít nhất 2 ký tự."),
  dose: z.string().min(1, "Cần nhập liều dùng."),
  quantityPerTime: z.number().int().min(1),
  itemNote: z.string().nullable(),
});

const prescriptionSchema = z.object({
  elderlyProfileId: z.string().uuid("Thiếu hồ sơ bệnh nhân."),
  title: z.string().min(2, "Tên đơn thuốc phải có ít nhất 2 ký tự."),
  diagnosis: z.string().nullable(),
  instruction: z.string().nullable(),
  scheduleTimes: z.array(z.string()).min(1, "Cần nhập ít nhất một giờ uống."),
  medicines: z.array(medicineItemSchema).min(1, "Cần nhập ít nhất một loại thuốc."),
});

function getMedicineItems(formData: FormData) {
  const names = formData.getAll("medicineName");
  const doses = formData.getAll("dose");
  const quantities = formData.getAll("quantityPerTime");
  const notes = formData.getAll("itemNote");
  const maxLength = Math.max(names.length, doses.length, quantities.length, notes.length);
  const medicines: Array<z.infer<typeof medicineItemSchema>> = [];

  for (let index = 0; index < maxLength; index += 1) {
    const medicineName = cleanString(names[index] ?? null);
    const dose = cleanString(doses[index] ?? null);
    const itemNote = cleanOptionalString(notes[index] ?? null);
    const quantityPerTime = cleanPositiveInteger(quantities[index] ?? null);
    const rowHasAnyValue = Boolean(medicineName || dose || itemNote);

    if (!rowHasAnyValue) {
      continue;
    }

    medicines.push({
      medicineName,
      dose,
      quantityPerTime,
      itemNote,
    });
  }

  return medicines;
}

export async function approveDoctorRequestAction(formData: FormData) {
  await requireRole(["doctor"]);

  const requestId = cleanString(formData.get("requestId"));

  if (!requestId) {
    redirectWithError("Thiếu ID yêu cầu.");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("doctor_approve_elderly_request", {
    p_request_id: requestId,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/doctor");
  revalidatePath("/caregiver");
  redirectWithMessage("Đã duyệt yêu cầu kết nối.");
}

export async function rejectDoctorRequestAction(formData: FormData) {
  await requireRole(["doctor"]);

  const requestId = cleanString(formData.get("requestId"));
  const responseNote = cleanOptionalString(formData.get("responseNote"));

  if (!requestId) {
    redirectWithError("Thiếu ID yêu cầu.");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("doctor_reject_elderly_request", {
    p_request_id: requestId,
    p_response_note: responseNote,
  });

  if (error) {
    redirectWithError(error.message);
  }

  revalidatePath("/doctor");
  revalidatePath("/caregiver");
  redirectWithMessage("Đã từ chối yêu cầu kết nối.");
}

export async function createPrescriptionAction(formData: FormData) {
  await requireRole(["doctor"]);

  const rawTimes = cleanString(formData.get("scheduleTimes"))
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const parsed = prescriptionSchema.safeParse({
    elderlyProfileId: cleanString(formData.get("elderlyProfileId")),
    title: cleanString(formData.get("title")),
    diagnosis: cleanOptionalString(formData.get("diagnosis")),
    instruction: cleanOptionalString(formData.get("instruction")),
    scheduleTimes: rawTimes,
    medicines: getMedicineItems(formData),
  });

  if (!parsed.success) {
    redirectWithError(parsed.error.issues[0]?.message ?? "Dữ liệu đơn thuốc không hợp lệ.");
  }

  const data = parsed.data;
  const supabase = await createClient();

  for (const medicine of data.medicines) {
    const { error } = await supabase.rpc("create_doctor_prescription", {
      p_elderly_profile_id: data.elderlyProfileId,
      p_title: data.medicines.length > 1 ? `${data.title} - ${medicine.medicineName}` : data.title,
      p_diagnosis: data.diagnosis,
      p_instruction: data.instruction,
      p_medicine_name: medicine.medicineName,
      p_dose: medicine.dose,
      p_quantity_per_time: medicine.quantityPerTime,
      p_schedule_times: data.scheduleTimes,
      p_item_note: medicine.itemNote,
    });

    if (error) {
      redirectWithError(error.message);
    }
  }

  revalidatePath("/doctor");
  revalidatePath("/caregiver");
  revalidatePath("/station");
  redirectWithMessage(`Đã tạo đơn thuốc cho ${data.medicines.length} loại thuốc.`);
}
