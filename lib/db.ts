import postgres from "postgres";

// One pool per process (kept across dev hot reloads). Connects lazily, so builds need no database.
const g = globalThis as { __sql?: postgres.Sql };
export const sql = (g.__sql ??= postgres(process.env.DATABASE_URL ?? "postgres://127.0.0.1/unset", {
  max: 10,
  idle_timeout: 30,
  onnotice: () => {},
}));
