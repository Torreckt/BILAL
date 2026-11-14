// How a work's media list changes when the editor saves: pure, so the rules are testable without a database or files.
import type { MediaItem } from "../content";

type MediaEdit = {
  /** The media currently stored on the work, in display order. */
  existing: MediaItem[];
  /** src values ticked for removal. */
  remove: string[];
  /** Alt text typed for the existing item at index i (empty keeps the stored alt). */
  altFor: (index: number) => string;
  /** Files just uploaded in this save, in upload order. */
  uploaded: MediaItem[];
  /** src the editor marked to show first, if any. */
  firstSrc: string;
};

/**
 * Keep what stays (in the order shown, with edited alt text), drop what was ticked, append the new uploads, move the
 * chosen item to the front, then derive the cover (first image, else the first video's poster) and give posterless
 * videos that cover. Returns the src values that were actually removed, so their files can be deleted after saving.
 */
export function reconcileWorkMedia({ existing, remove, altFor, uploaded, firstSrc }: MediaEdit) {
  const removing = new Set(remove);
  const kept = existing
    .map((m, i) => ({ ...m, alt: altFor(i) || m.alt }))
    .filter((m) => !removing.has(m.src));
  const ordered = [...kept, ...uploaded.map((m) => ({ ...m }))];
  ordered.sort((a, b) => Number(b.src === firstSrc) - Number(a.src === firstSrc));
  const cover = ordered.find((m) => m.type === "image")?.src ?? ordered.find((m) => m.poster)?.poster ?? null;
  const media = ordered.map((m) => (m.type === "video" && !m.poster && cover ? { ...m, poster: cover } : m));
  const removed = existing.filter((m) => removing.has(m.src)).map((m) => m.src);
  return { media, cover, removed };
}
