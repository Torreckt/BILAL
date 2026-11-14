import QRCode from "qrcode";
import { decrypt, encrypt, newTotpSecret, totpUri } from "./crypto";
import { sql } from "./db";

/** For first sign-in: the QR code of the account's not-yet-enabled secret (created on first visit). Server pages only. */
export async function enrollmentQr(userId: string, email: string) {
  let [{ totp_secret: packed }] = await sql<{ totp_secret: string | null }[]>`select totp_secret from users where id = ${userId}`;
  if (!packed) {
    packed = encrypt(newTotpSecret());
    await sql`update users set totp_secret = ${packed} where id = ${userId} and not totp_enabled`;
  }
  const secret = decrypt(packed);
  return { secret, qr: await QRCode.toDataURL(totpUri(secret, email), { margin: 1, width: 220 }) };
}
