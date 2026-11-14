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

/**
 * Stores a file uploaded from the dashboard. The type is decided by the file's real content, never its name:
 * images are decoded and re-encoded to WebP (which also drops EXIF/location data); videos must be MP4.
 */
export async function saveUpload(file: File, userId: string, portraitVideo: boolean): Promise<MediaItem> {
  const buf = Buffer.from(await file.arrayBuffer());
  const id = randomBytes(16).toString("hex");
  await mkdir(resolve(env.uploadDir), { recursive: true });
  let item: MediaItem;
  let name: string;
  let bytes: number;
  if (buf.subarray(4, 8).toString("latin1") === "ftyp") {
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
    } catch {
      throw new Error("الملف ليس صورة أو فيديو MP4 صالح");
    }
    name = `${id}.webp`;
    bytes = out.data.length;
    await writeFile(uploadPath(name), out.data);
    item = { type: "image", src: `/media/${name}`, w: out.info.width, h: out.info.height };
  }
  await sql`insert into media (path, kind, width, height, bytes, uploaded_by)
            values (${name}, ${item.type}, ${item.w}, ${item.h}, ${bytes}, ${userId})`;
  return item;
}

export async function removeUpload(src: string) {
  const name = src.replace(/^\/media\//, "");
  if (!MEDIA_NAME.test(name)) return; // seeded files under /work are part of the code base
  await unlink(uploadPath(name)).catch(() => {});
  await sql`delete from media where path = ${name}`;
}
