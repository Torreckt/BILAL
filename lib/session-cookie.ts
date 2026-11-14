// Session cookie names. Shared by lib/auth.ts (server) and proxy.ts (runs before every page), so keep this file free of
// server-only imports.
export const SESSION_COOKIE_SECURE = "__Host-ms_session";
export const SESSION_COOKIE_PLAIN = "ms_session";
export const SESSION_COOKIES = [SESSION_COOKIE_SECURE, SESSION_COOKIE_PLAIN] as const;
