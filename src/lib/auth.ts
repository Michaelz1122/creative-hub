import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/validation";

const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-creative_hub_session" : "creative_hub_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const SESSION_REFRESH_MS = 1000 * 60 * 60 * 12;
const ADMIN_PERMISSION_KEYS = [
  "users.manage",
  "payments.review",
  "tracks.manage",
  "roadmap.manage",
  "memberships.manage",
  "feedback.manage",
  "content.manage",
  "coupons.manage",
  "quizzes.manage",
  "plans.manage",
  "roles.manage",
] as const;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getPasswordPepper() {
  return process.env.AUTH_PASSWORD_PEPPER || "";
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildPasswordPayload(password: string, salt: string) {
  return scryptSync(`${password}${getPasswordPepper()}`, salt, 64).toString("hex");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = buildPasswordPayload(password, salt);
  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, passwordHash: string | null | undefined) {
  if (!passwordHash) {
    return false;
  }

  const [algorithm, salt, storedHash] = passwordHash.split(":");
  if (algorithm !== "scrypt" || !salt || !storedHash) {
    return false;
  }

  const derivedKey = buildPasswordPayload(password, salt);
  return timingSafeEqual(Buffer.from(derivedKey, "hex"), Buffer.from(storedHash, "hex"));
}

export async function getRequestContext() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const userAgent = requestHeaders.get("user-agent") || "unknown";

  return {
    ipAddress,
    userAgent,
  };
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value || null;
}

async function deleteSessionByToken(token: string | null) {
  if (!token) {
    return;
  }

  await prisma.session.deleteMany({
    where: {
      tokenHash: hashSessionToken(token),
    },
  });
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const { ipAddress, userAgent } = await getRequestContext();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  await setSessionCookie(token, expiresAt);
}

async function refreshSessionIfNeeded(sessionId: string, expiresAt: Date) {
  const now = new Date();
  const ageUntilExpiry = expiresAt.getTime() - now.getTime();
  const nextExpiry = new Date(now.getTime() + SESSION_TTL_MS);

  if (ageUntilExpiry <= SESSION_REFRESH_MS) {
    const token = randomBytes(32).toString("base64url");
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        tokenHash: hashSessionToken(token),
        expiresAt: nextExpiry,
        lastSeenAt: now,
      },
    });
    await setSessionCookie(token, nextExpiry);
    return;
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: {
      lastSeenAt: now,
    },
  });
}

export async function invalidateCurrentSession() {
  const token = await getSessionToken();
  await deleteSessionByToken(token);
  await clearSessionCookie();
}

export async function getCurrentUser() {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(token),
    },
    include: {
      user: {
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session) {
    await clearSessionCookie();
    return null;
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({
      where: { id: session.id },
    });
    await clearSessionCookie();
    return null;
  }

  await refreshSessionIfNeeded(session.id, session.expiresAt);
  return session.user;
}

export function getUserPermissionKeys(
  user:
    | Awaited<ReturnType<typeof getCurrentUser>>
    | null
    | undefined,
) {
  return Array.from(
    new Set(
      (user?.userRoles || []).flatMap((entry) =>
        entry.role.rolePermissions.map((rolePermission) => rolePermission.permission.key),
      ),
    ),
  );
}

export function userHasPermission(
  user:
    | Awaited<ReturnType<typeof getCurrentUser>>
    | null
    | undefined,
  permissionKey: string,
) {
  return getUserPermissionKeys(user).includes(permissionKey);
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.isSuspended) {
    await invalidateCurrentSession();
    redirect("/login?error=suspended");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const permissionKeys = getUserPermissionKeys(user);

  if (permissionKeys.length === 0) {
    redirect("/dashboard");
  }

  return user;
}

export async function requirePermission(permissionKey: string) {
  const user = await requireAdmin();

  if (!userHasPermission(user, permissionKey)) {
    redirect("/admin?error=forbidden");
  }

  return user;
}

export async function requireAnyPermission(permissionKeys: readonly string[]) {
  const user = await requireAdmin();
  const currentPermissions = getUserPermissionKeys(user);

  if (!permissionKeys.some((permissionKey) => currentPermissions.includes(permissionKey))) {
    redirect("/dashboard");
  }

  return user;
}

export async function getAvailableAdminPermissions() {
  const user = await requireAdmin();
  return getUserPermissionKeys(user).filter((permission) =>
    ADMIN_PERMISSION_KEYS.includes(permission as (typeof ADMIN_PERMISSION_KEYS)[number]),
  );
}

export async function authenticateWithPassword(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new ValidationError("invalid-credentials", "Email or password is invalid.");
  }

  if (user.isSuspended) {
    throw new ValidationError("suspended", "User is suspended.");
  }

  await createSession(user.id);
  return user;
}
