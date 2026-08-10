import { Navigate, useLocation } from "react-router-dom";
import {
  canAccessPlatformRoutes,
  canAccessWorkspaceRoutes,
  getDefaultLandingPath,
  isPlatformSuperuser,
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

export function PlatformSuperuserRoute({ children }: { children: React.ReactNode }) {
  const { user, organization } = useAuth();
  const location = useLocation();

  if (!isPlatformSuperuser(user)) {
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
