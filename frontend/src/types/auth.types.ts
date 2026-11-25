export const USER_ROLES = [
  "ADMIN",
  "MPR",
  "VOLUNTEER",
  "CASE_OFFICER",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface AuthSession {
  accessToken: string;
  role: UserRole;
  userId: string;
  username: string;
  email?: string;
  expiresAt?: number;
}

export interface JwtClaims {
  sub?: string;
  role?: string;
  username?: string;
  email?: string;
  exp?: number;
}

export interface LoginResponse {
  accessToken?: string;
  user?: {
    role?: string;
    id?: string;
    email?: string;
  };
}

export const DASHBOARD_ROUTES: Record<UserRole, string> = {
  ADMIN: "/admin/dashboard",
  MPR: "/mpr/dashboard",
  VOLUNTEER: "/volunteer/dashboard",
  CASE_OFFICER: "/case-officer/dashboard",
};
