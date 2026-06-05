"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function submitVitalSigns(elderlyProfileId: string, vitals: {
  heart_rate?: number;
  blood_pressure_sys?: number;
  blood_pressure_dia?: number;
  spo2?: number;
  temperature?: number;
}) {
  const supabaseAdmin = createSupabaseAdminClient();
  
  const { error } = await supabaseAdmin.from("vital_sign_logs").insert({
    elderly_profile_id: elderlyProfileId,
    heart_rate: vitals.heart_rate || null,
    blood_pressure_sys: vitals.blood_pressure_sys || null,
    blood_pressure_dia: vitals.blood_pressure_dia || null,
    spo2: vitals.spo2 || null,
    temperature: vitals.temperature || null,
    source: "doctor_input" 
  });

  if (error) {
    console.error("Lỗi lưu chỉ số sinh tồn:", error.message);
    return { success: false, error: error.message };
  }

  // Quét sạch toàn bộ cache của toàn hệ thống
  revalidatePath("/", "layout");
  return { success: true };
}

export async function getLatestVitals(elderlyProfileId: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("vital_sign_logs")
    .select("*")
    .eq("elderly_profile_id", elderlyProfileId)
    .order("measured_at", { ascending: false })
    .limit(1)
    .single(); 

  if (error && error.code !== 'PGRST116') { 
    console.error("Lỗi lấy chỉ số sinh tồn:", error.message);
    return { data: null, error };
  }
  return { data, error: null };
}

// 🟢 MỚI THÊM: Lấy lịch sử đo đạc để xem Xu hướng
export async function getVitalsHistory(elderlyProfileId: string, limit: number = 5) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("vital_sign_logs")
    .select("*")
    .eq("elderly_profile_id", elderlyProfileId)
    .order("measured_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Lỗi lấy lịch sử sinh tồn:", error.message);
    return { data: [], error };
  }
  return { data, error: null };
}