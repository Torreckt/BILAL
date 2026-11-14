import Image from "next/image";
import { preload } from "react-dom";
import type { MediaItem, Work } from "@/lib/content";

/** Portfolio card in the "client file" style. `preview` keeps draft links inside preview mode. */
export function WorkCard({ work, preview = false, priority = false }: { work: Work; preview?: boolean; priority?: boolean }) {
  return (
    <li className="work">
      <a className="work__link" href={`/work/${work.slug}${preview ? "?preview=1" : ""}`}>
        <span className="work__tab">{work.category || "عمل"}</span>
        <span className="work__shot">
          {work.cover && (
            <Image src={work.cover} alt="" fill sizes="(max-width: 600px) 92vw, (max-width: 1100px) 46vw, 420px" priority={priority} />
          )}
          {work.media[0]?.type === "video" && (
            <span className="work__play" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
              </svg>
            </span>
          )}
        </span>
        <span className="work__body">
          <span className="work__title">{work.title}</span>
          <span className="work__summary">{work.summary}</span>
          {work.status === "draft" && <span className="work__draft">مسودة</span>}
        </span>
      </a>
    </li>
  );
}

/** One image or video at its own proportions. Videos load only when the visitor presses play. */
export function WorkMedia({ item, priority = false }: { item: MediaItem; priority?: boolean }) {
  const portrait = item.h > item.w;
  // The first video's poster is the biggest thing on screen: fetch it early instead of waiting for the player.
  if (priority && item.type === "video" && item.poster) preload(item.poster, { as: "image", fetchPriority: "high" });
  return (
    <figure className={`shot ${portrait ? "shot--portrait" : "shot--wide"}`} style={{ aspectRatio: `${item.w} / ${item.h}` }}>
      {item.type === "video" ? (
        <video controls playsInline preload="none" poster={item.poster} aria-label={item.alt}>
          <source src={item.src} type="video/mp4" />
        </video>
      ) : (
        <Image
          src={item.src}
          alt={item.alt ?? ""}
          width={item.w}
          height={item.h}
          sizes={portrait ? "(max-width: 700px) 92vw, 420px" : "(max-width: 1100px) 92vw, 900px"}
          priority={priority}
        />
      )}
    </figure>
  );
}
