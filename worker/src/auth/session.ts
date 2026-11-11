const COOKIE = "cs_session";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function b64url(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacSign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64url(sig);
}

export async function createSessionCookie(secret: string): Promise<string> {
  const exp = Date.now() + TTL_MS;
  const payload = b64url(new TextEncoder().encode(JSON.stringify({ sub: "admin", exp })));
  const sig = await hmacSign(secret, payload);
  const val = `${payload}.${sig}`;
  return `${COOKIE}=${val}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${Math.floor(TTL_MS / 1000)}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function verifySession(request: Request, secret: string | undefined): Promise<boolean> {
  if (!secret) return false;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`${COOKIE}=([^;]+)`));
  if (!match) return false;
  const [payload, sig] = match[1].split(".");
  if (!payload || !sig) return false;
  const expected = await hmacSign(secret, payload);
  if (sig.length !== expected.length) return false;
  let ok = 0;
  for (let i = 0; i < sig.length; i++) ok |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (ok !== 0) return false;
  try {
    const json = JSON.parse(new TextDecoder().decode(fromB64url(payload))) as { exp?: number };
    if (!json.exp || json.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

const LOGIN_FAIL_PREFIX = "auth:fail:";

export async function checkLoginRate(kv: KVNamespace | undefined, ip: string): Promise<boolean> {
  if (!kv) return true;
  const raw = await kv.get(`${LOGIN_FAIL_PREFIX}${ip}`);
  const n = raw ? parseInt(raw, 10) : 0;
  return n < 8;
}

export async function recordLoginFail(kv: KVNamespace | undefined, ip: string): Promise<void> {
  if (!kv) return;
  const key = `${LOGIN_FAIL_PREFIX}${ip}`;
  const raw = await kv.get(key);
  const n = raw ? parseInt(raw, 10) + 1 : 1;
  await kv.put(key, String(n), { expirationTtl: 900 });
}

export async function clearLoginFails(kv: KVNamespace | undefined, ip: string): Promise<void> {
  if (!kv) return;
  await kv.delete(`${LOGIN_FAIL_PREFIX}${ip}`);
}
