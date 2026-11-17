/** Supabase settings from the environment, or null when auth isn't configured (local development only). */
export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}

/** Without Supabase configured, auth is skipped in development and fails closed everywhere else. */
export function authSkipped() {
  return !supabaseConfig() && process.env.NODE_ENV === "development";
}
