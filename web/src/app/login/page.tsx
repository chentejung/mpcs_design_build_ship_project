"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthCard, Field, Message, notConfigured, Submit } from "../components/AuthCard";

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    if (!supabase) return setError(notConfigured);
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (error) return setError(error.message);
    // Full navigation: the router may hold a redirect to /login prefetched while signed out.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload resets the router cache after sign-in state changes
    window.location.assign("/");
  }

  return (
    <AuthCard
      title="Log in"
      footer={
        <>
          <p>
            New here? <Link className="text-blue-700 underline" href="/signup">Create an account</Link>
          </p>
          <p>
            <Link className="text-blue-700 underline" href="/reset-password">Forgot your password?</Link>
          </p>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Password" name="password" type="password" required autoComplete="current-password" />
        {error && <Message kind="error">{error}</Message>}
        <Submit busy={busy}>Log in</Submit>
      </form>
    </AuthCard>
  );
}
