import { ContentType, PlanScope, ResourceDifficulty, TrackStatus } from "@prisma/client";

import { hashPassword } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import { graphicDesignRoadmapSeed } from "../src/lib/roadmap-data";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ALL_ACCESS_PLAN_CODE,
  GRAPHIC_DESIGN_PLAN_CODE,
  GRAPHIC_DESIGN_TRACK_SLUG,
  LEARNER_EMAIL,
  LEARNER_PASSWORD,
} from "../src/lib/seed-constants";

async function seedPermissions() {
  const permissionSeeds = [
    ["users.manage", "Manage users", "users"],
    ["payments.review", "Review payments", "payments"],
    ["tracks.manage", "Manage tracks", "tracks"],
    ["roadmap.manage", "Manage roadmap", "roadmap"],
    ["memberships.manage", "Manage memberships", "memberships"],
    ["feedback.manage", "Manage feedback", "feedback"],
    ["content.manage", "Manage content", "content"],
    ["coupons.manage", "Manage coupons", "coupons"],
    ["quizzes.manage", "Manage quizzes", "quizzes"],
    ["plans.manage", "Manage plans", "plans"],
    ["roles.manage", "Manage roles", "roles"],
  ] as const;

  for (const [key, label, group] of permissionSeeds) {
    await prisma.permission.upsert({
      where: { key },
      update: { label, group },
      create: { key, label, group },
    });
  }
}

async function seedRoles(adminUserId: string) {
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

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUserId,
        roleId: superAdmin.id,
      },
    },
    update: {},
    create: {
      userId: adminUserId,
      roleId: superAdmin.id,
    },
  });
}

