"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import BrandMark from "@/components/BrandMark";
import { api, getApiErrorMessage } from "@/services/api";
import {
  clearStoredSession,
  getDashboardRoute,
  getStoredSession,
} from "@/services/auth.service";
import type { AuthSession, UserRole } from "@/types/auth.types";

const dashboardEndpoints: Record<UserRole, string> = {
  ADMIN: "/admin/dashboard",
  MPR: "/mpr/dashboard",
  VOLUNTEER: "/volunteer/dashboard",
  CASE_OFFICER: "/case-officer/dashboard",
};

const roleLabels: Record<UserRole, string> = {
  ADMIN: "Admin",
  MPR: "MPR",
  VOLUNTEER: "Volunteer",
  CASE_OFFICER: "Case Officer",
};

function formatLabel(label: string): string {
  return label
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function getActivityDescription(item: unknown): string {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "Recent platform activity";
  const record = item as Record<string, unknown>;
  for (const key of ["updateText", "description", "message", "title", "action", "personName"]) {
    if (typeof record[key] === "string" && record[key]) return record[key] as string;
  }
  return "Recent platform activity";
}

function getActivityDate(item: unknown): string | undefined {
  if (!item || typeof item !== "object") return undefined;
  const record = item as Record<string, unknown>;
  const date = record.createdAt || record.updatedAt;
  if (typeof date !== "string") return undefined;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toLocaleString();
}

export default function ProtectedDashboard({ role }: { role: UserRole }) {
  const router = useRouter();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.replace("/#login");
      return () => {
        active = false;
      };
    }

    if (storedSession.role !== role) {
      router.replace(getDashboardRoute(storedSession.role));
      return () => {
        active = false;
      };
    }

    setSession(storedSession);
    api
      .get<Record<string, unknown>>(dashboardEndpoints[role], {
        headers: { Authorization: `Bearer ${storedSession.accessToken}` },
      })
      .then(({ data: response }) => {
        if (active) setData(response);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
          clearStoredSession();
          setSession(null);
          setError("Your session has expired. Please sign in again.");
          return;
        }
        setError(
          getApiErrorMessage(requestError) ||
            "Unable to load your dashboard. Please try again.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [role, router]);

  function signOut() {
    clearStoredSession();
    router.replace("/");
  }

  const numericMetrics = data
    ? Object.entries(data).filter(([, value]) => typeof value === "number")
    : [];
  const activityLists = data
    ? Object.entries(data).filter(([key, value]) => /recent|activit|update|notification/i.test(key) && Array.isArray(value))
    : [];

  return (
    <main className="min-h-screen flex-1 bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <BrandMark />
          <button type="button" className="btn btn-ghost rounded-xl text-slate-600" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">TRACE workspace</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
          {roleLabels[role]} dashboard
        </h1>
        {session && (
          <p className="mt-2 text-sm text-slate-600">
            Signed in as <span className="font-semibold text-slate-800">{session.username}</span>
          </p>
        )}

        {loading && (
          <div className="mt-10 flex items-center gap-3 text-slate-600" role="status">
            <span className="loading loading-spinner loading-md text-teal-700" />
            Loading your dashboard…
          </div>
        )}

        {error && (
          <div className="alert alert-error mt-8" role="alert">
            <span>{error}</span>
            <Link href="/#login" className="btn btn-sm rounded-lg">Sign in</Link>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <section aria-label="Dashboard statistics" className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {numericMetrics.map(([key, value]) => (
                <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">{formatLabel(key)}</p>
                  <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">{String(value)}</p>
                </article>
              ))}
            </section>

            {activityLists.map(([key, value]) => (
              <section key={key} className="mt-9 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-950">{formatLabel(key)}</h2>
                {Array.isArray(value) && value.length > 0 ? (
                  <ul className="mt-4 divide-y divide-slate-100">
                    {value.slice(0, 6).map((activity, index) => (
                      <li key={index} className="py-4 first:pt-0 last:pb-0">
                        <p className="text-sm font-medium leading-6 text-slate-800">{getActivityDescription(activity)}</p>
                        {getActivityDate(activity) && (
                          <p className="mt-1 text-xs text-slate-500">{getActivityDate(activity)}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">No recent activity to display.</p>
                )}
              </section>
            ))}

            {numericMetrics.length === 0 && activityLists.length === 0 && (
              <p className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                You are signed in. Your workspace is ready.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
