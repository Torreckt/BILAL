import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { env } from "./env";

const N = 32768;
const scrypt = (pw: string, salt: Buffer) =>
  new Promise<Buffer>((ok, fail) =>
    scryptCb(pw.normalize("NFKC"), salt, 32, { N, r: 8, p: 1, maxmem: 128 * 1024 * 1024 }, (e, k) => (e ? fail(e) : ok(k))),
  );

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `scrypt$${N}$${salt.toString("base64")}$${(await scrypt(pw, salt)).toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [, , salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const want = Buffer.from(hash, "base64");
  const got = await scrypt(pw, Buffer.from(salt, "base64"));
  return want.length === got.length && timingSafeEqual(want, got);
}

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const randomToken = () => randomBytes(32).toString("base64url");
// Keyed hash, so stored IP fingerprints cannot be reversed by trying every address.
export const fingerprint = (s: string) => createHmac("sha256", env.appSecret).update(s).digest("hex").slice(0, 32);
