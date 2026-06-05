"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// Hàm 1: Trạm thiết bị bấm nút SOS
export async function triggerSOS(elderlyProfileId: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  
  const { error } = await supabaseAdmin.from("alerts").insert({
    elderly_profile_id: elderlyProfileId,
    type: "sos",
    severity: "emergency",
    title: "CẢNH BÁO KHẨN CẤP (SOS)",
    message: "Người bệnh đã nhấn nút GỌI NGƯỜI NHÀ từ Trạm thiết bị. Cần hỗ trợ ngay lập tức!",
    status: "pending"
  });

  if (error) {
    console.error("Lỗi tạo SOS:", error.message);
    return { success: false, error: error.message };
  }

  // Xóa cache ép toàn hệ thống cập nhật lập tức
  revalidatePath("/station");
  revalidatePath("/caregiver");
  revalidatePath("/doctor");
  return { success: true };
}

// Hàm 2: Lấy cảnh báo hiển thị lên Dashboard Người nhà/Bác sĩ
export async function getActiveAlerts(elderlyProfileId: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("alerts")
    .select("*")
    .eq("elderly_profile_id", elderlyProfileId)
    .in("status", ["pending", "acknowledged"]) // Chỉ lấy cảnh báo chưa được giải quyết
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Lỗi lấy alerts:", error.message);
    return { data: [], error };
  }
  return { data, error: null };
}

// Hàm 3 (MỚI THÊM): Xử lý đóng cảnh báo (Dành cho Caregiver/Doctor)
export async function updateAlertStatus(alertId: string, status: "acknowledged" | "resolved") {
  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin
    .from("alerts")
    .update({ status })
    .eq("id", alertId);

  if (error) return { success: false, error: error.message };

  // Xóa cache ép toàn hệ thống đồng bộ
  revalidatePath("/station");
  revalidatePath("/caregiver");
  revalidatePath("/doctor");
  return { success: true };
}