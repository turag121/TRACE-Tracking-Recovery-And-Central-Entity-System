"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getApiErrorMessage } from "@/services/api";
import { getDashboardRoute, loginWithUsername } from "@/services/auth.service";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Enter your username and password to continue.");
      return;
    }

    setLoading(true);
    try {
      const session = await loginWithUsername(username.trim(), password);
      router.replace(getDashboardRoute(session.role));
    } catch (loginError: unknown) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Sign-in failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResetRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetError("");
    setResetMessage("");
    setResetLoading(true);

    try {
      await api.post("/auth/forgot-password", { email: resetEmail.trim() });
      setResetMessage(
        "If an eligible account exists, a password reset code has been sent to that email.",
      );
    } catch (requestError: unknown) {
      setResetError(
        getApiErrorMessage(requestError) ||
          "Unable to request a reset code right now. Please try again.",
      );
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <>
      <section id="login" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/10 sm:p-8">
        <div className="mb-7">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
            Secure access
          </p>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
            Welcome back
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to continue to your TRACE workspace.
          </p>
        </div>

        {error && (
          <div role="alert" className="alert alert-error mb-5 items-start text-sm">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="mt-0.5 size-5 shrink-0">
              <path d="M12 8v5m0 3h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="form-control block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Username</span>
            <input
              className="input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-teal-600"
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>

          <label className="form-control block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
            <span className="relative block">
              <input
                className="input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white pr-12 text-slate-900 placeholder:text-slate-400 focus:border-teal-600 focus:outline-teal-600"
                type={passwordVisible ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 grid w-12 place-items-center text-slate-500 hover:text-teal-700"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                aria-pressed={passwordVisible}
                onClick={() => setPasswordVisible((visible) => !visible)}
              >
                {passwordVisible ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
                    <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.7 10.7 0 0 1 12 5c5.5 0 9 7 9 7a15.7 15.7 0 0 1-3.1 3.8M6.2 6.2C3.9 7.8 3 12 3 12s3.5 7 9 7c1.1 0 2.1-.2 3-.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
                    <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                )}
              </button>
            </span>
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setResetOpen(true);
                setResetMessage("");
                setResetError("");
              }}
              className="text-sm font-semibold text-teal-700 hover:text-teal-900 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <button
            className="btn btn-primary h-12 w-full rounded-xl border-0 bg-teal-600 text-base font-bold text-white shadow-lg shadow-teal-900/15 transition hover:-translate-y-0.5 hover:bg-teal-700"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          TRACE identifies your access automatically from your verified account.
        </p>
      </section>

      {resetOpen && (
        <div className="modal modal-open z-50" role="dialog" aria-modal="true" aria-labelledby="reset-title">
          <button
            type="button"
            className="modal-backdrop"
            aria-label="Close password reset dialog"
            onClick={() => setResetOpen(false)}
          />
          <div className="modal-box relative max-w-md rounded-3xl bg-white p-7 text-slate-900">
            <button
              type="button"
              className="btn btn-circle btn-ghost btn-sm absolute right-4 top-4"
              aria-label="Close"
              onClick={() => setResetOpen(false)}
            >
              ×
            </button>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Account recovery</p>
            <h2 id="reset-title" className="mt-2 text-xl font-extrabold">Request a reset code</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Enter the email address linked to your TRACE account.
            </p>
            <form className="mt-5 space-y-4" onSubmit={handleResetRequest}>
              <input
                className="input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                required
              />
              {resetMessage && <p role="status" className="text-sm text-emerald-700">{resetMessage}</p>}
              {resetError && <p role="alert" className="text-sm text-red-700">{resetError}</p>}
              <button className="btn btn-primary w-full rounded-xl border-0 bg-teal-600 text-white hover:bg-teal-700" type="submit" disabled={resetLoading}>
                {resetLoading ? <span className="loading loading-spinner loading-sm" /> : "Send reset code"}
              </button>
            </form>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              For help completing a password reset, contact your TRACE administrator.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
