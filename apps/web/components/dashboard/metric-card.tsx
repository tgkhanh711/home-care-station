type MetricTone = "blue" | "green" | "orange" | "red" | "slate";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  tone?: MetricTone;
};

const TONE_CLASS: Record<MetricTone, string> = {
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  green: "border-emerald-100 bg-emerald-50 text-emerald-700",
  orange: "border-orange-100 bg-orange-50 text-orange-700",
  red: "border-red-100 bg-red-50 text-red-700",
  slate: "border-slate-200 bg-slate-50 text-slate-700",
};

export function MetricCard({
  label,
  value,
  detail,
  tone = "blue",
}: MetricCardProps) {
  return (
    <article className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
      <div
        className={[
          "mb-4 inline-flex rounded-2xl border px-3 py-1 text-xs font-bold",
          TONE_CLASS[tone],
        ].join(" ")}
      >
        {label}
      </div>
      <p className="text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{detail}</p>
    </article>
  );
}