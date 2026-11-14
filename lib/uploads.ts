import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { sql } from "./db";
import { env } from "./env";
import type { MediaItem } from "./content";

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
export const MEDIA_NAME = /^[a-f0-9]{32}\.(webp|mp4)$/;
export const uploadPath = (name: string) => join(resolve(env.uploadDir), name);

const isMissingFile = (e: unknown) => (e as NodeJS.ErrnoException | null)?.code === "ENOENT";

/** Deletes an uploaded file. A file that is already gone is fine; any other failure (permissions, IO) is raised. */
async function deleteFile(name: string) {
  try {
    await unlink(uploadPath(name));
  } catch (e) {
    if (!isMissingFile(e)) throw e;
  }
}

// ISO-BMFF major brands that browsers play as video/mp4 (phones export isom/mp42; iPhone "most compatible" too).
const MP4_BRANDS = new Set(["isom", "iso2", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "M4V ", "M4VH", "M4VP", "dash", "MSNV"]);

/** True when the bytes start an MP4 file with a brand from MP4_BRANDS (not QuickTime .mov, 3GP or HEIF stills). */
export const isMp4 = (buf: Buffer) => buf.subarray(4, 8).toString("latin1") === "ftyp" && MP4_BRANDS.has(buf.subarray(8, 12).toString("latin1"));

/**
 * Stores a file uploaded from the dashboard. The type is decided by the file's real content, never its name:
 * images are decoded and re-encoded to WebP (which also drops EXIF/location data); videos must be MP4 (see isMp4).
 */
export async function saveUpload(file: File, { userId, videoShape }: { userId: string; videoShape: "portrait" | "wide" }): Promise<MediaItem> {
  const portraitVideo = videoShape === "portrait";
  const buf = Buffer.from(await file.arrayBuffer());
  const id = randomBytes(16).toString("hex");
  await mkdir(resolve(env.uploadDir), { recursive: true });
  let item: MediaItem;
  let name: string;
  let bytes: number;
  if (isMp4(buf)) {
    if (buf.length > MAX_VIDEO_BYTES) throw new Error("حجم الفيديو أكبر من 30 ميقا");
    name = `${id}.mp4`;
    bytes = buf.length;
    await writeFile(uploadPath(name), buf);
    item = { type: "video", src: `/media/${name}`, w: portraitVideo ? 720 : 1280, h: portraitVideo ? 1280 : 720 };
  } else {
    if (buf.length > MAX_IMAGE_BYTES) throw new Error("حجم الصورة أكبر من 12 ميقا");
    let out: { data: Buffer; info: { width: number; height: number } };
    try {
      out = await sharp(buf, { limitInputPixels: 60_000_000 })
        .rotate()
        .resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
    } catch (e) {
      throw new Error("الملف ليس صورة أو فيديو MP4 صالح", { cause: e });
    }
    name = `${id}.webp`;
    bytes = out.data.length;
    await writeFile(uploadPath(name), out.data);
    item = { type: "image", src: `/media/${name}`, w: out.info.width, h: out.info.height };
  }
  try {
    await sql`insert into media (path, kind, width, height, bytes, uploaded_by)
              values (${name}, ${item.type}, ${item.w}, ${item.h}, ${bytes}, ${userId})`;
  } catch (e) {
    // Without its media row the file would be unreachable from the dashboard, so don't leave it behind.
    await deleteFile(name).catch((cleanup) => console.error("upload cleanup failed", name, cleanup));
    throw e;
  }
  return item;
}

/** Removes uploaded files after the rows that used them are gone. Best effort: failures are logged, not thrown. */
export async function removeUploads(srcs: string[]) {
  for (const src of srcs) {
    await removeUpload(src).catch((e) => console.error(JSON.stringify({ level: "error", event: "upload_remove_failed", src, error: String(e) })));
  }
}

export async function removeUpload(src: string) {
  const name = src.replace(/^\/media\//, "");
  if (!MEDIA_NAME.test(name)) return; // seeded files under /work are part of the code base
  await deleteFile(name);
  await sql`delete from media where path = ${name}`;
}
