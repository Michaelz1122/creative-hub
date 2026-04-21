"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getActionErrorCode,
  getFormString,
  parseBooleanField,
  parseIntegerField,
  rethrowRedirectError,
  requireFormString,
  ValidationError,
} from "@/lib/validation";

const QUIZ_SCOPES = ["weekly", "day", "track", "final", "milestone"] as const;
const QUIZ_COMPLETION_RULES = ["pass_score", "completion_only"] as const;
const QUIZ_QUESTION_TYPES = ["multiple_choice", "true_false", "practical_check", "self_assessment"] as const;

function revalidateQuizSurfaces() {
  revalidatePath("/admin/quizzes");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/roadmap");
  revalidatePath("/dashboard/tracks");
}

function parseLiteral<T extends readonly string[]>(formData: FormData, key: string, allowed: T) {
  const value = requireFormString(formData, key);
  if (!allowed.includes(value)) {
    throw new ValidationError(`invalid-${key}`, `${key} is invalid.`);
  }
  return value as T[number];
}

export async function saveQuizAction(formData: FormData) {
  const admin = await requirePermission("quizzes.manage");

  try {
    const quizId = getFormString(formData, "quizId");
    const trackId = requireFormString(formData, "trackId");
    const weekId = getFormString(formData, "weekId") || null;
    const dayId = getFormString(formData, "dayId") || null;

    const [track, week, day] = await Promise.all([
      prisma.track.findUnique({ where: { id: trackId }, select: { id: true } }),
      weekId
        ? prisma.roadmapWeek.findUnique({
            where: { id: weekId },
            select: { id: true, trackId: true },
          })
        : Promise.resolve(null),
      dayId
        ? prisma.roadmapDay.findUnique({
            where: { id: dayId },
            select: { id: true, weekId: true, week: { select: { trackId: true } } },
          })
        : Promise.resolve(null),
    ]);

    if (!track) {
      throw new ValidationError("missing-track", "Track was not found.");
    }

    if (week && week.trackId !== trackId) {
      throw new ValidationError("week-track-mismatch", "Week does not belong to the selected track.");
    }

    if (day && day.week.trackId !== trackId) {
      throw new ValidationError("day-track-mismatch", "Day does not belong to the selected track.");
    }

    if (weekId && day && day.weekId !== weekId) {
      throw new ValidationError("day-week-mismatch", "Day does not belong to the selected week.");
    }

    const data = {
      trackId,
      weekId,
      dayId,
      title: requireFormString(formData, "title", { maxLength: 160 }),
      titleAr: requireFormString(formData, "titleAr", { maxLength: 200 }),
      scope: parseLiteral(formData, "scope", QUIZ_SCOPES),
      passingScore: parseIntegerField(formData, "passingScore", { min: 0, max: 100, fallback: 70 }),
      completionRule: parseLiteral(formData, "completionRule", QUIZ_COMPLETION_RULES),
      isPublished: parseBooleanField(formData, "isPublished"),
    };

    const quiz = quizId
      ? await prisma.quiz.update({
          where: { id: quizId },
          data,
        })
      : await prisma.quiz.create({
          data,
        });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "Quiz",
        entityId: quiz.id,
        action: quizId ? "update" : "create",
        summary: `${quizId ? "Updated" : "Created"} quiz ${quiz.title}`,
      },
    });

    revalidateQuizSurfaces();
    redirect("/admin/quizzes?success=quiz-saved");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/quizzes?error=${getActionErrorCode(error, "quiz-save-failed")}`);
  }
}

export async function deleteQuizAction(formData: FormData) {
  const admin = await requirePermission("quizzes.manage");

  try {
    const quizId = requireFormString(formData, "quizId");

    const quiz = await prisma.quiz.delete({
      where: { id: quizId },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "Quiz",
        entityId: quiz.id,
        action: "delete",
        summary: `Deleted quiz ${quiz.title}`,
      },
    });

    revalidateQuizSurfaces();
    redirect("/admin/quizzes?success=quiz-deleted");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/quizzes?error=${getActionErrorCode(error, "quiz-delete-failed")}`);
  }
}

