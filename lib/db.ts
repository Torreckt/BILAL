import postgres from "postgres";
import { env } from "./env";

const DATE_OID = 1082;

function createPool() {
  return postgres(env.databaseUrl, {
    max: 10,
    idle_timeout: 30,
    onnotice: () => {},
    // Calendar dates (e.g. a meeting day) stay "YYYY-MM-DD" strings. Parsed into a JS Date they'd become midnight in
    // the server's timezone, which prints as an invalid or shifted day.
    types: { date: { to: DATE_OID, from: [DATE_OID], serialize: (v: string) => v, parse: (v: string) => v } },
  });
}

// One pool per process (kept across dev hot reloads), created on the first query rather than at import, so builds
// and tests can import this module before DATABASE_URL is known.
const globalForDb = globalThis as { __sql?: ReturnType<typeof createPool> };
const pool = () => (globalForDb.__sql ??= createPool());

export const sql = new Proxy((() => {}) as unknown as ReturnType<typeof createPool>, {
  apply: (_target, _this, args) => Reflect.apply(pool(), undefined, args),
  get: (_target, prop) => {
    const value = Reflect.get(pool(), prop);
    return typeof value === "function" ? value.bind(pool()) : value;
  },
});
