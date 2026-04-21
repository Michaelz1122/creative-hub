"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { requirePermission, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActionErrorCode,
  getFormString,
  getOptionalFormString,
  parseBooleanField,
  parseIntegerField,
  parseStringList,
  rethrowRedirectError,
  requireFormString,
  ValidationError,
} from "@/lib/validation";

function toJsonList(raw: string) {
  const values = parseStringList(raw);
  return values.length > 0 ? values : Prisma.DbNull;
}

function revalidateRoadmapSurfaces(trackSlug?: string | null) {
  revalidatePath("/admin/roadmap");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/roadmap");
  revalidatePath("/dashboard/library");
  revalidatePath("/dashboard/toolkits");
  if (trackSlug) {
    revalidatePath(`/dashboard/tracks/${trackSlug}`);
  }
}

export async function completeTaskAction(formData: FormData) {
  const user = await requireUser();

  try {
    const taskId = requireFormString(formData, "taskId");
    const redirectTo = getFormString(formData, "redirectTo") || "/dashboard";

    const task = await prisma.roadmapTask.findUnique({
      where: { id: taskId },
      include: {
        day: {
          include: {
            week: true,
          },
        },
      },
    });

    if (!task) {
      redirect(redirectTo);
    }

    await prisma.taskCompletion.upsert({
      where: {
        userId_taskId: {
          userId: user.id,
          taskId,
        },
      },
      update: {
        completedAt: new Date(),
      },
      create: {
        userId: user.id,
        taskId,
      },
    });

    redirect(redirectTo);
  } catch (error) {
    rethrowRedirectError(error);
    redirect(getFormString(formData, "redirectTo") || "/dashboard");
  }
}

export async function saveRoadmapWeekAction(formData: FormData) {
  const admin = await requirePermission("roadmap.manage");

  try {
    const weekId = getFormString(formData, "weekId");
    const trackId = requireFormString(formData, "trackId");
    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new ValidationError("missing-track", "Track was not found.");
    }

    const week = weekId
      ? await prisma.roadmapWeek.update({
          where: { id: weekId },
          data: {
            order: parseIntegerField(formData, "order", { min: 1, max: 1000, fallback: 1 }),
            title: requireFormString(formData, "title", { maxLength: 160 }),
            titleAr: requireFormString(formData, "titleAr", { maxLength: 200 }),
            objective: requireFormString(formData, "objective", { maxLength: 1200 }),
            objectiveAr: requireFormString(formData, "objectiveAr", { maxLength: 1200 }),
            explanation: getOptionalFormString(formData, "explanation", 2000),
            explanationAr: getOptionalFormString(formData, "explanationAr", 2000),
            expectedOutcome: getOptionalFormString(formData, "expectedOutcome", 1200),
            expectedOutcomeAr: getOptionalFormString(formData, "expectedOutcomeAr", 1200),
            isPublished: parseBooleanField(formData, "isPublished"),
          },
        })
      : await prisma.roadmapWeek.create({
          data: {
            trackId,
            order: parseIntegerField(formData, "order", { min: 1, max: 1000, fallback: 1 }),
            title: requireFormString(formData, "title", { maxLength: 160 }),
            titleAr: requireFormString(formData, "titleAr", { maxLength: 200 }),
            objective: requireFormString(formData, "objective", { maxLength: 1200 }),
            objectiveAr: requireFormString(formData, "objectiveAr", { maxLength: 1200 }),
            explanation: getOptionalFormString(formData, "explanation", 2000),
            explanationAr: getOptionalFormString(formData, "explanationAr", 2000),
            expectedOutcome: getOptionalFormString(formData, "expectedOutcome", 1200),
            expectedOutcomeAr: getOptionalFormString(formData, "expectedOutcomeAr", 1200),
            isPublished: parseBooleanField(formData, "isPublished"),
          },
        });

    const quizId = getFormString(formData, "quizId");
    const quizTitle = getFormString(formData, "quizTitle");
    const quizTitleAr = getFormString(formData, "quizTitleAr");

    if (quizId || quizTitle || quizTitleAr) {
      const quizData = {
        trackId,
        weekId: week.id,
        dayId: null,
        title: quizTitle || `${week.title} Quiz`,
        titleAr: quizTitleAr || `${week.titleAr} - Quiz`,
        scope: getFormString(formData, "quizScope") || "weekly",
        passingScore: parseIntegerField(formData, "quizPassingScore", { min: 0, max: 100, fallback: 70 }),
        completionRule: "pass_score",
        isPublished: parseBooleanField(formData, "quizIsPublished"),
      };

      if (quizId) {
        await prisma.quiz.update({
          where: { id: quizId },
          data: quizData,
        });
      } else {
        await prisma.quiz.create({
          data: quizData,
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "RoadmapWeek",
        entityId: week.id,
        action: weekId ? "update" : "create",
        summary: `${weekId ? "Updated" : "Created"} roadmap week ${week.title}`,
      },
    });

    revalidateRoadmapSurfaces(track.slug);
    redirect(`/admin/roadmap?track=${trackId}&week=${week.id}&success=week-saved`);
  } catch (error) {
    rethrowRedirectError(error);
    const trackId = getFormString(formData, "trackId");
    redirect(`/admin/roadmap?track=${trackId}&error=${getActionErrorCode(error, "week-save-failed")}`);
  }
}

