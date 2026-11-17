"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthCard, Field, Message, notConfigured, Submit } from "../components/AuthCard";

export default function ResetPasswordPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const supabase = createClient();
    if (!supabase) return setError(notConfigured);
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(String(form.get("email")), {
      redirectTo: `${window.location.origin}/auth/confirm?next=/update-password`,
    });
    setBusy(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  return (
    <AuthCard
      title="Reset your password"
      footer={
        <p>
          <Link className="text-blue-700 underline" href="/login">Back to log in</Link>
        </p>
      }
    >
      {sent ? (
        <Message kind="info">If an account exists for that email, a reset link is on its way.</Message>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Email" name="email" type="email" required autoComplete="email" />
          {error && <Message kind="error">{error}</Message>}
          <Submit busy={busy}>Send reset link</Submit>
        </form>
      )}
    </AuthCard>
  );
}
