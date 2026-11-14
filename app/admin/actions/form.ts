// Helpers shared by the dashboard's server actions. Plain module (not "use server"), so nothing here is callable from the browser.
import { redirect } from "next/navigation";
import { fingerprint } from "@/lib/crypto";

/** A trimmed text field, cut to `max` characters. */
export const field = (f: FormData, key: string, max = 300) => String(f.get(key) ?? "").trim().slice(0, max);

/** Non-empty lines of a textarea. */
export const fieldLines = (f: FormData, key: string, max: number) =>
  field(f, key, max).split("\n").map((l) => l.trim()).filter(Boolean);

/** "publish" button → published; any other submit → draft. */
export const publishState = (f: FormData) => (field(f, "intent") === "publish" ? "published" : "draft");

/**
 * Redirects, optionally carrying an `ok` or `error` message for the next page's <Flash>.
 * Messages travel in the URL, so they are signed: a crafted link cannot make the dashboard show its own text.
 */
export function redirectWithMessage(path: string, message: { ok: string } | { error: string } | Record<string, never> = {}): never {
  const text = "ok" in message ? message.ok : "error" in message ? message.error : undefined;
  const q = new URLSearchParams(text ? { ...message, sig: fingerprint(text) } : {}).toString();
  redirect(q ? `${path}?${q}` : path);
}