export async function deleteRoadmapWeekAction(formData: FormData) {
  const admin = await requirePermission("roadmap.manage");

  try {
    const weekId = requireFormString(formData, "weekId");
    const week = await prisma.roadmapWeek.findUnique({
      where: { id: weekId },
      include: { track: true },
    });

    if (!week) {
      throw new ValidationError("missing-week", "Week was not found.");
    }

    await prisma.roadmapWeek.delete({
      where: { id: weekId },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "RoadmapWeek",
        entityId: week.id,
        action: "delete",
        summary: `Deleted roadmap week ${week.title}`,
      },
    });

    revalidateRoadmapSurfaces(week.track.slug);
    redirect(`/admin/roadmap?track=${week.trackId}&success=week-deleted`);
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/roadmap?error=${getActionErrorCode(error, "week-delete-failed")}`);
  }
}

export async function saveRoadmapDayAction(formData: FormData) {
  const admin = await requirePermission("roadmap.manage");

  try {
    const dayId = getFormString(formData, "dayId");
    const weekId = requireFormString(formData, "weekId");
    const week = await prisma.roadmapWeek.findUnique({
      where: { id: weekId },
      include: { track: true },
    });

    if (!week) {
      throw new ValidationError("missing-week", "Week was not found.");
    }

    const day = dayId
      ? await prisma.roadmapDay.update({
          where: { id: dayId },
          data: {
            order: parseIntegerField(formData, "order", { min: 1, max: 1000, fallback: 1 }),
            title: requireFormString(formData, "title", { maxLength: 160 }),
            titleAr: requireFormString(formData, "titleAr", { maxLength: 200 }),
            description: getOptionalFormString(formData, "description", 1200),
            descriptionAr: getOptionalFormString(formData, "descriptionAr", 1200),
            estimatedMinutes: parseIntegerField(formData, "estimatedMinutes", {
              min: 0,
              max: 1440,
              optional: true,
            }),
            isLockedByDefault: parseBooleanField(formData, "isLockedByDefault"),
          },
        })
      : await prisma.roadmapDay.create({
          data: {
            weekId,
            order: parseIntegerField(formData, "order", { min: 1, max: 1000, fallback: 1 }),
            title: requireFormString(formData, "title", { maxLength: 160 }),
            titleAr: requireFormString(formData, "titleAr", { maxLength: 200 }),
            description: getOptionalFormString(formData, "description", 1200),
            descriptionAr: getOptionalFormString(formData, "descriptionAr", 1200),
            estimatedMinutes: parseIntegerField(formData, "estimatedMinutes", {
              min: 0,
              max: 1440,
              optional: true,
            }),
            isLockedByDefault: parseBooleanField(formData, "isLockedByDefault"),
          },
        });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "RoadmapDay",
        entityId: day.id,
        action: dayId ? "update" : "create",
        summary: `${dayId ? "Updated" : "Created"} roadmap day ${day.title}`,
      },
    });

    revalidateRoadmapSurfaces(week.track.slug);
    redirect(`/admin/roadmap?track=${week.trackId}&week=${week.id}&success=day-saved`);
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/roadmap?error=${getActionErrorCode(error, "day-save-failed")}`);
  }
}

