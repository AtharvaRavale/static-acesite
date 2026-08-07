import { Navigate, useLocation } from "react-router-dom";
import {
  canAccessPlatformRoutes,
  canAccessWorkspaceRoutes,
  getDefaultLandingPath,
  useAuth,
} from "@/features/auth";

export function PlatformRoute({ children }: { children: React.ReactNode }) {
  const { user, organization } = useAuth();
  const location = useLocation();

  if (!canAccessPlatformRoutes(user)) {
    return (
      <Navigate
        to={getDefaultLandingPath(user, organization)}
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}

export function WorkspaceRoute({ children }: { children: React.ReactNode }) {
  const { user, organization } = useAuth();
  const location = useLocation();

  if (!canAccessWorkspaceRoutes(user, organization)) {
    if (user?.user_type === "non_platform") {
      return (
        <div className="rounded-2xl border border-border bg-card p-8">
          <h1 className="font-logo text-xl font-semibold text-foreground">
            Organization context required
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your membership ID so we can load your organization
            workspace. Platform tools are not available on this account.
          </p>
        </div>
      );
    }

    return (
      <Navigate
        to={getDefaultLandingPath(user, organization)}
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
}
