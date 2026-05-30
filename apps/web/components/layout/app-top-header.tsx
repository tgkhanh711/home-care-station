import { Bell, HelpCircle, LogOut, Search, Settings } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
import { HcsLogo } from "@/components/brand/hcs-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AppRole } from "@/lib/constants";
import { ROLE_LABEL } from "@/lib/constants";

type AppTopHeaderProps = {
  role: AppRole;
  userEmail?: string;
};

export function AppTopHeader({ role, userEmail }: AppTopHeaderProps) {
  return (
    <header className="flex h-16 w-full items-center gap-4 border-b bg-primary px-4 text-primary-foreground shadow-sm lg:px-6">
      <div className="**:text-primary-foreground">
        <HcsLogo />
      </div>

      <div className="hidden min-w-0 flex-1 items-center rounded-full bg-white/14 px-4 py-2 ring-1 ring-white/20 lg:flex">
        <Search className="mr-2 size-4 shrink-0" />
        <span className="truncate text-sm text-primary-foreground/80">
          Tìm hồ sơ, thuốc, cảnh báo, command hoặc hỏi AI...
        </span>
        <Badge className="ml-auto bg-white/18 text-primary-foreground hover:bg-white/18">
          Ctrl K
        </Badge>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
        >
          <HelpCircle className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
        >
          <Bell className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
        >
          <Settings className="size-4" />
        </Button>

        <ThemeToggle />

        <div className="hidden text-right text-xs lg:block">
          <p className="font-medium">{ROLE_LABEL[role]}</p>
          <p className="max-w-40 truncate text-primary-foreground/75">
            {userEmail ?? "user@example.com"}
          </p>
        </div>

        <form action={logoutAction}>
          <Button variant="secondary" size="sm" type="submit">
            <LogOut className="mr-2 size-4" />
            Đăng xuất
          </Button>
        </form>
      </div>
    </header>
  );
}