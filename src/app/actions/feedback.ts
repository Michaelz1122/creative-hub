"use server";

import { redirect } from "next/navigation";

import { getEntitlementSummary, hasTrackAccess, type MembershipWithPlan } from "@/lib/access";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function createFeedbackThreadAction(formData: FormData) {
  const user = await requireUser();
  const trackId = String(formData.get("trackId") || "");
  const roadmapTaskId = String(formData.get("roadmapTaskId") || "").trim();
  const type = String(formData.get("type") || "project");
  const title = String(formData.get("title") || "").trim();
  const submissionUrl = String(formData.get("submissionUrl") || "").trim();
  const note = String(formData.get("note") || "").trim();

  if (!trackId || !title || !note) {
    redirect("/dashboard/feedback?error=missing-fields");
  }

  const memberships = (await prisma.membership.findMany({
    where: { userId: user.id },
    include: {
      plan: {
        include: {
          track: true,
        },
      },
    },
  })) as MembershipWithPlan[];

  if (!hasTrackAccess(getEntitlementSummary(memberships), trackId)) {
    redirect("/dashboard/feedback?error=no-access");
  }

  const linkedTask = roadmapTaskId
    ? await prisma.roadmapTask.findFirst({
        where: {
          id: roadmapTaskId,
          day: {
            week: {
              trackId,
            },
          },
        },
      })
    : null;

  if (roadmapTaskId && !linkedTask) {
    redirect("/dashboard/feedback?error=invalid-task");
  }

  const thread = await prisma.feedbackThread.create({
    data: {
      userId: user.id,
      trackId,
      roadmapTaskId: linkedTask?.id ?? null,
      type,
      title,
      submissionUrl: submissionUrl || null,
      note,
      messages: {
        create: {
          authorUserId: user.id,
          authorRole: "learner",
          body: note,
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      entityType: "FeedbackThread",
      entityId: thread.id,
      action: "create",
      summary: `Learner created feedback thread ${thread.title}`,
    },
  });

  redirect("/dashboard/feedback?success=created");
}

export async function adminRespondToFeedbackAction(formData: FormData) {
  const admin = await requireAdmin();
  const threadId = String(formData.get("threadId") || "");
  const status = String(formData.get("status") || "").trim();
  const reply = String(formData.get("reply") || "").trim();

  if (!threadId) {
    redirect("/admin/feedback?error=missing-thread");
  }

  const thread = await prisma.feedbackThread.findUnique({
    where: { id: threadId },
  });

  if (!thread) {
    redirect("/admin/feedback?error=missing-thread");
  }

  await prisma.$transaction(async (tx) => {
    if (reply) {
      await tx.feedbackMessage.create({
        data: {
          threadId,
          authorUserId: admin.id,
          authorRole: "admin",
          body: reply,
        },
      });
    }

    const nextStatus = status || thread.status;
    await tx.feedbackThread.update({
      where: { id: threadId },
      data: {
        status: nextStatus as typeof thread.status,
      },
    });

    await tx.notification.create({
      data: {
        userId: thread.userId,
        type: "FEEDBACK",
        title: "Feedback updated",
        titleAr: "تم تحديث طلب الفيدباك",
        body: reply || `Status changed to ${nextStatus}.`,
        bodyAr: reply || `تم تحديث حالة الطلب إلى ${nextStatus}.`,
        href: "/dashboard/feedback",
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "FeedbackThread",
        entityId: thread.id,
        action: "respond",
        summary: `Admin updated feedback ${thread.title}`,
      },
    });
  });

  redirect("/admin/feedback?success=updated");
}