export async function deleteRoadmapDayAction(formData: FormData) {
  const admin = await requirePermission("roadmap.manage");

  try {
    const dayId = requireFormString(formData, "dayId");
    const day = await prisma.roadmapDay.findUnique({
      where: { id: dayId },
      include: {
        week: {
          include: {
            track: true,
          },
        },
      },
    });

    if (!day) {
      throw new ValidationError("missing-day", "Day was not found.");
    }

    await prisma.roadmapDay.delete({
      where: { id: dayId },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "RoadmapDay",
        entityId: day.id,
        action: "delete",
        summary: `Deleted roadmap day ${day.title}`,
      },
    });

    revalidateRoadmapSurfaces(day.week.track.slug);
    redirect(`/admin/roadmap?track=${day.week.trackId}&week=${day.weekId}&success=day-deleted`);
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/roadmap?error=${getActionErrorCode(error, "day-delete-failed")}`);
  }
}

export async function saveRoadmapTaskAction(formData: FormData) {
  const admin = await requirePermission("roadmap.manage");

  try {
    const taskId = getFormString(formData, "taskId");
    const dayId = requireFormString(formData, "dayId");
    const day = await prisma.roadmapDay.findUnique({
      where: { id: dayId },
      include: {
        week: {
          include: {
            track: true,
          },
        },
      },
    });

    if (!day) {
      throw new ValidationError("missing-day", "Day was not found.");
    }

    const contentResourceIds = formData
      .getAll("contentResourceIds")
      .map((value) => String(value))
      .filter(Boolean);
    const toolkitResourceIds = formData
      .getAll("toolkitResourceIds")
      .map((value) => String(value))
      .filter(Boolean);

    const task = await prisma.$transaction(async (tx) => {
      const savedTask = taskId
        ? await tx.roadmapTask.update({
            where: { id: taskId },
            data: {
              order: parseIntegerField(formData, "order", { min: 1, max: 1000, fallback: 1 }),
              title: requireFormString(formData, "title", { maxLength: 160 }),
              titleAr: requireFormString(formData, "titleAr", { maxLength: 200 }),
              whyItMatters: getOptionalFormString(formData, "whyItMatters", 1200),
              whyItMattersAr: getOptionalFormString(formData, "whyItMattersAr", 1200),
              instructions: requireFormString(formData, "instructions", { maxLength: 4000 }),
              instructionsAr: requireFormString(formData, "instructionsAr", { maxLength: 4000 }),
              expectedOutput: getOptionalFormString(formData, "expectedOutput", 1200),
              expectedOutputAr: getOptionalFormString(formData, "expectedOutputAr", 1200),
              estimatedMinutes: parseIntegerField(formData, "estimatedMinutes", {
                min: 0,
                max: 1440,
                optional: true,
              }),
              helpNotes: getOptionalFormString(formData, "helpNotes", 2000),
              helpNotesAr: getOptionalFormString(formData, "helpNotesAr", 2000),
              commonIssues: toJsonList(getFormString(formData, "commonIssues")),
              checklist: toJsonList(getFormString(formData, "checklist")),
            },
          })
        : await tx.roadmapTask.create({
            data: {
              dayId,
              order: parseIntegerField(formData, "order", { min: 1, max: 1000, fallback: 1 }),
              title: requireFormString(formData, "title", { maxLength: 160 }),
              titleAr: requireFormString(formData, "titleAr", { maxLength: 200 }),
              whyItMatters: getOptionalFormString(formData, "whyItMatters", 1200),
              whyItMattersAr: getOptionalFormString(formData, "whyItMattersAr", 1200),
              instructions: requireFormString(formData, "instructions", { maxLength: 4000 }),
              instructionsAr: requireFormString(formData, "instructionsAr", { maxLength: 4000 }),
              expectedOutput: getOptionalFormString(formData, "expectedOutput", 1200),
              expectedOutputAr: getOptionalFormString(formData, "expectedOutputAr", 1200),
              estimatedMinutes: parseIntegerField(formData, "estimatedMinutes", {
                min: 0,
                max: 1440,
                optional: true,
              }),
              helpNotes: getOptionalFormString(formData, "helpNotes", 2000),
              helpNotesAr: getOptionalFormString(formData, "helpNotesAr", 2000),
              commonIssues: toJsonList(getFormString(formData, "commonIssues")),
              checklist: toJsonList(getFormString(formData, "checklist")),
            },
          });

      await tx.roadmapResourceLink.deleteMany({
        where: { taskId: savedTask.id },
      });

      if (contentResourceIds.length > 0) {
        await tx.roadmapResourceLink.createMany({
          data: contentResourceIds.map((contentItemId) => ({
            taskId: savedTask.id,
            contentItemId,
            label: "Linked content",
          })),
        });
      }

      if (toolkitResourceIds.length > 0) {
        await tx.roadmapResourceLink.createMany({
          data: toolkitResourceIds.map((toolkitItemId) => ({
            taskId: savedTask.id,
            toolkitItemId,
            label: "Linked toolkit",
          })),
        });
      }

      return savedTask;
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "RoadmapTask",
        entityId: task.id,
        action: taskId ? "update" : "create",
        summary: `${taskId ? "Updated" : "Created"} roadmap task ${task.title}`,
      },
    });

    revalidateRoadmapSurfaces(day.week.track.slug);
    redirect(`/admin/roadmap?track=${day.week.trackId}&week=${day.weekId}&success=task-saved`);
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/roadmap?error=${getActionErrorCode(error, "task-save-failed")}`);
  }
}

export async function deleteRoadmapTaskAction(formData: FormData) {
  const admin = await requirePermission("roadmap.manage");

  try {
    const taskId = requireFormString(formData, "taskId");
    const task = await prisma.roadmapTask.findUnique({
      where: { id: taskId },
      include: {
        day: {
          include: {
            week: {
              include: {
                track: true,
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new ValidationError("missing-task", "Task was not found.");
    }

    await prisma.roadmapTask.delete({
      where: { id: taskId },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "RoadmapTask",
        entityId: task.id,
        action: "delete",
        summary: `Deleted roadmap task ${task.title}`,
      },
    });

    revalidateRoadmapSurfaces(task.day.week.track.slug);
    redirect(`/admin/roadmap?track=${task.day.week.trackId}&week=${task.day.weekId}&success=task-deleted`);
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/roadmap?error=${getActionErrorCode(error, "task-delete-failed")}`);
  }
}
