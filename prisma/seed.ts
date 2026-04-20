import { ContentType, PlanScope, ResourceDifficulty, TrackStatus } from "@prisma/client";

import { prisma } from "../src/lib/prisma";
import { graphicDesignRoadmapSeed } from "../src/lib/roadmap-data";
import {
  ADMIN_EMAIL,
  ALL_ACCESS_PLAN_CODE,
  GRAPHIC_DESIGN_PLAN_CODE,
  GRAPHIC_DESIGN_TRACK_SLUG,
  LEARNER_EMAIL,
} from "../src/lib/seed-constants";

async function main() {
  let firstRoadmapTaskId: string | null = null;
  const permissionSeeds = [
    ["payments.review", "Review payments", "payments"],
    ["tracks.manage", "Manage tracks", "tracks"],
    ["roadmap.manage", "Manage roadmap", "roadmap"],
    ["memberships.manage", "Manage memberships", "memberships"],
    ["feedback.manage", "Manage feedback", "feedback"],
    ["content.manage", "Manage content", "content"],
  ] as const;

  for (const [key, label, group] of permissionSeeds) {
    await prisma.permission.upsert({
      where: { key },
      update: { label, group },
      create: { key, label, group },
    });
  }

  const superAdmin = await prisma.role.upsert({
    where: { name: "super_admin" },
    update: { label: "Super Admin", isSystem: true },
    create: {
      name: "super_admin",
      label: "Super Admin",
      isSystem: true,
    },
  });

  const paymentReviewer = await prisma.role.upsert({
    where: { name: "payment_reviewer" },
    update: { label: "Payment Reviewer", isSystem: true },
    create: {
      name: "payment_reviewer",
      label: "Payment Reviewer",
      isSystem: true,
    },
  });

  const permissions = await prisma.permission.findMany();

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdmin.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: superAdmin.id,
        permissionId: permission.id,
      },
    });
  }

  const reviewPermission = permissions.find((permission) => permission.key === "payments.review");
  if (reviewPermission) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: paymentReviewer.id,
          permissionId: reviewPermission.id,
        },
      },
      update: {},
      create: {
        roleId: paymentReviewer.id,
        permissionId: reviewPermission.id,
      },
    });
  }

  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { name: "Creative Hub Admin" },
    create: {
      email: ADMIN_EMAIL,
      name: "Creative Hub Admin",
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: superAdmin.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: superAdmin.id,
    },
  });

  const learnerUser = await prisma.user.upsert({
    where: { email: LEARNER_EMAIL },
    update: { name: "Creative Hub Learner" },
    create: {
      email: LEARNER_EMAIL,
      name: "Creative Hub Learner",
    },
  });

  const track = await prisma.track.upsert({
    where: { slug: GRAPHIC_DESIGN_TRACK_SLUG },
    update: {
      status: TrackStatus.ACTIVE,
      summary: "Graphic Design is the first active track for paid learners.",
      summaryAr: "الجرافيك ديزاين هو أول مسار متاح فعليًا للمشتركين.",
      roadmapLengthDays: 60,
      accentColor: "#f3b63f",
    },
    create: {
      slug: GRAPHIC_DESIGN_TRACK_SLUG,
      name: "Graphic Design",
      nameAr: "الجرافيك ديزاين",
      summary: "Graphic Design is the first active track for paid learners.",
      summaryAr: "الجرافيك ديزاين هو أول مسار متاح فعليًا للمشتركين.",
      status: TrackStatus.ACTIVE,
      isFeatured: true,
      roadmapLengthDays: 60,
      accentColor: "#f3b63f",
    },
  });

  await prisma.trackCommunity.upsert({
    where: { trackId: track.id },
    update: {
      label: "Graphic Design WhatsApp Community",
      description: "Members-only WhatsApp community for Graphic Design learners.",
      inviteUrl: "https://chat.whatsapp.com/example-creative-hub-design",
      isEnabled: true,
    },
    create: {
      trackId: track.id,
      label: "Graphic Design WhatsApp Community",
      description: "Members-only WhatsApp community for Graphic Design learners.",
      inviteUrl: "https://chat.whatsapp.com/example-creative-hub-design",
      isEnabled: true,
    },
  });

  const graphicDesignPlan = await prisma.plan.upsert({
    where: { code: GRAPHIC_DESIGN_PLAN_CODE },
    update: {
      priceCents: 499,
      currency: "EGP",
      scope: PlanScope.TRACK,
      trackId: track.id,
      isActive: true,
    },
    create: {
      code: GRAPHIC_DESIGN_PLAN_CODE,
      name: "Graphic Design Annual",
      nameAr: "الاشتراك السنوي لمسار الجرافيك ديزاين",
      priceCents: 499,
      currency: "EGP",
      scope: PlanScope.TRACK,
      trackId: track.id,
    },
  });

  await prisma.plan.upsert({
    where: { code: ALL_ACCESS_PLAN_CODE },
    update: {
      priceCents: 799,
      currency: "EGP",
      scope: PlanScope.ALL_ACCESS,
      isActive: true,
    },
    create: {
      code: ALL_ACCESS_PLAN_CODE,
      name: "All Access Annual",
      nameAr: "الاشتراك السنوي الشامل لكل المسارات",
      priceCents: 799,
      currency: "EGP",
      scope: PlanScope.ALL_ACCESS,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {
      label: "Welcome 10%",
      discountType: "percentage",
      discountValue: 10,
      isActive: true,
    },
    create: {
      code: "WELCOME10",
      label: "Welcome 10%",
      discountType: "percentage",
      discountValue: 10,
      isActive: true,
    },
  });

  await prisma.feedbackThread.deleteMany({ where: { trackId: track.id } });
  await prisma.contentItem.deleteMany({ where: { trackId: track.id } });
  await prisma.toolkitItem.deleteMany({ where: { trackId: track.id } });
  await prisma.quiz.deleteMany({ where: { trackId: track.id } });
  await prisma.roadmapWeek.deleteMany({ where: { trackId: track.id } });

  const contentSeeds = [
    {
      key: "photoshop-basics",
      title: "Photoshop Basics Playlist",
      titleAr: "سلسلة أساسيات فوتوشوب",
      type: ContentType.VIDEO,
      difficulty: ResourceDifficulty.BEGINNER,
      estimatedMinutes: 28,
      isRequired: true,
    },
    {
      key: "arabic-type-setup",
      title: "Arabic Type Setup Guide",
      titleAr: "دليل ضبط الكتابة العربي",
      type: ContentType.GUIDE,
      difficulty: ResourceDifficulty.BEGINNER,
      estimatedMinutes: 14,
      isRequired: true,
    },
    {
      key: "social-layout-guide",
      title: "Social Layout Guide",
      titleAr: "دليل بناء Layout للسوشيال",
      type: ContentType.GUIDE,
      difficulty: ResourceDifficulty.FOUNDATIONAL,
      estimatedMinutes: 18,
      isRequired: true,
    },
    {
      key: "brand-case-notes",
      title: "Brand Case Notes",
      titleAr: "ملاحظات تحليل براندات",
      type: ContentType.NOTE,
      difficulty: ResourceDifficulty.FOUNDATIONAL,
      estimatedMinutes: 10,
      isRequired: false,
    },
    {
      key: "export-checklist",
      title: "Export Checklist",
      titleAr: "قائمة مراجعة الـ Export",
      type: ContentType.CHECKLIST,
      difficulty: ResourceDifficulty.BEGINNER,
      estimatedMinutes: 8,
      isRequired: true,
    },
    {
      key: "client-onboarding-reference",
      title: "Client Onboarding Reference",
      titleAr: "مرجع بداية التعامل مع العميل",
      type: ContentType.REFERENCE,
      difficulty: ResourceDifficulty.INTERMEDIATE,
      estimatedMinutes: 12,
      isRequired: false,
    },
  ] as const;

  const contentMap = new Map<string, string>();
  for (const seed of contentSeeds) {
    const item = await prisma.contentItem.create({
      data: {
        trackId: track.id,
        title: seed.title,
        titleAr: seed.titleAr,
        type: seed.type,
        provider: "Creative Hub",
        summary: `${seed.title} for the Graphic Design roadmap.`,
        summaryAr: `${seed.titleAr} ضمن محتوى مسار الجرافيك ديزاين.`,
        url: `https://example.com/${seed.key}`,
        estimatedMinutes: seed.estimatedMinutes,
        difficulty: seed.difficulty,
        isRequired: seed.isRequired,
        isPublished: true,
      },
    });
    contentMap.set(seed.key, item.id);
  }

  const toolkitSeeds = [
    {
      key: "starter-files",
      title: "Starter PSD Files",
      titleAr: "ملفات PSD للبداية",
      category: "Starter files",
      summaryAr: "ملفات بداية مرتبة لتسريع أول أسبوعين.",
    },
    {
      key: "font-pack",
      title: "Recommended Font Pack",
      titleAr: "باقة خطوط مقترحة",
      category: "Fonts",
      summaryAr: "مجموعة خطوط مناسبة للمبتدئ مع استخدامات واضحة.",
    },
    {
      key: "social-grids",
      title: "Social Grid Templates",
      titleAr: "قوالب Grid للسوشيال",
      category: "Templates",
      summaryAr: "شبكات جاهزة تساعدك في بناء layouts أسرع.",
    },
    {
      key: "brief-sheet",
      title: "Client Brief Sheet",
      titleAr: "ورقة brief للعميل",
      category: "Career tools",
      summaryAr: "نموذج بسيط لتنظيم طلبات العميل قبل التنفيذ.",
    },
    {
      key: "delivery-checklist",
      title: "Delivery Checklist",
      titleAr: "قائمة مراجعة التسليم",
      category: "Career tools",
      summaryAr: "Checklist للتأكد أن التسليم النهائي منظم.",
    },
  ] as const;

  const toolkitMap = new Map<string, string>();
  for (const seed of toolkitSeeds) {
    const item = await prisma.toolkitItem.create({
      data: {
        trackId: track.id,
        title: seed.title,
        titleAr: seed.titleAr,
        category: seed.category,
        summary: `${seed.title} used inside the roadmap.`,
        summaryAr: seed.summaryAr,
        fileUrl: `https://example.com/toolkits/${seed.key}`,
        isFeatured: seed.category !== "Career tools",
        isPublished: true,
      },
    });
    toolkitMap.set(seed.key, item.id);
  }

  for (const [weekIndex, week] of graphicDesignRoadmapSeed.entries()) {
    const createdWeek = await prisma.roadmapWeek.create({
      data: {
        trackId: track.id,
        order: weekIndex + 1,
        title: week.title,
        titleAr: week.titleAr,
        objective: week.objective,
        objectiveAr: week.objectiveAr,
        explanation: week.explanation,
        explanationAr: week.explanationAr,
        expectedOutcome: week.expectedOutcome,
        expectedOutcomeAr: week.expectedOutcomeAr,
        isPublished: true,
      },
    });

    const quiz = await prisma.quiz.create({
      data: {
        trackId: track.id,
        weekId: createdWeek.id,
        title: week.quizTitle,
        titleAr: week.quizTitleAr,
        scope: weekIndex === graphicDesignRoadmapSeed.length - 1 ? "final" : "weekly",
        passingScore: 70,
        isPublished: true,
      },
    });

    const question = await prisma.quizQuestion.create({
      data: {
        quizId: quiz.id,
        order: 1,
        prompt: "What should the learner produce by the end of this week?",
        promptAr: "ما الناتج المتوقع من المتعلم بنهاية هذا الأسبوع؟",
        type: "multiple_choice",
      },
    });

    await prisma.quizChoice.createMany({
      data: [
        {
          questionId: question.id,
          label: "A saved output connected to the weekly objective",
          labelAr: "ناتج محفوظ مرتبط بهدف الأسبوع",
          isCorrect: true,
        },
        {
          questionId: question.id,
          label: "Only watch videos without files",
          labelAr: "مشاهدة الفيديوهات فقط بدون ملفات",
          isCorrect: false,
        },
      ],
    });

    for (const [dayIndex, day] of week.days.entries()) {
      const createdDay = await prisma.roadmapDay.create({
        data: {
          weekId: createdWeek.id,
          order: dayIndex + 1,
          title: day.title,
          titleAr: day.titleAr,
          description: day.description,
          descriptionAr: day.descriptionAr,
          estimatedMinutes: day.estimatedMinutes,
        },
      });

      const task = await prisma.roadmapTask.create({
        data: {
          dayId: createdDay.id,
          order: 1,
          title: day.task.title,
          titleAr: day.task.titleAr,
          whyItMatters: day.task.whyItMatters,
          whyItMattersAr: day.task.whyItMattersAr,
          instructions: day.task.instructions,
          instructionsAr: day.task.instructionsAr,
          expectedOutput: day.task.expectedOutput,
          expectedOutputAr: day.task.expectedOutputAr,
          estimatedMinutes: day.task.estimatedMinutes,
          helpNotes: day.task.helpNotes,
          helpNotesAr: day.task.helpNotesAr,
          commonIssues: day.task.commonIssues,
          checklist: day.task.checklist,
        },
      });

      if (!firstRoadmapTaskId) {
        firstRoadmapTaskId = task.id;
      }

      const contentIds = Array.from(contentMap.values());
      const toolkitIds = Array.from(toolkitMap.values());

      await prisma.roadmapResourceLink.createMany({
        data: [
          {
            taskId: task.id,
            contentItemId: contentIds[dayIndex % contentIds.length],
            label: "Primary learning resource",
          },
          {
            taskId: task.id,
            toolkitItemId: toolkitIds[dayIndex % toolkitIds.length],
            label: "Support toolkit",
          },
        ],
      });
    }
  }

  const seededFeedback = await prisma.feedbackThread.create({
    data: {
      userId: learnerUser.id,
      trackId: track.id,
      roadmapTaskId: firstRoadmapTaskId,
      type: "project",
      title: "Review my social media promo design",
      note: "I want feedback on hierarchy and whether the CTA feels clear enough.",
      submissionUrl: "https://example.com/projects/promo-design",
      status: "REVIEWED",
      messages: {
        create: [
          {
            authorUserId: learnerUser.id,
            authorRole: "learner",
            body: "This is my Week 4 promo design. I need feedback on hierarchy, CTA clarity, and whether the image treatment feels too heavy.",
          },
          {
            authorUserId: adminUser.id,
            authorRole: "admin",
            body: "The layout direction is good, but the CTA block needs more contrast and the product image should have more breathing room. Keep the top line shorter and increase the CTA button size slightly.",
          },
        ],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: learnerUser.id,
        type: "ANNOUNCEMENT",
        title: "Graphic Design roadmap is ready",
        titleAr: "Roadmap الجرافيك ديزاين أصبحت جاهزة",
        body: "Start with Week 1 and finish one day at a time.",
        bodyAr: "ابدأ بالأسبوع الأول وأنهِ يومًا واحدًا في كل مرة.",
        href: "/dashboard/tracks/graphic-design",
      },
      {
        userId: learnerUser.id,
        type: "FEEDBACK",
        title: "Feedback reviewed",
        titleAr: "تمت مراجعة طلب الفيدباك",
        body: "Your latest Graphic Design feedback thread has a reply.",
        bodyAr: "آخر طلب feedback في مسار الجرافيك ديزاين أصبح عليه رد.",
        href: "/dashboard/feedback",
      },
      {
        userId: adminUser.id,
        type: "ANNOUNCEMENT",
        title: "Seed data refreshed",
        titleAr: "تم تحديث بيانات البداية",
        body: "Graphic Design roadmap, plans, users, and feedback were seeded.",
        bodyAr: "تم تجهيز بيانات المسار والخطط والمستخدمين والـ feedback.",
        href: "/admin",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.membership.upsert({
    where: {
      userId_planId: {
        userId: learnerUser.id,
        planId: graphicDesignPlan.id,
      },
    },
    update: {
      status: "ACTIVE",
      startsAt: new Date(),
      expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      source: "seed",
    },
    create: {
      userId: learnerUser.id,
      planId: graphicDesignPlan.id,
      status: "ACTIVE",
      startsAt: new Date(),
      expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      source: "seed",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: adminUser.id,
      entityType: "Seed",
      entityId: seededFeedback.id,
      action: "seed",
      summary: "Graphic Design content, toolkits, roadmap, and feedback were seeded.",
    },
  });

  console.log("Creative Hub seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
