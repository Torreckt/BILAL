// Server-only settings. Names are documented in .env.example.
const prod = process.env.NODE_ENV === "production";

function appSecret() {
  const s = process.env.APP_SECRET;
  if (s && s.length >= 32) return s;
  if (prod) throw new Error("APP_SECRET must be set to at least 32 random characters");
  return "dev-only-secret-dev-only-secret-dev-only";
}

export const env = {
  prod,
  get appSecret() {
    return appSecret();
  },
  // Builds import the database module without connecting, so a missing URL only fails on the first query.
  databaseUrl: process.env.DATABASE_URL ?? "postgres://127.0.0.1/unset",
  siteUrl: (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
  // Staging: keep search engines out.
  noindex: process.env.SITE_NOINDEX === "1",
  // Cookies need Secure in production; allow plain http only for local runs.
  secureCookies: process.env.INSECURE_COOKIES === "1" ? false : prod,
  uploadDir: process.env.UPLOAD_DIR ?? "./uploads",
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM,
  },
  notifyEmail: process.env.NOTIFY_EMAIL ?? "Info@imainstream.net",
};
