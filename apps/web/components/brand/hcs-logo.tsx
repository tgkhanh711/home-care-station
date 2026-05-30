import Link from "next/link";
import { HeartPulse } from "lucide-react";

export function HcsLogo() {
  return (
    <Link href="/login" className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
        <HeartPulse className="size-5" />
      </div>
      <div className="leading-tight">
        <p className="font-semibold tracking-tight">Home Care Station</p>
        <p className="text-xs text-muted-foreground">AIoT elderly care</p>
      </div>
    </Link>
  );
}