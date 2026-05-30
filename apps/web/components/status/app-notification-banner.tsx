import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/lib/constants";

type AppNotificationBannerProps = {
  severity: AlertSeverity;
  title: string;
  message: string;
};

const severityClassName: Record<AlertSeverity, string> = {
  info: "border-primary/20 bg-primary/10 text-primary",
  warning: "border-warning/30 bg-warning/20 text-warning-foreground",
  critical: "border-destructive/30 bg-destructive/10 text-destructive",
  emergency: "border-emergency/35 bg-emergency/15 text-emergency"
};

export function AppNotificationBanner({
  severity,
  title,
  message
}: AppNotificationBannerProps) {
  const Icon =
    severity === "info" ? Info : severity === "warning" ? AlertTriangle : CheckCircle2;

  return (
    <section className={cn("flex items-start gap-3 rounded-2xl border p-4", severityClassName[severity])}>
      <Icon className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm opacity-85">{message}</p>
      </div>
    </section>
  );
}