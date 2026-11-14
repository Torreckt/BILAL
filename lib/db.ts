import postgres from "postgres";
import { env } from "./env";

const DATE_OID = 1082;

// One pool per process (kept across dev hot reloads). Connects lazily, so builds need no database.
const globalForDb = globalThis as { __sql?: postgres.Sql };
export const sql = (globalForDb.__sql ??= postgres(env.databaseUrl, {
  max: 10,
  idle_timeout: 30,
  onnotice: () => {},
  // Calendar dates (e.g. a meeting day) stay "YYYY-MM-DD" strings. Parsed into a JS Date they'd become midnight in the
  // server's timezone, which prints as an invalid or shifted day.
  types: { date: { to: DATE_OID, from: [DATE_OID], serialize: (v: string) => v, parse: (v: string) => v } },
}));
