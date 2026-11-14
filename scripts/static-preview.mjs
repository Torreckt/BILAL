// Saves a look-only static copy of the public pages (no form saving, no dashboard) for hosting under a sub-path,
// e.g. GitHub Pages. Usage:
//   PREVIEW_BASE=/BILAL/preview npx next build
//   PREVIEW_BASE=/BILAL/preview npx next start -p 3001   (in another terminal, with DATABASE_URL set)
//   PREVIEW_BASE=/BILAL/preview node scripts/static-preview.mjs
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = process.env.PREVIEW_BASE;
if (!base) throw new Error("set PREVIEW_BASE");
const origin = `http://localhost:${process.env.PORT ?? 3001}`;
const out = "preview-out";
rmSync(out, { recursive: true, force: true });

const sitemap = await (await fetch(`${origin}${base}/sitemap.xml`)).text();
const routes = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => new URL(m[1]).pathname.replace(base, "") || "/");
for (const route of new Set(["/", ...routes])) {
  let html = await (await fetch(origin + base + route)).text();
  // Our own links and media are written from the site root; point them at the sub-path.
  html = html
    .replace(/((?:href|src|poster)=")\/(?!\/|BILAL\/)/g, `$1${base}/`)
    .replace(/(\\"(?:href|src|poster)\\":\\")\/(?!\/|BILAL\/)/g, `$1${base}/`)
    .replace(/(:HL\[\\")\/(?!\/|BILAL\/)/g, `$1${base}/`); // preload hints
  const dir = join(out, route);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  console.log("saved", route);
}
cpSync(".next-preview/static", join(out, "_next/static"), { recursive: true });
cpSync("public", out, { recursive: true });
writeFileSync(join(out, ".nojekyll"), "");
