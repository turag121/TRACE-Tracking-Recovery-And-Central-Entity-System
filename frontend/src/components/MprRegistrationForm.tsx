"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { api, getApiErrorMessage } from "@/services/api";

interface MprRegistrationData {
  name: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  address: string;
}

export default function MprRegistrationForm() {
  const [form, setForm] = useState<MprRegistrationData>({
    name: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });
  const [verificationToken, setVerificationToken] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);

  function updateField(field: keyof MprRegistrationData, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await api.post<{ verificationToken?: string }>("/mpr/register", form);
      if (!data.verificationToken) {
        throw new Error("TRACE did not return a registration verification token.");
      }
      setVerificationToken(data.verificationToken);
      setMessage(`A verification code has been sent to ${form.email}.`);
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError) ||
          (requestError instanceof Error ? requestError.message : "Unable to start registration."),
      );
    } finally {
      setLoading(false);
    }
  }

  async function verifyRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await api.post<{ message?: string }>("/mpr/verify-registration", {
        verificationToken,
        otp,
      });
      setComplete(true);
      setMessage(data.message || "Your reporter account is ready. You can now sign in.");
    } catch (requestError: unknown) {
      setError(
        getApiErrorMessage(requestError) ||
          "Unable to verify that code. Check it and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-5 py-12 sm:px-8">
      <section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10">
        <Link href="/" className="text-sm font-bold text-teal-700 hover:text-teal-900">← Back to TRACE</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">Missing Person Reporter</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
          {complete ? "Registration complete" : verificationToken ? "Verify your email" : "Create your reporter account"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {complete
            ? "Your account has been verified. Sign in to submit a missing-person report."
            : verificationToken
              ? `Enter the six-digit code sent to ${form.email}.`
              : "Set up an account before submitting a missing-person report."}
        </p>

        {(error || message) && (
          <div
            role={error ? "alert" : "status"}
            className={`alert mt-6 text-sm ${error ? "alert-error" : "alert-success"}`}
          >
            {error || message}
          </div>
        )}

        {complete ? (
          <Link href="/#login" className="btn btn-primary mt-7 w-full rounded-xl border-0 bg-teal-700 text-white hover:bg-teal-800">
            Continue to sign in
          </Link>
        ) : verificationToken ? (
          <form onSubmit={verifyRegistration} className="mt-7 space-y-5">
            <label className="form-control block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email verification code</span>
              <input
                className="input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white text-center text-lg tracking-[0.4em]"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
              />
            </label>
            <button type="submit" className="btn btn-primary w-full rounded-xl border-0 bg-teal-700 text-white hover:bg-teal-800" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Verify email"}
            </button>
            <button
              type="button"
              className="btn btn-ghost w-full text-slate-600"
              onClick={() => {
                setVerificationToken("");
                setOtp("");
                setMessage("");
              }}
            >
              Use a different email or edit details
            </button>
          </form>
        ) : (
          <form onSubmit={submitRegistration} className="mt-7 grid gap-5 sm:grid-cols-2">
            <label className="form-control block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
              <input className="input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white" value={form.name} onChange={(event) => updateField("name", event.target.value)} autoComplete="name" required />
            </label>
            <label className="form-control block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Username</span>
              <input className="input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white" value={form.username} onChange={(event) => updateField("username", event.target.value)} autoComplete="username" required />
            </label>
            <label className="form-control block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
              <input className="input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white" type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} autoComplete="email" required />
            </label>
            <label className="form-control block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Password</span>
              <input className="input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white" type="password" value={form.password} onChange={(event) => updateField("password", event.target.value)} autoComplete="new-password" minLength={8} required />
            </label>
            <label className="form-control block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Phone</span>
              <input className="input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white" type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} autoComplete="tel" required />
            </label>
            <label className="form-control block sm:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Address</span>
              <input className="input input-bordered h-12 w-full rounded-xl border-slate-300 bg-white" value={form.address} onChange={(event) => updateField("address", event.target.value)} autoComplete="street-address" required />
            </label>
            <button type="submit" className="btn btn-primary mt-1 w-full rounded-xl border-0 bg-teal-700 text-white hover:bg-teal-800 sm:col-span-2" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : "Create account and send code"}
            </button>
          </form>
        )}

        {!complete && (
          <p className="mt-6 text-center text-sm text-slate-500">
            Already registered? <Link href="/#login" className="font-bold text-teal-700 hover:underline">Sign in</Link>
          </p>
        )}
      </section>
    </main>
  );
}
