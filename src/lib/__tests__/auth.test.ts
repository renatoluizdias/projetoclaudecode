// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify, SignJWT } from "jose";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  set: vi.fn(),
  get: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: () => mockCookieStore,
}));

beforeEach(() => {
  mockCookieStore.set.mockClear();
  mockCookieStore.get.mockClear();
});

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function makeToken(payload: object, expiresIn = "7d") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

// --- createSession ---

test("createSession sets an httpOnly cookie", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "user@example.com");

  expect(mockCookieStore.set).toHaveBeenCalledOnce();
  const [name, , options] = mockCookieStore.set.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(options.httpOnly).toBe(true);
});

test("createSession cookie has lax sameSite and root path", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "user@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession cookie expires in ~7 days", async () => {
  const { createSession } = await import("@/lib/auth");
  const before = Date.now();

  await createSession("user-1", "user@example.com");

  const [, , options] = mockCookieStore.set.mock.calls[0];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const diff = (options.expires as Date).getTime() - before;
  expect(diff).toBeGreaterThanOrEqual(sevenDaysMs - 1000);
  expect(diff).toBeLessThanOrEqual(sevenDaysMs + 1000);
});

test("createSession token contains userId and email", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-42", "test@example.com");

  const [, token] = mockCookieStore.set.mock.calls[0];
  const { payload } = await jwtVerify(token as string, JWT_SECRET);
  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("test@example.com");
});

test("createSession token uses HS256 algorithm", async () => {
  const { createSession } = await import("@/lib/auth");

  await createSession("user-1", "user@example.com");

  const [, token] = mockCookieStore.set.mock.calls[0];
  const { protectedHeader } = await jwtVerify(token as string, JWT_SECRET);
  expect(protectedHeader.alg).toBe("HS256");
});

// --- getSession ---

test("getSession returns null when cookie is absent", async () => {
  const { getSession } = await import("@/lib/auth");
  mockCookieStore.get.mockReturnValue(undefined);

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null when token is invalid", async () => {
  const { getSession } = await import("@/lib/auth");
  mockCookieStore.get.mockReturnValue({ value: "not-a-valid-jwt" });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null when token is expired", async () => {
  const { getSession } = await import("@/lib/auth");
  const token = await makeToken(
    { userId: "user-1", email: "user@example.com" },
    "-1s"
  );
  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns SessionPayload for valid token", async () => {
  const { getSession } = await import("@/lib/auth");
  const token = await makeToken({ userId: "user-99", email: "valid@example.com" });
  mockCookieStore.get.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session).not.toBeNull();
  expect(session?.userId).toBe("user-99");
  expect(session?.email).toBe("valid@example.com");
});

test("getSession reads the auth-token cookie by name", async () => {
  const { getSession } = await import("@/lib/auth");
  mockCookieStore.get.mockReturnValue(undefined);

  await getSession();

  expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
});
