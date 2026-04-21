import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/validation";

export async function enforceRateLimit(input: {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
  blockMs: number;
}) {
  const now = new Date();

  const bucket = await prisma.rateLimitBucket.findUnique({
    where: {
      scope_key: {
        scope: input.scope,
        key: input.key,
      },
    },
  });

  if (!bucket) {
    await prisma.rateLimitBucket.create({
      data: {
        scope: input.scope,
        key: input.key,
        count: 1,
        windowStart: now,
      },
    });
    return;
  }

  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    throw new ValidationError(`${input.scope}-rate-limited`, `${input.scope} is temporarily rate limited.`);
  }

  const windowExpired = now.getTime() - bucket.windowStart.getTime() >= input.windowMs;
  const nextCount = windowExpired ? 1 : bucket.count + 1;

  if (!windowExpired && nextCount > input.limit) {
    const blockedUntil = new Date(now.getTime() + input.blockMs);
    await prisma.rateLimitBucket.update({
      where: { id: bucket.id },
      data: {
        count: nextCount,
        blockedUntil,
      },
    });
    throw new ValidationError(`${input.scope}-rate-limited`, `${input.scope} is temporarily rate limited.`);
  }

  await prisma.rateLimitBucket.update({
    where: { id: bucket.id },
    data: {
      count: nextCount,
      windowStart: windowExpired ? now : bucket.windowStart,
      blockedUntil: windowExpired ? null : bucket.blockedUntil,
    },
  });
}
