"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// 1. Lấy danh sách thuốc có sẵn
export async function getMedicines() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("medicines")
    .select("*")
    .order("name", { ascending: true });

  if (error) console.error("Error fetching medicines:", error.message);
  return { data, error };
}

// 2. Lấy danh sách đơn thuốc của bệnh nhân (ĐÃ FIX: Bọc Admin Client)
export async function getPatientPrescriptions(elderlyProfileId: string) {
  // Dùng Admin Client để Người nhà có đặc quyền đọc được tên Bác sĩ (vượt rào RLS bảng users)
  const supabaseAdmin = (await import("@/lib/supabase/admin")).createSupabaseAdminClient();
  
  const { data, error } = await supabaseAdmin
    .from("prescriptions")
    .select(`
      *,
      doctor:doctor_id(full_name),
      prescription_items (
        *,
        medicine:medicine_id (name, dosage_form, strength)
      )
    `)
    .eq("elderly_profile_id", elderlyProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Error fetching prescriptions for ${elderlyProfileId}:`, error.message);
    return { data: [], error };
  }

  return { data, error: null };
}

// 3. Tạo đơn thuốc và chi tiết thuốc (ĐÃ GIĂNG BẪY BẮT LỖI)
export async function createPrescription(payload: {
  elderly_profile_id: string;
  diagnosis: string;
  notes?: string;
  start_date: string;
  end_date?: string;
  items: Array<{
    medicine_name: string; 
    dosage: string;
    frequency: string;
    time_slots: string[];
    instructions?: string;
  }>;
}) {
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = (await import("@/lib/supabase/admin")).createSupabaseAdminClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { success: false, error: "Xác thực thất bại." };

  const { data: prescription, error: pError } = await supabaseAdmin
    .from("prescriptions")
    .insert({
      elderly_profile_id: payload.elderly_profile_id,
      doctor_id: user.id,
      diagnosis: payload.diagnosis,
      notes: payload.notes || null,
      start_date: payload.start_date,
      end_date: payload.end_date || null,
      status: "active"
    })
    .select("id")
    .single();

  if (pError || !prescription) return { success: false, error: "Không thể tạo đơn thuốc." };

  const itemsToInsert = [];
  for (const item of payload.items) {
    let medId = "";
    const { data: existingMed } = await supabaseAdmin.from("medicines").select("id").ilike("name", item.medicine_name).limit(1).single();

    if (existingMed) {
      medId = existingMed.id;
    } else {
      const { data: newMed } = await supabaseAdmin.from("medicines").insert({ name: item.medicine_name, high_risk: false }).select("id").single();
      if (newMed) medId = newMed.id;
    }

    if (medId) {
      itemsToInsert.push({
        prescription_id: prescription.id,
        medicine_id: medId,
        dosage: item.dosage,
        frequency: item.frequency,
        instructions: item.instructions || null,
        route: "Uống",
        time_slots: item.time_slots.filter(t => t.trim() !== ""),
        metadata: {}
      });
    }
  }

  const { data: insertedItems, error: itemsError } = await supabaseAdmin
    .from("prescription_items")
    .insert(itemsToInsert)
    .select();
    
  if (itemsError || !insertedItems || insertedItems.length === 0) {
    return { success: false, error: "Không thể lưu danh sách thuốc." };
  }

  // ==========================================
  // LOGIC SINH LỊCH (Đọc trực tiếp từ payload gốc)
  // ==========================================
  const schedulesToInsert = [];
  const start = new Date(payload.start_date);
  const end = payload.end_date ? new Date(payload.end_date) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const daysToGenerate = Math.min(diffDays + 1, 30); 

  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateString = currentDate.toISOString().split('T')[0];

    // Dùng vòng lặp Index để khớp chính xác data
    for (let itemIndex = 0; itemIndex < insertedItems.length; itemIndex++) {
      const dbItem = insertedItems[itemIndex];
      // Lấy danh sách giờ uống trực tiếp từ Form để không bao giờ bị lỗi mảng
      const slots = payload.items[itemIndex].time_slots || [];
      
      for (const time of slots) {
        if (!time) continue;
        const cleanTime = String(time).substring(0, 5); 
        const scheduledAtStr = `${dateString}T${cleanTime}:00+07:00`;
        const scheduledAt = new Date(scheduledAtStr);

        if (isNaN(scheduledAt.getTime())) continue; 

        const windowStart = new Date(scheduledAt.getTime() - 30 * 60 * 1000).toISOString();
        const windowEnd = new Date(scheduledAt.getTime() + 60 * 60 * 1000).toISOString();

        schedulesToInsert.push({
          elderly_profile_id: payload.elderly_profile_id,
          prescription_item_id: dbItem.id, // ID chi tiết thuốc
          scheduled_at: scheduledAt.toISOString(),
          time_window_start: windowStart,
          time_window_end: windowEnd,
          dosage_text: dbItem.dosage,
          status: 'pending',
          metadata: {}
        });
      }
    }
  }

  if (schedulesToInsert.length > 0) {
    const { error: scheduleError } = await supabaseAdmin.from("medication_schedules").insert(schedulesToInsert);
    // TRẢ THẲNG LỖI VỀ GIAO DIỆN ĐỂ BẮT TẬN TAY
    if (scheduleError) {
      return { success: false, error: "Database từ chối tạo Lịch: " + scheduleError.message };
    }
  } else {
    return { success: false, error: "Lỗi: Không tìm thấy khung giờ nào để tạo lịch uống thuốc!" };
  }

  await supabaseAdmin.from("audit_logs").insert({
    action: "CREATE_PRESCRIPTION",
    actor_user_id: user.id,
    elderly_profile_id: payload.elderly_profile_id,
    entity_table: "prescriptions",
    entity_id: prescription.id,
    metadata: { items_count: itemsToInsert.length }
  });

  revalidatePath('/doctor/prescriptions');
  revalidatePath('/caregiver/prescriptions');
  revalidatePath('/caregiver'); 
  revalidatePath('/station'); 

  return { success: true, error: null };
}
// 4. Xóa đơn thuốc
export async function deletePrescription(prescriptionId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Xác thực thất bại." };

  await supabase.from("audit_logs").insert({
    action: "DELETE_PRESCRIPTION",
    actor_user_id: user.id,
    entity_table: "prescriptions",
    entity_id: prescriptionId,
    metadata: { note: "Bác sĩ hủy y lệnh" }
  });

  const { error: itemsError } = await supabase
    .from("prescription_items")
    .delete()
    .eq("prescription_id", prescriptionId);

  if (itemsError) return { success: false, error: "Lỗi dọn dẹp thuốc: " + itemsError.message };

  const { data, error } = await supabase
    .from("prescriptions")
    .delete()
    .eq("id", prescriptionId)
    .select();

  if (error) return { success: false, error: error.message };
  
  if (!data || data.length === 0) {
    return { success: false, error: "Lỗi phân quyền DB: Bạn chưa chạy lệnh SQL cấp quyền DELETE." };
  }

  revalidatePath('/doctor/prescriptions', 'layout');
  revalidatePath('/caregiver/prescriptions', 'layout');
  
  return { success: true };
}