import { prisma } from "@/lib/prisma";
import { getEntitlementSummary, hasTrackAccess, type MembershipWithPlan } from "@/lib/access";
import { GRAPHIC_DESIGN_TRACK_SLUG } from "@/lib/seed-constants";

export async function getDashboardData(userId: string) {
  const [user, memberships, tracks, notifications, pendingPayment] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    }),
    prisma.membership.findMany({
      where: { userId },
      include: {
        plan: {
          include: {
            track: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }) as Promise<MembershipWithPlan[]>,
    prisma.track.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
      include: {
        roadmapWeeks: {
          where: { isPublished: true },
          include: {
            days: {
              include: {
                tasks: {
                  include: {
                    completions: {
                      where: { userId },
                    },
                  },
                },
              },
            },
            quizzes: true,
          },
        },
        community: true,
        plans: {
          where: { isActive: true },
        },
      },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.paymentRequest.findFirst({
      where: { userId, status: "SUBMITTED" },
      include: { plan: true },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  if (!user) {
    return null;
  }

  const entitlements = getEntitlementSummary(memberships);

  const decoratedTracks = tracks.map((track) => {
    const accessible = hasTrackAccess(entitlements, track.id);
    const totalTasks = track.roadmapWeeks.flatMap((week) => week.days.flatMap((day) => day.tasks)).length;
    const completedTasks = track.roadmapWeeks
      .flatMap((week) => week.days.flatMap((day) => day.tasks))
      .filter((task) => task.completions.length > 0).length;
    const progressPercent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return {
      ...track,
      accessible,
      totalTasks,
      completedTasks,
      progressPercent,
    };
  });

  const primaryTrack =
    decoratedTracks.find((track) => track.slug === GRAPHIC_DESIGN_TRACK_SLUG) ??
    decoratedTracks.find((track) => track.accessible) ??
    decoratedTracks[0] ??
    null;

  const currentWeek = primaryTrack?.roadmapWeeks.find((week) =>
    week.days.some((day) => day.tasks.some((task) => task.completions.length === 0)),
  ) ?? primaryTrack?.roadmapWeeks[0] ?? null;

  const todayTask: ({
    day: (typeof tracks)[number]["roadmapWeeks"][number]["days"][number];
  } & (typeof tracks)[number]["roadmapWeeks"][number]["days"][number]["tasks"][number]) | null =
    currentWeek?.days
      .flatMap((day) => day.tasks.map((task) => ({ ...task, day })))
      .find((task) => task.completions.length === 0) ??
    (currentWeek?.days[0]?.tasks[0]
      ? { ...currentWeek.days[0].tasks[0], day: currentWeek.days[0] }
      : null) ??
    null;

  return {
    user,
    entitlements,
    tracks: decoratedTracks,
    notifications,
    pendingPayment,
    primaryTrack,
    currentWeek,
    todayTask,
  };
}
