"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin"; 
import { revalidatePath } from "next/cache";

// 1. Lấy lịch thuốc của ngày hôm nay (Dành cho Caregiver/Doctor)
export async function getTodaySchedules(elderlyProfileId: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  
  const vnDateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }); 
  const startOfDayUTC = new Date(`${vnDateStr}T00:00:00+07:00`).toISOString();
  const endOfDayUTC = new Date(`${vnDateStr}T23:59:59.999+07:00`).toISOString();

  const { data, error } = await supabaseAdmin
    .from("medication_schedules")
    .select(`
      *,
      prescription_items (
        *,
        medicine:medicines (*)
      )
    `)
    .eq("elderly_profile_id", elderlyProfileId)
    .gte("scheduled_at", startOfDayUTC)
    .lte("scheduled_at", endOfDayUTC)
    .order("scheduled_at", { ascending: true });

  if (error) console.error("Error fetching today schedules:", error.message);
  return { data, error };
}

// 2. Lấy lịch thuốc TỚI HẠN tiếp theo (Dành cho Trạm Station)
export async function getNextStationSchedule(elderlyProfileId: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("medication_schedules")
    .select(`
      *,
      prescription_items (
        *,
        medicine:medicines (*)
      )
    `)
    .eq("elderly_profile_id", elderlyProfileId)
    .eq("status", "pending")
    .gte("time_window_end", now)
    .order("scheduled_at", { ascending: true })
    .limit(1)
    .single();

  return { data, error };
}

// 3. LOGIC CỤM 9: Ghi nhận bệnh nhân ĐÃ UỐNG THUỐC
export async function markScheduleAsTaken(scheduleId: string) {
  const supabaseAdmin = createSupabaseAdminClient();

  const { error } = await supabaseAdmin
    .from("medication_schedules")
    .update({
      status: "taken",
      metadata: { taken_at: new Date().toISOString() } // Ghi nhận thời gian uống thực tế
    })
    .eq("id", scheduleId);

  if (error) {
    console.error("Lỗi cập nhật trạng thái uống thuốc:", error.message);
    return { success: false, error: error.message };
  }

  // Xóa cache ép toàn hệ thống F5 lại số liệu
  revalidatePath("/station");
  revalidatePath("/caregiver");
  revalidatePath("/doctor");

  return { success: true };
}