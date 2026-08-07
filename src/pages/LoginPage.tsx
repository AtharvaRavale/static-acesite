import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, IdCard, Loader2, Lock, Mail } from "lucide-react";
import { authApi, auth, establishSession, hasStoredSession, restoreSession } from "@/features/auth";
import { AuthLoadingScreen } from "@/features/auth/AuthLoadingScreen";
import { resolveAuthRedirect } from "@/features/auth/routes";
import { getApiErrorMessage } from "@/lib/api";
import { PRODUCT_NAME } from "@/lib/brand";
import { LoginBrandPanel } from "@/components/auth/LoginBrandPanel";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: unknown } | null)?.from;

  const [email, setEmail] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(() => hasStoredSession());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkExistingSession() {
      if (!hasStoredSession()) {
        if (!cancelled) setIsCheckingSession(false);
        return;
      }

      const restoredUser = await restoreSession();
      if (cancelled) return;

      if (restoredUser) {
        navigate(
          resolveAuthRedirect(from, restoredUser, auth.getOrganization()),
          { replace: true }
        );
      } else {
        setIsCheckingSession(false);
      }
    }

    void checkExistingSession();
    return () => {
      cancelled = true;
    };
  }, [navigate, from]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const normalizedOrganizationId = organizationId.trim().toUpperCase();
      const tokens = await authApi.login({
        email: email.trim(),
        password,
        ...(normalizedOrganizationId ? { organization_id: normalizedOrganizationId } : {}),
      });
      await establishSession(tokens);
      navigate(
        resolveAuthRedirect(from, tokens.user, tokens.organization),
        { replace: true }
      );
    } catch (submitError) {
      setError(
        getApiErrorMessage(
          submitError,
          "Login failed. Check your email and password."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return <AuthLoadingScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <LoginBrandPanel />

      {/* Right: Form Panel */}
      <div className="relative flex flex-1 flex-col justify-center px-4 py-12 sm:px-8 lg:px-16 xl:px-24">
        {/* Subtle ambient glow */}
        <div
          className="absolute top-0 right-0 w-[50%] h-[50%] pointer-events-none opacity-20"
          style={{ background: 'radial-gradient(ellipse at top right, var(--color-primary), transparent 70%)' }}
        />

        <div className="login-form-panel relative mx-auto w-full max-w-[420px] z-10">
          {/* Mobile Logo */}
          <div className="mb-10 text-center lg:hidden">
            <div className="inline-flex items-center gap-2.5">
              <div className="login-logo-glow flex text-primary">
                <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 2L2 28H10L16 16L22 28H30L16 2Z" fill="currentColor"/>
                  <path d="M16 19L20.5 28H11.5L16 19Z" fill="currentColor" opacity="0.35"/>
                </svg>
              </div>
              <span className="font-logo text-[1.75rem] tracking-tighter text-foreground leading-none mt-1">
                Ace<span className="opacity-60 font-semibold tracking-tight">Site</span>
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8 pl-1">
            <h1 className="font-display text-[2rem] sm:text-[2.25rem] font-extrabold tracking-tight text-foreground">
              Sign in
            </h1>
            <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
              Access your construction project command center.
            </p>
          </div>

          {/* Form Card */}
          <div className="relative rounded-2xl border border-border/80 bg-card/60 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)] ring-1 ring-foreground/5">
            {/* Top highlight */}
            <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2.5">
                <label htmlFor="email" className="block text-sm font-semibold text-foreground/90">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>

              {/* Organization ID */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <label htmlFor="organization_id" className="block text-sm font-semibold text-foreground/90">
                    Organization ID
                  </label>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Required for organization users
                  </span>
                </div>
                <div className="relative group">
                  <IdCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    id="organization_id"
                    type="text"
                    name="organization_id"
                    autoComplete="off"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value.toUpperCase())}
                    placeholder="ORG12345"
                    maxLength={8}
                    className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 uppercase tracking-[0.08em] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all duration-200 shadow-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-foreground/90">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 group-focus-within:text-primary transition-colors duration-200" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-11 py-3.5 rounded-xl bg-background/50 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all duration-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-[13.5px] text-destructive flex items-center gap-2"
                >
                  <div className="w-1 h-4 rounded-full bg-destructive" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-[14px] font-bold bg-primary text-primary-foreground shadow-[0_4px_14px_color-mix(in_srgb,var(--color-primary)_28%,transparent)] hover:scale-[1.01] hover:shadow-[0_6px_20px_color-mix(in_srgb,var(--color-primary)_36%,transparent)] active:scale-[0.98] ring-1 ring-primary-foreground/10 transition-all duration-300 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 flex flex-col items-center gap-8">
            <p className="text-center text-[14px] text-muted-foreground">
              Don't have an account?{" "}
              <button className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer">
                Contact Sales
              </button>
            </p>

            <p className="text-center text-[11px] text-muted-foreground/40 font-medium tracking-wide uppercase">
              {new Date().getFullYear()} {PRODUCT_NAME} Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
