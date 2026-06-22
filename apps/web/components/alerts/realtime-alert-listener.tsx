"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export function RealtimeAlertListener({ elderlyProfileId }: { elderlyProfileId: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!elderlyProfileId) return;

    // Khởi tạo Supabase client ở phía trình duyệt
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel("realtime-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
          filter: `elderly_profile_id=eq.${elderlyProfileId}`,
        },
        () => {
          // Báo cho Next.js biết cần fetch lại dữ liệu Server Component
          // Không cần biến payload nên đã xóa đi để tránh cảnh báo vàng
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [elderlyProfileId, router]);

  return null;
}