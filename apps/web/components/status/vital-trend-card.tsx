import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type VitalTrendCardProps = {
  title: string;
  value: string;
  unit: string;
  description: string;
};

export function VitalTrendCard({
  title,
  value,
  unit,
  description
}: VitalTrendCardProps) {
  return (
    <Card className="rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Activity className="size-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-semibold tracking-tight">{value}</span>
          <span className="pb-1 text-sm text-muted-foreground">{unit}</span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}