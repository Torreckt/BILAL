import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { MEDIA_NAME, uploadPath } from "@/lib/uploads";

// Serves files uploaded from the dashboard. Names are random and validated, so nothing outside the upload folder is reachable.
export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!MEDIA_NAME.test(name)) return new Response(null, { status: 404 });
  const info = await stat(uploadPath(name)).catch(() => null);
  if (!info) return new Response(null, { status: 404 });

  const headers: Record<string, string> = {
    "Content-Type": name.endsWith(".mp4") ? "video/mp4" : "image/webp",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };
  // Phones ask for videos in byte ranges.
  const m = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  let start = 0;
  let end = info.size - 1;
  let status = 200;
  if (m && (m[1] || m[2])) {
    start = m[1] ? Number(m[1]) : Math.max(0, info.size - Number(m[2]));
    end = m[1] && m[2] ? Math.min(Number(m[2]), end) : end;
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${info.size}` } });
    status = 206;
    headers["Content-Range"] = `bytes ${start}-${end}/${info.size}`;
  }
  headers["Content-Length"] = String(end - start + 1);
  const stream = Readable.toWeb(createReadStream(uploadPath(name), { start, end })) as ReadableStream;
  return new Response(stream, { status, headers });
}
