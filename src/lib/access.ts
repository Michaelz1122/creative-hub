import { MembershipStatus, PlanScope, type Membership, type Plan, type Track } from "@prisma/client";

export type MembershipWithPlan = Membership & {
  plan: Plan & {
    track: Track | null;
  };
};

export type EntitlementSummary = {
  hasAllAccess: boolean;
  activeTrackIds: string[];
  activePlanCodes: string[];
  activeMemberships: MembershipWithPlan[];
};

export function isMembershipActive(membership: MembershipWithPlan, now = new Date()) {
  if (membership.status !== MembershipStatus.ACTIVE) {
    return false;
  }

  if (membership.startsAt && membership.startsAt > now) {
    return false;
  }

  if (membership.expiresAt && membership.expiresAt < now) {
    return false;
  }

  return true;
}

export function getEntitlementSummary(memberships: MembershipWithPlan[]): EntitlementSummary {
  const activeMemberships = memberships.filter((membership) => isMembershipActive(membership));
  const hasAllAccess = activeMemberships.some(
    (membership) => membership.plan.scope === PlanScope.ALL_ACCESS,
  );

  const activeTrackIds = Array.from(
    new Set(
      activeMemberships
        .filter((membership) => membership.plan.scope === PlanScope.TRACK && membership.plan.trackId)
        .map((membership) => membership.plan.trackId as string),
    ),
  );

  return {
    hasAllAccess,
    activeTrackIds,
    activePlanCodes: activeMemberships.map((membership) => membership.plan.code),
    activeMemberships,
  };
}

export function hasTrackAccess(
  entitlements: EntitlementSummary,
  trackId: string | null | undefined,
) {
  if (!trackId) {
    return false;
  }

  return entitlements.hasAllAccess || entitlements.activeTrackIds.includes(trackId);
}

