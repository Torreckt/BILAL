// Server-only settings. Names are documented in .env.example.
const prod = process.env.NODE_ENV === "production";

/** A variable's value, treating "set but empty" (as left by copying .env.example) the same as "not set". */
const read = (name: string) => process.env[name]?.trim() || undefined;

function appSecret() {
  const s = read("APP_SECRET");
  if (s && s.length >= 32) return s;
  if (prod) throw new Error("APP_SECRET must be set to at least 32 random characters");
  return "dev-only-secret-dev-only-secret-dev-only";
}

function smtpPort() {
  const port = Number(read("SMTP_PORT") ?? 587);
  return Number.isInteger(port) && port > 0 ? port : 587;
}

export const env = {
  prod,
  get appSecret() {
    return appSecret();
  },
  /**
   * Read when lib/db.ts first creates the pool. The build touches that module without a database (and with
   * NODE_ENV=production), so a missing URL can't throw here; it falls back to an address that fails on the first query.
   */
  get databaseUrl() {
    return read("DATABASE_URL") ?? "postgres://127.0.0.1/unset";
  },
  siteUrl: (read("SITE_URL") ?? "http://localhost:3000").replace(/\/+$/, ""),
  // Staging: keep search engines out.
  noindex: read("SITE_NOINDEX") === "1",
  // Cookies need Secure in production; allow plain http only for local runs.
  secureCookies: read("INSECURE_COOKIES") === "1" ? false : prod,
  uploadDir: read("UPLOAD_DIR") ?? "./uploads",
  smtp: {
    host: read("SMTP_HOST"),
    port: smtpPort(),
    user: read("SMTP_USER"),
    pass: read("SMTP_PASS"),
    from: read("SMTP_FROM"),
  },
  notifyEmail: read("NOTIFY_EMAIL") ?? "Info@imainstream.net",
};
