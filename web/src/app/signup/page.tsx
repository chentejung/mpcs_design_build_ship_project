"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthCard, Field, Message, notConfigured, Submit } from "../components/AuthCard";

export default function SignupPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const employeeId = String(form.get("employeeId")).trim();
    if (!employeeId) return setError("Employee ID is required.");
    const supabase = createClient();
    if (!supabase) return setError(notConfigured);
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: {
        data: { full_name: String(form.get("fullName")).trim(), employee_id: employeeId },
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    setBusy(false);
    if (error) return setError(error.message);
    // Full navigation: the router may hold a redirect to /login prefetched while signed out.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload resets the router cache after sign-in state changes
    if (data.session) window.location.assign("/");
    else setSent(true);
  }

  return (
    <AuthCard
      title="Create an account"
      footer={
        <p>
          Already have one? <Link className="text-blue-700 underline" href="/login">Log in</Link>
        </p>
      }
    >
      {sent ? (
        <Message kind="info">Check your email for a link to confirm your account, then log in.</Message>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Full name" name="fullName" required autoComplete="name" />
          <Field label="Employee ID" name="employeeId" required />
          <Field label="Email" name="email" type="email" required autoComplete="email" />
          <Field label="Password" name="password" type="password" required minLength={8} autoComplete="new-password" />
          {error && <Message kind="error">{error}</Message>}
          <Submit busy={busy}>Sign up</Submit>
        </form>
      )}
    </AuthCard>
  );
}
