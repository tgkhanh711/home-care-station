import Link from "next/link";

import { CarePlanForm } from "@/components/ai-care-plan/care-plan-form";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "AI Care Plans | Home Care Station",
};

type AnyRecord = Record<string, unknown>;

function textValue(record: AnyRecord, keys: string[], fallback = "Chưa có dữ liệu") {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return fallback;
}

function dateValue(value: unknown) {
  if (typeof value !== "string") {
    return "Chưa rõ thời gian";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa rõ thời gian";
  }

  return date.toLocaleString("vi-VN");
}

export default async function CarePlansPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
          Bạn cần đăng nhập để xem trang này.
        </div>
      </main>
    );
  }

  const { data: caregiver } = await supabase
    .from("caregivers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!caregiver) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Tài khoản hiện tại chưa có hồ sơ caregiver.
        </div>
      </main>
    );
  }

  const { data: profilesData } = await supabase
    .from("elderly_profiles")
    .select("*")
    .eq("caregiver_id", caregiver.id)
    .order("created_at", { ascending: false });

  const profiles = (profilesData ?? []).map((profile) => ({
    id: String(profile.id),
    full_name: String(profile.full_name ?? "Người cao tuổi"),
    birth_year:
      typeof profile.birth_year === "number" ? profile.birth_year : null,
  }));

  const profileIds = profiles.map((profile) => profile.id);

  let carePlans: AnyRecord[] = [];

  if (profileIds.length > 0) {
    const { data } = await supabase
      .from("care_plans")
      .select("*")
      .in("elderly_profile_id", profileIds)
      .order("created_at", { ascending: false })
      .limit(10);

    carePlans = data ?? [];
  }

  const profileNameById = new Map(
    profiles.map((profile) => [profile.id, profile.full_name]),
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Home Care Station
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            AI Care Plans
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Tạo kế hoạch chăm sóc từ tình huống thực tế, dữ liệu thuốc, lịch sử
            uống thuốc và chỉ số sức khỏe gần đây.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/caregiver"
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Dashboard
          </Link>
          <Link
            href="/caregiver/ai"
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            AI Care
          </Link>
          <Link
            href="/caregiver/ai-chat"
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            AI Chat
          </Link>
          <Link
            href="/caregiver/scam-shield"
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Scam Shield
          </Link>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Bạn chưa có hồ sơ người cao tuổi để tạo kế hoạch chăm sóc.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <CarePlanForm profiles={profiles} />

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-slate-950">
                Lịch sử kế hoạch gần đây
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Chỉ hiển thị 10 kế hoạch mới nhất.
              </p>
            </div>

            {carePlans.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Chưa có kế hoạch chăm sóc nào được lưu.
              </div>
            ) : (
              <div className="max-h-155 space-y-3 overflow-y-auto pr-1">
                {carePlans.map((plan) => {
                  const id = String(plan.id ?? crypto.randomUUID());
                  const elderlyProfileId = String(
                    plan.elderly_profile_id ?? "",
                  );

                  return (
                    <article
                      key={id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-slate-950">
                            {textValue(plan, [
                              "title",
                              "plan_title",
                              "name",
                              "summary",
                            ], "Kế hoạch chăm sóc")}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {profileNameById.get(elderlyProfileId) ??
                              "Hồ sơ không xác định"}{" "}
                            · {dateValue(plan.created_at)}
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          {textValue(plan, [
                            "risk_level",
                            "priority",
                            "status",
                          ], "plan")}
                        </span>
                      </div>

                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {textValue(plan, [
                          "content",
                          "plan",
                          "plan_text",
                          "recommendation",
                          "recommendations",
                          "answer",
                          "description",
                        ])}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}