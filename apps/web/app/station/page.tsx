import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { StationVoiceButton } from "@/components/station/station-voice-button";
import { getNextStationSchedule, markScheduleAsTaken } from "@/app/actions/schedules";
import { triggerSOS, getActiveAlerts } from "@/app/actions/alerts"; 

export default async function StationDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let nextSchedule = null;
  let hasEmergency = false; 

  if (user) {
    let { data: existingProfile } = await supabase
      .from("elderly_profiles")
      .select("id, full_name")
      .eq("station_user_id", user.id)
      .single();

    if (!existingProfile) {
      const supabaseAdmin = createSupabaseAdminClient();
      const { data: unlinkedProfile } = await supabaseAdmin
        .from("elderly_profiles")
        .select("id, full_name")
        .is("station_user_id", null)
        .limit(1)
        .single();

      if (unlinkedProfile) {
        await supabaseAdmin
          .from("elderly_profiles")
          .update({ station_user_id: user.id })
          .eq("id", unlinkedProfile.id);
        existingProfile = unlinkedProfile;
      }
    }

    profile = existingProfile;

    if (profile) {
      const { data: activeAlerts } = await getActiveAlerts(profile.id);
      if (activeAlerts && activeAlerts.length > 0) {
        hasEmergency = true;
      } else {
        const res = await getNextStationSchedule(profile.id);
        nextSchedule = res.data;
      }
    }
  }

  let mainMessage = "Chưa có lịch uống thuốc sắp tới.";
  let isTimeToTake = false; 

  if (hasEmergency) {
    mainMessage = "Đã gửi cảnh báo khẩn cấp. Vui lòng giữ bình tĩnh, người nhà sẽ liên hệ ngay.";
  } else if (nextSchedule) {
    const timeStr = new Date(nextSchedule.scheduled_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });
    const firstItem = Array.isArray(nextSchedule.prescription_items)
      ? nextSchedule.prescription_items[0]
      : nextSchedule.prescription_items;
    const medName = firstItem?.medicine?.name || "Thuốc không rõ";
    
    const now = new Date();
    const windowStart = new Date(nextSchedule.time_window_start);
    const windowEnd = new Date(nextSchedule.time_window_end);

    if (now >= windowStart && now <= windowEnd) {
      mainMessage = `Đã đến giờ uống thuốc lúc ${timeStr}. Vui lòng uống: ${medName}, số lượng ${nextSchedule.dosage_text}.`;
      isTimeToTake = true;
    } else {
      mainMessage = `Lịch uống thuốc tiếp theo: ${timeStr}. Thuốc: ${medName}. Vui lòng đợi đến giờ.`;
      isTimeToTake = false;
    }
  } else if (!profile) {
    mainMessage = "Đang chờ liên kết với hồ sơ người bệnh (Vui lòng tạo hồ sơ trước).";
  }

  let bgClass = "bg-yellow-100";
  let headerClass = "bg-yellow-300";
  let iconBgClass = "bg-slate-200";
  let titleText = "TRẠM CHỜ";
  let iconText = "⏳";

  if (hasEmergency) {
    bgClass = "bg-red-600 text-white animate-pulse";
    headerClass = "bg-red-800 border-red-950 text-white";
    iconBgClass = "bg-red-500 border-red-900";
    titleText = "SOS - KHẨN CẤP";
    iconText = "🚨";
  } else if (isTimeToTake) {
    bgClass = "bg-emerald-100";
    headerClass = "bg-emerald-300";
    iconBgClass = "bg-emerald-200";
    titleText = "GIỜ UỐNG THUỐC";
    iconText = "💊";
  }

  return (
    <main className={`min-h-screen p-4 text-black transition-colors duration-500 ${bgClass}`}>
      <section className={`mx-auto flex min-h-[calc(100vh-32px)] max-w-5xl flex-col justify-between rounded-[40px] border-8 border-black p-6 shadow-[0_12px_0_#000] ${hasEmergency ? 'bg-red-700' : 'bg-white'}`}>
        <header className={`rounded-4xl border-4 p-6 text-center flex flex-col items-center justify-center relative ${headerClass} ${hasEmergency ? 'border-red-950' : 'border-black'}`}>
          <p className={`text-2xl font-black uppercase tracking-wide ${hasEmergency ? 'text-red-200' : 'text-slate-800'}`}>
            Trạm thiết bị của: <span className={hasEmergency ? 'text-white' : 'text-blue-700'}>{profile?.full_name || "Chưa xác định"}</span>
          </p>
          <h1 className="mt-4 text-5xl font-black leading-tight lg:text-7xl">
            {titleText}
          </h1>

          <form action="/logout" method="post" className="absolute right-6 top-6">
            <button type="submit" className="h-11 rounded-2xl bg-blue-500 px-6 text-sm font-black text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-400">
              Đăng xuất Trạm
            </button>
          </form>

        </header>

        <section className={`my-8 flex flex-1 flex-col items-center justify-center text-center ${hasEmergency ? 'text-white' : ''}`}>
          <div className={`mb-8 grid size-32 place-items-center rounded-full border-8 text-7xl ${iconBgClass} ${hasEmergency ? 'border-red-950' : 'border-black'}`}>
            {iconText}
          </div>

          <p className="max-w-4xl text-4xl font-black leading-tight lg:text-6xl">
            {mainMessage}
          </p>

          <p className={`mt-8 rounded-[28px] border-4 px-6 py-4 text-3xl font-black ${hasEmergency ? 'border-red-950 bg-red-900 text-white' : 'border-black bg-white text-black'}`}>
            Không cần kéo hoặc vuốt. Chỉ bấm nút lớn bên dưới.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          
          {!hasEmergency && isTimeToTake && nextSchedule ? (
            <form action={async () => {
              "use server";
              await markScheduleAsTaken(nextSchedule.id);
            }} className="h-full w-full">
              <button
                type="submit"
                className="h-full w-full rounded-4xl border-4 border-black bg-emerald-300 px-8 py-8 text-4xl font-black text-black shadow-[0_8px_0_#000] active:translate-y-1 active:shadow-[0_4px_0_#000]"
              >
                ✅ ĐÃ SẴN SÀNG
              </button>
            </form>
          ) : (
            <button
              type="button"
              disabled
              className={`rounded-4xl border-4 px-8 py-8 text-4xl font-black shadow-[0_8px_0_#000] opacity-50 ${hasEmergency ? 'border-red-950 bg-red-900 text-white' : 'border-black bg-slate-300 text-black'}`}
            >
              ✅ ĐÃ SẴN SÀNG
            </button>
          )}

          <form action={async () => {
            "use server";
            if (profile?.id) await triggerSOS(profile.id);
          }}>
            <button type="submit" disabled={hasEmergency} className={`h-full w-full rounded-4xl border-4 px-8 py-8 text-4xl font-black shadow-[0_8px_0_#000] active:translate-y-1 active:shadow-[0_4px_0_#000] ${hasEmergency ? 'border-red-950 bg-red-900 text-white opacity-50' : 'border-black bg-blue-300 text-black'}`}>
              📞 GỌI NGƯỜI NHÀ
            </button>
          </form>

          <StationVoiceButton text={mainMessage} />
        </section>
      </section>
    </main>
  );
}