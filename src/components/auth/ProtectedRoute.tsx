import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { hasStoredSession, restoreSession, useAuth } from "@/features/auth";
import { AuthLoadingScreen } from "@/features/auth/AuthLoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState<AuthStatus>(() => {
    if (user && hasStoredSession()) return "authenticated";
    if (hasStoredSession()) return "loading";
    return "unauthenticated";
  });

  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      if (!hasStoredSession()) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }

      // Cached user lets the shell render immediately; still revalidate.
      const restored = await restoreSession();
      if (cancelled) return;
      setStatus(restored ? "authenticated" : "unauthenticated");
    }

    void validateSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return <AuthLoadingScreen />;
  }

  if (status === "unauthenticated" || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
