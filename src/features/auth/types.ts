export type UserType = "platform" | "non_platform";

export interface LoginPayload {
  email: string;
  password: string;
  organization_id?: string;
}

export interface AuthOrganization {
  id: number;
  organization_id: string;
  name: string;
  code: string;
  membership_id: string;
  membership_type: string;
  status: string;
}

export interface AuthAccessContext {
  id: number;
  organization: number | null;
  organization_name: string;
  organization_unit: number | null;
  organization_unit_name: string;
  partner_organization: number | null;
  partner_organization_name: string;
  project: number | null;
  project_name: string;
  selected_top_role_assignment: number | null;
  top_role_name: string;
  selected_role_assignment: number | null;
  selected_role_name: string;
  permission_codes: string[];
  is_active: boolean;
  last_used_at: string | null;
}

export interface TokenResponse {
  message: string;
  access: string;
  refresh: string;
  user: AuthUser;
  organization: AuthOrganization | null;
}

export interface TokenRefreshPayload {
  refresh: string;
}

export interface TokenRefreshResponse {
  access: string;
  /** Present when SIMPLE_JWT ROTATE_REFRESH_TOKENS is enabled. */
  refresh?: string;
}

export interface TokenVerifyPayload {
  token: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  uid: string;
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  user_type: UserType | string;
  is_staff: boolean;
  is_superuser: boolean;
  roles: string[];
  permissions: string[];
  permission_codes?: string[];
  active_access_context?: AuthAccessContext | null;
}
