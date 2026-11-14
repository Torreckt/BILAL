// Small shared pieces for dashboard pages.
import type { PublishStatus } from "@/lib/content";
import { fingerprint } from "@/lib/crypto";

export type Search = Promise<Record<string, string | undefined>>;

/** Result message of the last action. Shown only when its signature matches (see redirectWithMessage in actions/form.ts). */
export function Flash({ sp }: { sp: Record<string, string | undefined> }) {
  const msg = sp.error ?? sp.ok;
  if (!msg || sp.sig !== fingerprint(msg)) return null;
  if (sp.error) return <p className="adm-flash adm-flash--error" role="alert">{sp.error}</p>;
  if (sp.ok) return <p className="adm-flash" role="status">{sp.ok}</p>;
  return null;
}

export function Badge({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "red" | "paper" | "green" }) {
  return <span className={`adm-badge adm-badge--${tone}`}>{children}</span>;
}

export const formatDateTime = (d: Date | string) =>
  new Date(d).toLocaleString("ar-SA-u-ca-gregory-nu-latn", { timeZone: "Asia/Riyadh", dateStyle: "medium", timeStyle: "short" });

export const statusTone = (status: string) => (status === "new" ? "red" : status === "closed" ? "paper" : "ink");

/** Published / draft badge for content. `feminine` picks the Arabic agreement (خدمة منشورة vs عمل منشور). */
export function PublishedBadge({ status, feminine = false }: { status: PublishStatus; feminine?: boolean }) {
  const published = status === "published";
  return <Badge tone={published ? "green" : "paper"}>{published ? (feminine ? "منشورة" : "منشور") : "مسودة"}</Badge>;
}
