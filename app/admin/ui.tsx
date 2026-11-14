// Small shared pieces for dashboard pages.
export type Search = Promise<Record<string, string | undefined>>;

export function Flash({ sp }: { sp: Record<string, string | undefined> }) {
  if (sp.error) return <p className="adm-flash adm-flash--error" role="alert">{sp.error}</p>;
  if (sp.ok) return <p className="adm-flash" role="status">{sp.ok}</p>;
  return null;
}

export function Badge({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "red" | "paper" | "green" }) {
  return <span className={`adm-badge adm-badge--${tone}`}>{children}</span>;
}

export const when = (d: Date | string) =>
  new Date(d).toLocaleString("ar-SA-u-ca-gregory-nu-latn", { timeZone: "Asia/Riyadh", dateStyle: "medium", timeStyle: "short" });

export const statusTone = (status: string) => (status === "new" ? "red" : status === "closed" ? "paper" : "ink");
