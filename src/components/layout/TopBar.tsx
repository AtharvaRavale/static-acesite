import { Bell, HelpCircle, Loader2, LogOut } from "lucide-react";
import { authApi, isPlatformUser, useAuth } from "@/features/auth";
import { Logo } from "@/components/ui/Logo";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TopBarProps {
  className?: string;
}

export function TopBar({ className }: TopBarProps) {
  const { user, organization } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await authApi.logout();
    navigate("/login", { replace: true });
  };

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() ||
      "U"
    : "?";

  const contextLabel = isPlatformUser(user)
    ? "Platform Admin"
    : organization
      ? `${organization.name}`
      : "No organization";

  const contextMeta = isPlatformUser(user)
    ? user?.email
    : organization?.membership_id
      ? `Membership ${organization.membership_id}`
      : user?.email;

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <Logo size={28} className="drop-shadow-sm" />
        <span className="font-logo text-xl tracking-tight text-foreground">
          Ace
          <span className="font-semibold text-muted-foreground opacity-70">
            Site
          </span>
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-md"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-background bg-destructive" />
        </button>
        <div className="ml-2 h-6 w-px bg-border" />
        <div className="mr-2 hidden min-w-0 text-right sm:block">
          <p className="truncate text-xs font-semibold text-foreground">
            {contextLabel}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {contextMeta}
          </p>
        </div>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
          title={contextLabel}
        >
          {initials}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          aria-label="Logout"
          title="Logout"
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4.5 w-4.5" />
          )}
        </button>
      </div>
    </header>
  );
}
