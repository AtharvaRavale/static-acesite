export { authApi, establishSession, restoreSession } from "./api";
export { auth, useAuth } from "./authStore";
export {
  canAccessPlatformRoutes,
  canAccessWorkspaceRoutes,
  getDefaultLandingPath,
  isOrganizationUser,
  isPlatformOnlyPath,
  isPlatformUser,
  isWorkspacePath,
} from "./guards";
export { getSafeRedirectPath, resolveAuthRedirect } from "./routes";
export {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getStoredOrganization,
  getStoredUser,
  hasAccessToken,
  hasStoredSession,
  setStoredOrganization,
  setStoredUser,
  setTokens,
} from "./session";
export type {
  AuthAccessContext,
  AuthOrganization,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  TokenRefreshPayload,
  TokenRefreshResponse,
  TokenResponse,
  TokenVerifyPayload,
  UserType,
} from "./types";