export async function saveQuizQuestionAction(formData: FormData) {
  const admin = await requirePermission("quizzes.manage");

  try {
    const questionId = getFormString(formData, "questionId");
    const quizId = requireFormString(formData, "quizId");

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true },
    });

    if (!quiz) {
      throw new ValidationError("missing-quiz", "Quiz was not found.");
    }

    const data = {
      order: parseIntegerField(formData, "order", { min: 1, max: 999 }),
      prompt: requireFormString(formData, "prompt", { maxLength: 400 }),
      promptAr: requireFormString(formData, "promptAr", { maxLength: 500 }),
      type: parseLiteral(formData, "type", QUIZ_QUESTION_TYPES),
      explanation: getFormString(formData, "explanation") || null,
      explanationAr: getFormString(formData, "explanationAr") || null,
    };

    const question = questionId
      ? await prisma.quizQuestion.update({
          where: { id: questionId },
          data,
        })
      : await prisma.quizQuestion.create({
          data: {
            quizId,
            ...data,
          },
        });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "QuizQuestion",
        entityId: question.id,
        action: questionId ? "update" : "create",
        summary: `${questionId ? "Updated" : "Created"} quiz question ${question.id}`,
      },
    });

    revalidateQuizSurfaces();
    redirect("/admin/quizzes?success=question-saved");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/quizzes?error=${getActionErrorCode(error, "question-save-failed")}`);
  }
}

export async function deleteQuizQuestionAction(formData: FormData) {
  const admin = await requirePermission("quizzes.manage");

  try {
    const questionId = requireFormString(formData, "questionId");

    const question = await prisma.quizQuestion.delete({
      where: { id: questionId },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "QuizQuestion",
        entityId: question.id,
        action: "delete",
        summary: `Deleted quiz question ${question.id}`,
      },
    });

    revalidateQuizSurfaces();
    redirect("/admin/quizzes?success=question-deleted");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/quizzes?error=${getActionErrorCode(error, "question-delete-failed")}`);
  }
}

export async function saveQuizChoiceAction(formData: FormData) {
  const admin = await requirePermission("quizzes.manage");

  try {
    const choiceId = getFormString(formData, "choiceId");
    const questionId = requireFormString(formData, "questionId");

    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
      select: { id: true },
    });

    if (!question) {
      throw new ValidationError("missing-question", "Question was not found.");
    }

    const data = {
      label: requireFormString(formData, "label", { maxLength: 300 }),
      labelAr: requireFormString(formData, "labelAr", { maxLength: 360 }),
      isCorrect: parseBooleanField(formData, "isCorrect"),
    };

    const choice = choiceId
      ? await prisma.quizChoice.update({
          where: { id: choiceId },
          data,
        })
      : await prisma.quizChoice.create({
          data: {
            questionId,
            ...data,
          },
        });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "QuizChoice",
        entityId: choice.id,
        action: choiceId ? "update" : "create",
        summary: `${choiceId ? "Updated" : "Created"} quiz choice ${choice.id}`,
      },
    });

    revalidateQuizSurfaces();
    redirect("/admin/quizzes?success=choice-saved");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/quizzes?error=${getActionErrorCode(error, "choice-save-failed")}`);
  }
}

export async function deleteQuizChoiceAction(formData: FormData) {
  const admin = await requirePermission("quizzes.manage");

  try {
    const choiceId = requireFormString(formData, "choiceId");

    const choice = await prisma.quizChoice.delete({
      where: { id: choiceId },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: admin.id,
        entityType: "QuizChoice",
        entityId: choice.id,
        action: "delete",
        summary: `Deleted quiz choice ${choice.id}`,
      },
    });

    revalidateQuizSurfaces();
    redirect("/admin/quizzes?success=choice-deleted");
  } catch (error) {
    rethrowRedirectError(error);
    redirect(`/admin/quizzes?error=${getActionErrorCode(error, "choice-delete-failed")}`);
  }
}
