import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { env } from "./env";

const SCRYPT_COST = 32768;
const scrypt = (pw: string, salt: Buffer) =>
  new Promise<Buffer>((ok, fail) =>
    scryptCb(pw.normalize("NFKC"), salt, 32, { N: SCRYPT_COST, r: 8, p: 1, maxmem: 128 * 1024 * 1024 }, (e, k) => (e ? fail(e) : ok(k))),
  );

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `scrypt$${SCRYPT_COST}$${salt.toString("base64")}$${(await scrypt(pw, salt)).toString("base64")}`;
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

// AES-256-GCM for secrets at rest (TOTP seeds).
const encryptionKey = () => createHash("sha256").update(`enc:${env.appSecret}`).digest();
export function encrypt(text: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const body = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), body].map((b) => b.toString("base64")).join(".");
}
export function decrypt(packed: string) {
  const [iv, tag, body] = packed.split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}

// TOTP (RFC 6238): SHA-1, 6 digits, 30-second steps — what authenticator apps expect.
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function newTotpSecret() {
  let bits = "";
  for (const b of randomBytes(20)) bits += b.toString(2).padStart(8, "0");
  return bits.match(/.{5}/g)!.map((chunk) => BASE32_ALPHABET[parseInt(chunk, 2)]).join("");
}
function base32Decode(s: string) {
  let bits = "";
  for (const ch of s.replace(/=+$/, "").toUpperCase()) bits += BASE32_ALPHABET.indexOf(ch).toString(2).padStart(5, "0");
  return Buffer.from(bits.match(/.{8}/g)?.map((b) => parseInt(b, 2)) ?? []);
}
export function totpAt(secret: string, step: number) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac("sha1", base32Decode(secret)).update(msg).digest();
  const offset = hmac[19] & 15; // RFC 4226 dynamic truncation
  return String((hmac.readUInt32BE(offset) & 0x7fffffff) % 1e6).padStart(6, "0");
}
/** Returns the matched time step (to reject replays), or null. Accepts one step of clock drift. */
export function verifyTotp(secret: string, code: string, lastStep = 0, now = Date.now()) {
  const step = Math.floor(now / 30000);
  const want = Buffer.from(code.replace(/\s/g, "").padStart(6, "0").slice(0, 6));
  for (const s of [step, step - 1, step + 1]) {
    if (s > lastStep && timingSafeEqual(Buffer.from(totpAt(secret, s)), want)) return s;
  }
  return null;
}
export const totpUri = (secret: string, email: string) =>
  `otpauth://totp/${encodeURIComponent(`Mainstream:${email}`)}?secret=${secret}&issuer=Mainstream`;
