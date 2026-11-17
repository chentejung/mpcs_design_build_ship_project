"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthCard, Field, Message, notConfigured, Submit } from "../components/AuthCard";

export default function UpdatePasswordPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    if (!supabase) return setError(notConfigured);
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password: String(form.get("password")) });
    setBusy(false);
    if (error) return setError(error.message);
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload resets the router cache after sign-in state changes
    window.location.assign("/");
  }

  return (
    <AuthCard title="Choose a new password">
      <form onSubmit={onSubmit} className="space-y-3">
        <Field label="New password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        {error && <Message kind="error">{error}</Message>}
        <Submit busy={busy}>Save password</Submit>
      </form>
    </AuthCard>
  );
}
