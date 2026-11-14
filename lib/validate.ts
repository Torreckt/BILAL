// Small format checks shared by dashboard pages and server actions.
export const MIN_PASSWORD = 12;

export const isUuid = (v: string | undefined): v is string => !!v && /^[0-9a-f-]{36}$/.test(v);
export const isSlug = (v: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
/** Staff usernames: lower-case letters and digits, with . _ - allowed after the first character; 3–40 long. */
export const isUsername = (v: string) => /^[a-z0-9][a-z0-9._-]{2,39}$/.test(v);
export const isEmailLike = (v: string) => /^\S+@\S+\.\S+$/.test(v);
export const isIsoDate = (v: string | undefined): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);
