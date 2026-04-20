import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { ADMIN_EMAIL } from "@/lib/seed-constants";

const SESSION_COOKIE = "creative_hub_session";

type SessionPayload = {
  userId: string;
  email: string;
  roleNames: string[];
};

function getSecret() {
  const secret = process.env.JWT_SECRET || "creative-hub-dev-secret";
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<SessionPayload>(token, getSecret());
    return verified.payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSessionPayload();

  if (!session?.userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  const roleNames = user.userRoles.map((entry) => entry.role.name);

  if (!roleNames.includes("super_admin") && !roleNames.includes("payment_reviewer")) {
    redirect("/dashboard");
  }

  return user;
}

export async function signInWithEmail(email: string, name?: string | null) {
  const normalizedEmail = email.trim().toLowerCase();

  const baseUser = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name: name?.trim() || undefined,
    },
    create: {
      email: normalizedEmail,
      name: name?.trim() || null,
    },
  });

  if (normalizedEmail === ADMIN_EMAIL) {
    const superAdminRole = await prisma.role.findUnique({
      where: { name: "super_admin" },
    });

    if (superAdminRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: baseUser.id,
            roleId: superAdminRole.id,
          },
        },
        update: {},
        create: {
          userId: baseUser.id,
          roleId: superAdminRole.id,
        },
      });
    }
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: baseUser.id },
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  const token = await createSessionToken({
    userId: user.id,
    email: user.email,
    roleNames: user.userRoles.map((entry) => entry.role.name),
  });

  await setSessionCookie(token);
  return user;
}