async function seedUsers() {
  const adminPasswordHash = hashPassword(ADMIN_PASSWORD);
  const learnerPasswordHash = hashPassword(LEARNER_PASSWORD);

  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: "Creative Hub Admin",
      passwordHash: adminPasswordHash,
      passwordUpdatedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
    create: {
      email: ADMIN_EMAIL,
      name: "Creative Hub Admin",
      passwordHash: adminPasswordHash,
      passwordUpdatedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
  });

  const learnerUser = await prisma.user.upsert({
    where: { email: LEARNER_EMAIL },
    update: {
      name: "Creative Hub Learner",
      passwordHash: learnerPasswordHash,
      passwordUpdatedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
    create: {
      email: LEARNER_EMAIL,
      name: "Creative Hub Learner",
      passwordHash: learnerPasswordHash,
      passwordUpdatedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
  });

  const allAccessUser = await prisma.user.upsert({
    where: { email: "allaccess@creativehub.eg" },
    update: {
      name: "All Access Learner",
      passwordHash: learnerPasswordHash,
      passwordUpdatedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
    create: {
      email: "allaccess@creativehub.eg",
      name: "All Access Learner",
      passwordHash: learnerPasswordHash,
      passwordUpdatedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
  });

  const expiredUser = await prisma.user.upsert({
    where: { email: "expired@creativehub.eg" },
    update: {
      name: "Expired Learner",
      passwordHash: learnerPasswordHash,
      passwordUpdatedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
    create: {
      email: "expired@creativehub.eg",
      name: "Expired Learner",
      passwordHash: learnerPasswordHash,
      passwordUpdatedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
  });

  const pendingUser = await prisma.user.upsert({
    where: { email: "pending@creativehub.eg" },
    update: {
      name: "Pending Learner",
      passwordHash: learnerPasswordHash,
      passwordUpdatedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
    create: {
      email: "pending@creativehub.eg",
      name: "Pending Learner",
      passwordHash: learnerPasswordHash,
      passwordUpdatedAt: new Date(),
      emailVerifiedAt: new Date(),
    },
  });

  return {
    adminUser,
    learnerUser,
    allAccessUser,
    expiredUser,
    pendingUser,
  };
}

async function seedTracks() {
  const graphicDesignTrack = await prisma.track.upsert({
    where: { slug: GRAPHIC_DESIGN_TRACK_SLUG },
    update: {
      name: "Graphic Design",
      nameAr: "الجرافيك ديزاين",
      summary: "Graphic Design is the first active track for paid learners.",
      summaryAr: "الجرافيك ديزاين هو أول مسار متاح فعليًا للمتعلمين المشتركين.",
      status: TrackStatus.ACTIVE,
      isFeatured: true,
      sortOrder: 1,
      roadmapLengthDays: 60,
      accentColor: "#f3b63f",
      heroImageUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
    },
    create: {
      slug: GRAPHIC_DESIGN_TRACK_SLUG,
      name: "Graphic Design",
      nameAr: "الجرافيك ديزاين",
      summary: "Graphic Design is the first active track for paid learners.",
      summaryAr: "الجرافيك ديزاين هو أول مسار متاح فعليًا للمتعلمين المشتركين.",
      status: TrackStatus.ACTIVE,
      isFeatured: true,
      sortOrder: 1,
      roadmapLengthDays: 60,
      accentColor: "#f3b63f",
      heroImageUrl: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
    },
  });

  await prisma.track.upsert({
    where: { slug: "media-buying" },
    update: {
      name: "Media Buying",
      nameAr: "الميديا بايينج",
      summary: "Media Buying track is preparing for launch.",
      summaryAr: "مسار الميديا بايينج قيد التجهيز للإطلاق.",
      status: TrackStatus.COMING_SOON,
      sortOrder: 2,
      accentColor: "#3cc7c7",
    },
    create: {
      slug: "media-buying",
      name: "Media Buying",
      nameAr: "الميديا بايينج",
      summary: "Media Buying track is preparing for launch.",
      summaryAr: "مسار الميديا بايينج قيد التجهيز للإطلاق.",
      status: TrackStatus.COMING_SOON,
      sortOrder: 2,
      accentColor: "#3cc7c7",
    },
  });

  await prisma.track.upsert({
    where: { slug: "video-editing" },
    update: {
      name: "Video Editing",
      nameAr: "الفيديو إيديتنج",
      summary: "Video Editing track is preparing for launch.",
      summaryAr: "مسار الفيديو إيديتنج قيد التجهيز للإطلاق.",
      status: TrackStatus.COMING_SOON,
      sortOrder: 3,
      accentColor: "#ee7d47",
    },
    create: {
      slug: "video-editing",
      name: "Video Editing",
      nameAr: "الفيديو إيديتنج",
      summary: "Video Editing track is preparing for launch.",
      summaryAr: "مسار الفيديو إيديتنج قيد التجهيز للإطلاق.",
      status: TrackStatus.COMING_SOON,
      sortOrder: 3,
      accentColor: "#ee7d47",
    },
  });

  await prisma.trackCommunity.upsert({
    where: { trackId: graphicDesignTrack.id },
    update: {
      label: "Graphic Design WhatsApp Community",
      description: "Members-only WhatsApp community for Graphic Design learners.",
      inviteUrl: "https://chat.whatsapp.com/example-creative-hub-design",
      isEnabled: true,
    },
    create: {
      trackId: graphicDesignTrack.id,
      label: "Graphic Design WhatsApp Community",
      description: "Members-only WhatsApp community for Graphic Design learners.",
      inviteUrl: "https://chat.whatsapp.com/example-creative-hub-design",
      isEnabled: true,
    },
  });

  return graphicDesignTrack;
}

async function seedPlans(trackId: string) {
  const graphicDesignPlan = await prisma.plan.upsert({
    where: { code: GRAPHIC_DESIGN_PLAN_CODE },
    update: {
      name: "Graphic Design Annual",
      nameAr: "الاشتراك السنوي لمسار الجرافيك ديزاين",
      priceCents: 499,
      currency: "EGP",
      scope: PlanScope.TRACK,
      trackId,
      durationDays: 365,
      isActive: true,
    },
    create: {
      code: GRAPHIC_DESIGN_PLAN_CODE,
      name: "Graphic Design Annual",
      nameAr: "الاشتراك السنوي لمسار الجرافيك ديزاين",
      priceCents: 499,
      currency: "EGP",
      scope: PlanScope.TRACK,
      trackId,
      durationDays: 365,
    },
  });

  const allAccessPlan = await prisma.plan.upsert({
    where: { code: ALL_ACCESS_PLAN_CODE },
    update: {
      name: "All Access Annual",
      nameAr: "الاشتراك السنوي الشامل لكل المسارات",
      priceCents: 799,
      currency: "EGP",
      scope: PlanScope.ALL_ACCESS,
      durationDays: 365,
      isActive: true,
    },
    create: {
      code: ALL_ACCESS_PLAN_CODE,
      name: "All Access Annual",
      nameAr: "الاشتراك السنوي الشامل لكل المسارات",
      priceCents: 799,
      currency: "EGP",
      scope: PlanScope.ALL_ACCESS,
      durationDays: 365,
    },
  });

  return { graphicDesignPlan, allAccessPlan };
}

async function seedCoupons(trackId: string) {
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {
      label: "Welcome 10%",
      discountType: "percentage",
      discountValue: 10,
      planScope: PlanScope.TRACK,
      trackId,
      isActive: true,
    },
    create: {
      code: "WELCOME10",
      label: "Welcome 10%",
      discountType: "percentage",
      discountValue: 10,
      planScope: PlanScope.TRACK,
      trackId,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "ALL25" },
    update: {
      label: "All Access 25%",
      discountType: "percentage",
      discountValue: 25,
      planScope: PlanScope.ALL_ACCESS,
      isActive: true,
    },
    create: {
      code: "ALL25",
      label: "All Access 25%",
      discountType: "percentage",
      discountValue: 25,
      planScope: PlanScope.ALL_ACCESS,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "FREEGD" },
    update: {
      label: "Free Graphic Design Access",
      discountType: "free",
      discountValue: 100,
      planScope: PlanScope.TRACK,
      trackId,
      isActive: true,
    },
    create: {
      code: "FREEGD",
      label: "Free Graphic Design Access",
      discountType: "free",
      discountValue: 100,
      planScope: PlanScope.TRACK,
      trackId,
      isActive: true,
    },
  });
}

async function seedContentAndToolkits(trackId: string) {
  await prisma.contentItem.deleteMany({ where: { trackId } });
  await prisma.toolkitItem.deleteMany({ where: { trackId } });

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

  const contentMap = new Map<string, string>();
  for (const [index, seed] of contentSeeds.entries()) {
    const item = await prisma.contentItem.create({
      data: {
        trackId,
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
        isFeatured: seed.isRequired,
        isPublished: true,
        sortOrder: index + 1,
        tags: [seed.key.replace(/-/g, " "), seed.type.toLowerCase()],
      },
    });
    contentMap.set(seed.key, item.id);
  }

  const toolkitMap = new Map<string, string>();
  for (const seed of toolkitSeeds) {
    const item = await prisma.toolkitItem.create({
      data: {
        trackId,
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

  return { contentMap, toolkitMap };
}

async function seedRoadmap(trackId: string, contentMap: Map<string, string>, toolkitMap: Map<string, string>) {
  await prisma.quiz.deleteMany({ where: { trackId } });
  await prisma.roadmapWeek.deleteMany({ where: { trackId } });

  let firstRoadmapTaskId: string | null = null;
  let firstQuizId: string | null = null;

  for (const [weekIndex, week] of graphicDesignRoadmapSeed.entries()) {
    const createdWeek = await prisma.roadmapWeek.create({
      data: {
        trackId,
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
        trackId,
        weekId: createdWeek.id,
        title: week.quizTitle,
        titleAr: week.quizTitleAr,
        scope: weekIndex === graphicDesignRoadmapSeed.length - 1 ? "final" : "weekly",
        passingScore: 70,
        completionRule: "pass_score",
        isPublished: true,
      },
    });

    if (!firstQuizId) {
      firstQuizId = quiz.id;
    }

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

  return {
    firstRoadmapTaskId,
    firstQuizId,
  };
}

async function seedFeedbackAndNotifications(input: {
  adminUserId: string;
  learnerUserId: string;
  trackId: string;
  firstRoadmapTaskId: string | null;
}) {
  await prisma.feedbackThread.deleteMany({
    where: {
      trackId: input.trackId,
      userId: input.learnerUserId,
    },
  });

  const seededFeedback = await prisma.feedbackThread.create({
    data: {
      userId: input.learnerUserId,
      trackId: input.trackId,
      roadmapTaskId: input.firstRoadmapTaskId,
      type: "project",
      title: "Review my social media promo design",
      note: "I want feedback on hierarchy and whether the CTA feels clear enough.",
      submissionUrl: "https://example.com/projects/promo-design",
      status: "REVIEWED",
      messages: {
        create: [
          {
            authorUserId: input.learnerUserId,
            authorRole: "learner",
            body: "This is my Week 4 promo design. I need feedback on hierarchy, CTA clarity, and image treatment.",
          },
          {
            authorUserId: input.adminUserId,
            authorRole: "admin",
            body: "Good direction. Increase CTA contrast, shorten the headline, and give the product image more breathing room.",
          },
        ],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: input.learnerUserId,
        type: "ANNOUNCEMENT",
        title: "Graphic Design roadmap is ready",
        titleAr: "Roadmap الجرافيك ديزاين أصبحت جاهزة",
        body: "Start with Week 1 and finish one day at a time.",
        bodyAr: "ابدأ بالأسبوع الأول وأنهِ يومًا واحدًا في كل مرة.",
        href: "/dashboard/tracks/graphic-design",
      },
      {
        userId: input.learnerUserId,
        type: "FEEDBACK",
        title: "Feedback reviewed",
        titleAr: "تمت مراجعة طلب الفيدباك",
        body: "Your latest Graphic Design feedback thread has a reply.",
        bodyAr: "آخر طلب feedback في مسار الجرافيك ديزاين أصبح عليه رد.",
        href: "/dashboard/feedback",
      },
      {
        userId: input.adminUserId,
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

  return seededFeedback;
}

async function seedMemberships(input: {
  learnerUserId: string;
  allAccessUserId: string;
  expiredUserId: string;
  pendingUserId: string;
  graphicDesignPlanId: string;
  allAccessPlanId: string;
}) {
  const now = new Date();
  const oneYearFromNow = new Date(now);
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const oneYearAgo = new Date(now);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.membership.upsert({
    where: {
      userId_planId: {
        userId: input.learnerUserId,
        planId: input.graphicDesignPlanId,
      },
    },
    update: {
      status: "ACTIVE",
      startsAt: now,
      expiresAt: oneYearFromNow,
      source: "seed",
    },
    create: {
      userId: input.learnerUserId,
      planId: input.graphicDesignPlanId,
      status: "ACTIVE",
      startsAt: now,
      expiresAt: oneYearFromNow,
      source: "seed",
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_planId: {
        userId: input.allAccessUserId,
        planId: input.allAccessPlanId,
      },
    },
    update: {
      status: "ACTIVE",
      startsAt: now,
      expiresAt: oneYearFromNow,
      source: "seed_all_access",
    },
    create: {
      userId: input.allAccessUserId,
      planId: input.allAccessPlanId,
      status: "ACTIVE",
      startsAt: now,
      expiresAt: oneYearFromNow,
      source: "seed_all_access",
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_planId: {
        userId: input.expiredUserId,
        planId: input.graphicDesignPlanId,
      },
    },
    update: {
      status: "EXPIRED",
      startsAt: oneYearAgo,
      expiresAt: yesterday,
      source: "seed_expired",
    },
    create: {
      userId: input.expiredUserId,
      planId: input.graphicDesignPlanId,
      status: "EXPIRED",
      startsAt: oneYearAgo,
      expiresAt: yesterday,
      source: "seed_expired",
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_planId: {
        userId: input.pendingUserId,
        planId: input.graphicDesignPlanId,
      },
    },
    update: {
      status: "PENDING",
      startsAt: null,
      expiresAt: null,
      source: "seed_pending",
    },
    create: {
      userId: input.pendingUserId,
      planId: input.graphicDesignPlanId,
      status: "PENDING",
      startsAt: null,
      expiresAt: null,
      source: "seed_pending",
    },
  });
}

async function seedUserNotes(input: {
  adminUserId: string;
  learnerUserId: string;
  expiredUserId: string;
  allAccessUserId: string;
}) {
  await prisma.adminUserNote.deleteMany({
    where: {
      userId: {
        in: [input.learnerUserId, input.expiredUserId, input.allAccessUserId],
      },
    },
  });

  await prisma.adminUserNote.createMany({
    data: [
      {
        userId: input.learnerUserId,
        authorUserId: input.adminUserId,
        body: "ملتزم في المسار الحالي ويحتاج متابعة خفيفة فقط.",
      },
      {
        userId: input.expiredUserId,
        authorUserId: input.adminUserId,
        body: "انتهت العضوية السابقة. مناسب لعرض renewal discount لو رجع.",
      },
      {
        userId: input.allAccessUserId,
        authorUserId: input.adminUserId,
        body: "مشترك شامل ويمكن استخدامه لاختبار جميع صلاحيات all-access.",
      },
    ],
  });
}

async function seedQuizAttempt(quizId: string | null, learnerUserId: string) {
  if (!quizId) {
    return;
  }

  await prisma.quizAttempt.create({
    data: {
      quizId,
      userId: learnerUserId,
      score: 85,
      status: "passed",
      answers: {
        note: "Seeded attempt for admin visibility",
      },
    },
  });
}

async function main() {
  await prisma.authToken.deleteMany();
  await prisma.emailDeliveryLog.deleteMany();
  await prisma.paymentReviewLog.deleteMany();
  await prisma.paymentRequest.deleteMany();
  await prisma.couponRedemption.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.taskCompletion.deleteMany();
  await prisma.session.deleteMany();
  await prisma.rateLimitBucket.deleteMany();
  await seedPermissions();

  const { adminUser, learnerUser, allAccessUser, expiredUser, pendingUser } = await seedUsers();
  await seedRoles(adminUser.id);

  const graphicDesignTrack = await seedTracks();
  const { graphicDesignPlan, allAccessPlan } = await seedPlans(graphicDesignTrack.id);
  await seedCoupons(graphicDesignTrack.id);

  const { contentMap, toolkitMap } = await seedContentAndToolkits(graphicDesignTrack.id);
  const { firstRoadmapTaskId, firstQuizId } = await seedRoadmap(
    graphicDesignTrack.id,
    contentMap,
    toolkitMap,
  );

  const seededFeedback = await seedFeedbackAndNotifications({
    adminUserId: adminUser.id,
    learnerUserId: learnerUser.id,
    trackId: graphicDesignTrack.id,
    firstRoadmapTaskId,
  });

  await seedMemberships({
    learnerUserId: learnerUser.id,
    allAccessUserId: allAccessUser.id,
    expiredUserId: expiredUser.id,
    pendingUserId: pendingUser.id,
    graphicDesignPlanId: graphicDesignPlan.id,
    allAccessPlanId: allAccessPlan.id,
  });

  await seedUserNotes({
    adminUserId: adminUser.id,
    learnerUserId: learnerUser.id,
    expiredUserId: expiredUser.id,
    allAccessUserId: allAccessUser.id,
  });

  await seedQuizAttempt(firstQuizId, learnerUser.id);

  await prisma.auditLog.create({
    data: {
      actorUserId: adminUser.id,
      entityType: "Seed",
      entityId: seededFeedback.id,
      action: "seed",
      summary: "Creative Hub seed refreshed with roadmap, operations, users, plans, coupons, and feedback.",
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
