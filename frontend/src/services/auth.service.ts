import axios from "axios";
import { api, getApiErrorMessage } from "@/services/api";
import {
  DASHBOARD_ROUTES,
  type AuthSession,
  type JwtClaims,
  type LoginResponse,
  type UserRole,
  USER_ROLES,
} from "@/types/auth.types";

const SESSION_KEY = "trace.auth";

const loginEndpoints: { path: string; expectedRole: UserRole }[] = [
  { path: "/admin/auth/login", expectedRole: "ADMIN" },
  { path: "/mpr/login", expectedRole: "MPR" },
  { path: "/volunteer/login", expectedRole: "VOLUNTEER" },
  { path: "/case-officer/auth/login", expectedRole: "CASE_OFFICER" },
];

function decodeClaims(token: string): JwtClaims {
  const segments = token.split(".");
  if (segments.length !== 3) {
    throw new Error("The server returned an invalid sign-in token.");
  }

  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as JwtClaims;
  } catch {
    throw new Error("The server returned an invalid sign-in token.");
  }
}

function isUserRole(role: string | undefined): role is UserRole {
  return USER_ROLES.some((supportedRole) => supportedRole === role);
}

function getFriendlyLoginError(messages: string[]): string {
  const verificationMessage = messages.find((message) =>
    /verify|verification/i.test(message),
  );
  if (verificationMessage) {
    return "Please verify your email address before signing in.";
  }

  const inactiveMessage = messages.find((message) => /inactive|deactivated/i.test(message));
  if (inactiveMessage) {
    return "This account is inactive. Please contact an administrator.";
  }

  return "Sign-in failed. Check your username and password, and make sure your email is verified and your account is active.";
}

export async function loginWithUsername(
  username: string,
  password: string,
): Promise<AuthSession> {
  const rejectedMessages: string[] = [];

  for (const endpoint of loginEndpoints) {
    try {
      const { data } = await api.post<LoginResponse>(endpoint.path, {
        username,
        password,
      });
      if (!data.accessToken) {
        throw new Error("The server did not return an access token.");
      }

      const claims = decodeClaims(data.accessToken);
      if (!isUserRole(claims.role) || claims.role !== endpoint.expectedRole) {
        throw new Error("The server returned an unsupported or mismatched account role.");
      }
      if (!claims.sub) {
        throw new Error("The server returned an invalid sign-in token.");
      }
      if (claims.exp && claims.exp * 1000 <= Date.now()) {
        throw new Error("The server returned an expired sign-in token.");
      }

      const session: AuthSession = {
        accessToken: data.accessToken,
        role: claims.role,
        userId: claims.sub,
        username: claims.username || username,
        email: claims.email || data.user?.email,
        expiresAt: claims.exp ? claims.exp * 1000 : undefined,
      };
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return session;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && !error.response) {
        throw new Error("Unable to reach TRACE. Check your connection and try again.");
      }
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 403)
      ) {
        const message = getApiErrorMessage(error);
        if (message) rejectedMessages.push(message);
        continue;
      }
      throw new Error(
        getApiErrorMessage(error) ||
          (error instanceof Error ? error.message : "Sign-in failed. Please try again."),
      );
    }
  }

  throw new Error(getFriendlyLoginError(rejectedMessages));
}

export function getStoredSession(): AuthSession | null {
  const serialized = window.sessionStorage.getItem(SESSION_KEY);
  if (!serialized) return null;

  try {
    const session = JSON.parse(serialized) as AuthSession;
    const claims = session.accessToken ? decodeClaims(session.accessToken) : null;
    if (
      !session.accessToken ||
      !isUserRole(session.role) ||
      !session.userId ||
      !claims ||
      claims.sub !== session.userId ||
      claims.role !== session.role ||
      (session.expiresAt !== undefined && session.expiresAt <= Date.now())
    ) {
      clearStoredSession();
      return null;
    }
    if (claims.exp && claims.exp * 1000 <= Date.now()) {
      clearStoredSession();
      return null;
    }
    return session;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function clearStoredSession(): void {
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function getDashboardRoute(role: UserRole): string {
  return DASHBOARD_ROUTES[role];
}
