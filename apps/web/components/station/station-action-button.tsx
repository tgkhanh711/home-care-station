import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StationActionButtonProps = {
  icon: LucideIcon;
  label: string;
  description: string;
  tone?: "primary" | "emergency" | "station";
};

export function StationActionButton({
  icon: Icon,
  label,
  description,
  tone = "station"
}: StationActionButtonProps) {
  return (
    <Button
      type="button"
      className={cn(
        "h-auto w-full justify-start rounded-4xl p-6 text-left text-2xl font-bold leading-tight shadow-lg",
        tone === "station" && "bg-station text-station-foreground hover:bg-station/90",
        tone === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        tone === "emergency" && "bg-emergency text-emergency-foreground hover:bg-emergency/90"
      )}
    >
      <Icon className="mr-5 size-12 shrink-0" />
      <span>
        <span className="block">{label}</span>
        <span className="mt-2 block text-base font-medium opacity-80">{description}</span>
      </span>
    </Button>
  );
}