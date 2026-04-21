"use server";

import { FeedbackStatus } from "@prisma/client";
import { redirect } from "next/navigation";

import { getEntitlementSummary, hasTrackAccess, type MembershipWithPlan } from "@/lib/access";
import { requirePermission, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActionErrorCode,
  getFormString,
  parseUrlField,
  rethrowRedirectError,
  requireFormString,
  ValidationError,
} from "@/lib/validation";

const FEEDBACK_TYPES = ["project", "portfolio", "design-file"] as const;

function parseFeedbackType(formData: FormData) {
  const value = requireFormString(formData, "type");

  if (!FEEDBACK_TYPES.includes(value as (typeof FEEDBACK_TYPES)[number])) {
    throw new ValidationError("invalid-type", "Feedback type is invalid.");
  }

  return value;
}

function parseFeedbackStatus(formData: FormData) {
  const value = requireFormString(formData, "status");

  if (!Object.values(FeedbackStatus).includes(value as FeedbackStatus)) {
    throw new ValidationError("invalid-status", "Feedback status is invalid.");
  }

  return value as FeedbackStatus;
}

export async function createFeedbackThreadAction(formData: FormData) {
  const user = await requireUser();

  try {
    const trackId = requireFormString(formData, "trackId");
    const roadmapTaskId = getFormString(formData, "roadmapTaskId");
    const title = requireFormString(formData, "title", { minLength: 4, maxLength: 180 });
    const note = requireFormString(formData, "note", { minLength: 10, maxLength: 2400 });

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
      throw new ValidationError("no-access", "You do not have access to this track.");
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
      throw new ValidationError("invalid-task", "Linked task is invalid.");
    }

    const thread = await prisma.feedbackThread.create({
      data: {
        userId: user.id,
        trackId,
        roadmapTaskId: linkedTask?.id ?? null,
        type: parseFeedbackType(formData),
        title,
        submissionUrl: parseUrlField(formData, "submissionUrl", { optional: true }),
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
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/dashboard/feedback?error=${getActionErrorCode(error, "feedback-create-failed")}`);
  }
}

export async function adminRespondToFeedbackAction(formData: FormData) {
  const admin = await requirePermission("feedback.manage");

  try {
    const threadId = requireFormString(formData, "threadId");
    const status = parseFeedbackStatus(formData);
    const reply = getFormString(formData, "reply");

    const thread = await prisma.feedbackThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new ValidationError("missing-thread", "Feedback thread was not found.");
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

      await tx.feedbackThread.update({
        where: { id: threadId },
        data: {
          status,
        },
      });

      await tx.notification.create({
        data: {
          userId: thread.userId,
          type: "FEEDBACK",
          title: "Feedback updated",
          titleAr: "تم تحديث طلب الفيدباك",
          body: reply || `Status changed to ${status}.`,
          bodyAr: reply || `تم تحديث حالة الطلب إلى ${status}.`,
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
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/feedback?error=${getActionErrorCode(error, "feedback-update-failed")}`);
  }
}
