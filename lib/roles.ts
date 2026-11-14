// Dashboard roles and what each may do. Every server action and page checks this on the server (see requireUser in
// lib/auth.ts). Plain module with no server imports, so data code and tests can use it directly.

export const ROLES = ["owner", "agent", "editor"] as const;
export type Role = (typeof ROLES)[number];

export const roleLabels: Record<Role, string> = { owner: "مالك", agent: "مسؤول متابعة", editor: "محرر محتوى" };

export const OWNER_ROLES: Role[] = ["owner"];
export const REQUEST_ROLES: Role[] = ["owner", "agent"];
export const CONTENT_ROLES: Role[] = ["owner", "editor"];

/** Narrows untrusted input (a form field) to a Role. */
export const isRole = (v: string): v is Role => (ROLES as readonly string[]).includes(v);
