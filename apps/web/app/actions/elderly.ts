"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache"; // MỚI: Import lệnh xóa cache

export async function getElderlyProfiles() {
  const supabase = await createSupabaseServerClient();
  const { data: profiles, error } = await supabase
    .from("elderly_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) console.error("Error fetching elderly profiles:", error.message);
  return { data: profiles, error: null };
}

export async function getElderlyProfileById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("elderly_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) console.error(`Error fetching profile ${id}:`, error.message);
  return { data: profile, error: null };
}

export async function updateElderlyProfileDoctor(id: string, payload: { care_status: string; medical_conditions: string[]; allergies: string[]; notes: string }) {
  const supabase = await createSupabaseServerClient();
  
  // FIX: Thêm .select() để bắt lỗi âm thầm của RLS
  const { data, error } = await supabase
    .from("elderly_profiles")
    .update({
      care_status: payload.care_status,
      medical_conditions: payload.medical_conditions,
      allergies: payload.allergies,
      notes: payload.notes,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select();

  if (error) return { success: false, error: error.message };
  
  // Nếu data rỗng nghĩa là RLS đã chặn lệnh Update
  if (!data || data.length === 0) {
    return { success: false, error: "Lỗi phân quyền DB: Bạn chưa chạy lệnh SQL cấp quyền UPDATE." };
  }
  
  revalidatePath('/doctor', 'layout');
  revalidatePath('/caregiver', 'layout');

  return { success: true, error: null };
}

export async function updateElderlyProfileCaregiver(id: string, payload: { address?: string | null; emergency_contact_name?: string | null; emergency_contact_phone?: string | null }) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("elderly_profiles")
    .update({
      address: payload.address,
      emergency_contact_name: payload.emergency_contact_name,
      emergency_contact_phone: payload.emergency_contact_phone,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  
  // Xóa cache cho trang caregiver
  revalidatePath('/caregiver', 'layout');
  
  return { success: true, error: null };
}

export async function searchElderlyProfiles(searchQuery: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profiles, error } = await supabaseAdmin
    .from("elderly_profiles")
    .select("*")
    .ilike("full_name", `${searchQuery}%`)
    .limit(10);
  
  if (error) return { data: [], error: error.message };
  if (!profiles || profiles.length === 0) return { data: [], error: null };

  const caregiverIds = profiles.map(p => p.caregiver_id).filter(Boolean);
  let caregivers: Array<{ id: string; full_name: string | null; phone: string | null }> = [];
  
  if (caregiverIds.length > 0) {
    const { data: cgData } = await supabaseAdmin
      .from("users")
      .select("id, full_name, phone")
      .in("id", caregiverIds);
    caregivers = cgData || [];
  }

  let linkedIds: string[] = [];
  if (user) {
    const profileIds = profiles.map(p => p.id);
    const { data: links } = await supabaseAdmin
      .from("doctor_elderly_links")
      .select("elderly_profile_id")
      .eq("doctor_id", user.id)
      .in("elderly_profile_id", profileIds);
      
    linkedIds = links?.map(l => l.elderly_profile_id) || [];
  }

  const results = profiles.map(p => {
    const cg = caregivers.find(c => c.id === p.caregiver_id);
    return {
      ...p,
      caregiver_name: cg?.full_name || "Chưa có",
      caregiver_phone: cg?.phone || "Không có SĐT",
      is_linked: linkedIds.includes(p.id) 
    };
  });

  return { data: results, error: null };
}

export async function linkDoctorToElderly(elderlyProfileId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) return { success: false, error: "Xác thực thất bại." };

  const { data: existingLink } = await supabase
    .from("doctor_elderly_links")
    .select("id")
    .eq("doctor_id", user.id)
    .eq("elderly_profile_id", elderlyProfileId)
    .single();

  if (existingLink) return { success: false, error: "Bệnh nhân này đã nằm trong danh sách của bạn." };

  const supabaseAdmin = createSupabaseAdminClient();
  const { error: linkError } = await supabaseAdmin
    .from("doctor_elderly_links")
    .insert({
      doctor_id: user.id,
      elderly_profile_id: elderlyProfileId,
      is_primary: true
    });
  
  if (linkError) return { success: false, error: "Lỗi tạo liên kết: " + linkError.message };

  const { data: docData } = await supabaseAdmin.from("users").select("full_name").eq("id", user.id).single();
  const { data: eldData } = await supabaseAdmin.from("elderly_profiles").select("full_name").eq("id", elderlyProfileId).single();

  const doctorName = docData?.full_name || "Một Bác sĩ";
  const elderlyName = eldData?.full_name || "người thân";

  await supabaseAdmin.from("alerts").insert({
    elderly_profile_id: elderlyProfileId,
    type: "system_notification",
    severity: "info",
    title: "Liên kết Bác sĩ thành công",
    message: `Bác sĩ ${doctorName} đã tiếp nhận và bắt đầu theo dõi hồ sơ y tế của ${elderlyName}.`,
    status: "pending",
    source: "system",
    created_by: user.id
  });

  revalidatePath('/doctor', 'layout'); // FIX: Cập nhật lại UI dashboard sau khi link thành công

  return { success: true, error: null };
}