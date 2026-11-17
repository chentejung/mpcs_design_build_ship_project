"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = { full_name: string; employee_id: string; email: string };

/** Shows who is signed in (name and employee ID) with a log-out button. */
export function AccountBar() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const { data: row } = await supabase.from("profiles").select("full_name, employee_id").eq("id", data.user.id).single();
      setProfile({ full_name: row?.full_name ?? "", employee_id: row?.employee_id ?? "", email: data.user.email ?? "" });
    })();
  }, []);

  async function logOut() {
    await createClient()?.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (!profile) return null;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-slate-600">
        {profile.full_name || profile.email} · Employee ID {profile.employee_id}
      </span>
      <button type="button" onClick={logOut} className="rounded-md border border-slate-300 px-2 py-1 hover:bg-slate-50">
        Log out
      </button>
    </div>
  );
}
