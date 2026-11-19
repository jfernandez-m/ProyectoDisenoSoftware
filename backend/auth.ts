// Accounts and sessions live in Deno KV, the key-value database built into Deno.
const kv = await Deno.openKv();

const SESSION_SECONDS = 7 * 24 * 60 * 60; // 7 days
// Slow on purpose: makes guessing passwords from a stolen hash expensive (OWASP: >= 600,000).
const PBKDF2_ITERATIONS = 600_000;

type User = {
  username: string; // lowercase letters, numbers and "_"; Google accounts use "google:<id>"
  name: string; // what we show in the header
  passwordHash?: string; // "salt:hash" in hex; missing for Google accounts
};

// --- Passwords: we never store them, only a salted PBKDF2 hash (Web Crypto, built into Deno) ---

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(hex.match(/../g) ?? [], (pair) => parseInt(pair, 16));
}

async function pbkdf2(password: string, salt: Uint8Array<ArrayBuffer>): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

async function hashPassword(password: string): Promise<string> {
  // A random salt per user means two equal passwords produce different hashes.
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `${toHex(salt)}:${await pbkdf2(password, salt)}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  return await pbkdf2(password, fromHex(salt)) === hash;
}

// --- Sessions: a random id in an HttpOnly cookie, pointing to the username in KV ---

function publicUser(user: User) {
  return { username: user.username, name: user.name }; // never send the password hash
}

async function startSession(user: User): Promise<Response> {
  const sessionId = crypto.randomUUID();
  await kv.set(["sessions", sessionId], user.username, { expireIn: SESSION_SECONDS * 1000 });
  return Response.json(publicUser(user), {
    headers: {
      // HttpOnly: JavaScript can't read it. SameSite=Lax: other sites can't send it in a POST.
      "Set-Cookie":
        `session=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}`,
    },
  });
}

function sessionId(request: Request): string | undefined {
  return request.headers.get("Cookie")?.match(/(?:^|;\s*)session=([^;]+)/)?.[1];
}

export async function currentUser(request: Request): Promise<User | null> {
  const id = sessionId(request);
  if (!id) return null;
  const username = (await kv.get<string>(["sessions", id])).value;
  if (!username) return null;
  return (await kv.get<User>(["users", username])).value;
}

// --- Endpoints. Errors are codes, so the frontend shows them in the user's language ---

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// 3 to 20 characters. No ":", so a local username can never collide with "google:<id>".
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

// POST /api/auth/register  { username, password }
export async function register(request: Request): Promise<Response> {
  const body = await readJson(request);
  const username = String(body?.username ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  if (!USERNAME_PATTERN.test(username) || password.length < 8 || password.length > 128) {
    return Response.json({ error: "invalidInput" }, { status: 400 });
  }

  const user: User = { username, name: username, passwordHash: await hashPassword(password) };
  // Atomic "create only if missing": two sign-ups with the same username can't both win.
  const result = await kv.atomic()
    .check({ key: ["users", username], versionstamp: null })
    .set(["users", username], user)
    .commit();
  if (!result.ok) {
    return Response.json({ error: "usernameTaken" }, { status: 409 });
  }
  return startSession(user);
}

// POST /api/auth/login  { username, password }
export async function login(request: Request): Promise<Response> {
  const body = await readJson(request);
  const username = String(body?.username ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");

  const user = (await kv.get<User>(["users", username])).value;
  // Same answer for "no such user" and "wrong password": nobody can probe which usernames exist.
  if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return Response.json({ error: "invalidCredentials" }, { status: 401 });
  }
  return startSession(user);
}

// POST /api/auth/logout
export async function logout(request: Request): Promise<Response> {
  const id = sessionId(request);
  if (id) await kv.delete(["sessions", id]);
  return new Response(null, {
    status: 204,
    headers: { "Set-Cookie": "session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" },
  });
}

// GET /api/auth/me
export async function me(request: Request): Promise<Response> {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "notLoggedIn" }, { status: 401 });
  return Response.json(publicUser(user));
}
