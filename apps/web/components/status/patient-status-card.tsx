import { HeartPulse } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PatientStatus = "stable" | "warning" | "danger";

type PatientStatusCardProps = {
  name: string;
  status: PatientStatus;
  description: string;
};

const statusConfig: Record<PatientStatus, { label: string; className: string }> = {
  stable: {
    label: "Ổn định",
    className: "bg-success/10 text-success"
  },
  warning: {
    label: "Cảnh báo",
    className: "bg-warning/20 text-warning-foreground"
  },
  danger: {
    label: "Nguy hiểm",
    className: "bg-emergency/15 text-emergency"
  }
};

export function PatientStatusCard({
  name,
  status,
  description
}: PatientStatusCardProps) {
  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{name}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HeartPulse className="size-5" />
        </div>
      </CardHeader>
      <CardContent>
        <Badge className={cn("rounded-full px-4 py-1.5 text-sm hover:bg-inherit", statusConfig[status].className)}>
          {statusConfig[status].label}
        </Badge>
      </CardContent>
    </Card>
  );
}