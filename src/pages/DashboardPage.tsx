import { Navigate } from "react-router-dom";
import { getDefaultLandingPath, useAuth } from "@/features/auth";

export function DashboardPage() {
  const { user, organization } = useAuth();
  return <Navigate to={getDefaultLandingPath(user, organization)} replace />;
}
