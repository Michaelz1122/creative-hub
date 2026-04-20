"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function completeTaskAction(formData: FormData) {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") || "");
  const redirectTo = String(formData.get("redirectTo") || "/dashboard");

  if (!taskId) {
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
}

