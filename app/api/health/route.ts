import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// For uptime monitors: 200 when the app can reach the database.
export async function GET() {
  try {
    await sql`select 1`;
    return Response.json({ ok: true });
  } catch (e) {
    console.error("health check: database unreachable", e);
    return Response.json({ ok: false }, { status: 503 });
  }
}
