import Link from "next/link";

export function AuthCard({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="mx-auto mt-16 w-full max-w-sm rounded-xl border border-slate-200 p-6 shadow-sm">
      <Link href="/" className="text-sm font-semibold text-slate-500">
        Audit Workbench
      </Link>
      <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
      <div className="mt-5">{children}</div>
      {footer && <div className="mt-5 space-y-1 text-sm text-slate-600">{footer}</div>}
    </div>
  );
}

export function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...input } = props;
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <input {...input} className="rounded-md border border-slate-300 px-2 py-1.5" />
    </label>
  );
}

export function Submit({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={busy} className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
      {busy ? "Please wait…" : children}
    </button>
  );
}

export function Message({ kind, children }: { kind: "error" | "info"; children: React.ReactNode }) {
  return <p className={`rounded-md p-2 text-sm ${kind === "error" ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>{children}</p>;
}

export const notConfigured = "Sign-in isn't configured on this deployment yet.";
