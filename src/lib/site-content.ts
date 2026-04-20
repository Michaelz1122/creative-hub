export type TrackStatus = "active" | "coming-soon";

export type TrackSummary = {
  slug: string;
  name: string;
  arabicName: string;
  status: TrackStatus;
  summary: string;
  description: string;
  weeklyFocus: string[];
  outcomes: string[];
  communityLabel: string;
  roadmapLabel: string;
};

export const platformStats = [
  { value: "60", label: "يوم roadmap واضح من البداية للنهاية" },
  { value: "8", label: "أسابيع مبنية للمبتدئ خطوة بخطوة" },
  { value: "EGP 300-900", label: "تسعير عملي مناسب للسوق المصري" },
];

export const plans = [
  {
    name: "Graphic Design Annual",
    price: "EGP 499",
    note: "يشمل roadmap + library + community + feedback + toolkits",
    badge: "Active now",
  },
  {
    name: "All Access Annual",
    price: "EGP 799",
    note: "يشمل كل المسارات الحالية والقادمة خلال سنة الاشتراك",
    badge: "Best value",
  },
];

export const tracks: TrackSummary[] = [
  {
    slug: "graphic-design",
    name: "Graphic Design",
    arabicName: "الجرافيك ديزاين",
    status: "active",
    summary: "المسار الأساسي المتاح الآن للمشتركين المدفوعين.",
    description:
      "مسار عربي عملي للمبتدئ يبدأ من setup الأدوات وينتهي ببناء شغل قابل للعرض والتسعير والتعامل مع العملاء.",
    weeklyFocus: [
      "Setup البرامج والخطوط والملفات",
      "أساسيات التكوين واللون والهيراركي",
      "Social media design workflow",
      "Branding basics and client-ready files",
    ],
    outcomes: [
      "تفهم تبدأ منين كل يوم",
      "تطلع شغل منظم قابل للمراجعة",
      "تبني portfolio أولي",
      "تجهز نفسك للتعامل مع أول عميل",
    ],
    communityLabel: "WhatsApp community للمشتركين فقط",
    roadmapLabel: "60-day guided roadmap",
  },
  {
    slug: "media-buying",
    name: "Media Buying",
    arabicName: "الميديا بايينج",
    status: "coming-soon",
    summary: "سيتم إطلاقه لاحقًا بنفس فلسفة التدرج والوضوح.",
    description:
      "منصة تعلم منظمة لفهم الإعلانات، الميديا بلان، القياس، والعمل مع العميل باللغة التي تناسب السوق المصري.",
    weeklyFocus: ["Coming soon"],
    outcomes: ["Join waitlist"],
    communityLabel: "سيُفتح مع الإطلاق",
    roadmapLabel: "Coming soon roadmap",
  },
  {
    slug: "video-editing",
    name: "Video Editing",
    arabicName: "المونتاج",
    status: "coming-soon",
    summary: "قريبًا بمسار منظم من الصفر وحتى تسليم شغل جاهز.",
    description:
      "نفس philosophy Creative Hub لكن للمونتاج: setup, workflow, editing logic, export, client delivery.",
    weeklyFocus: ["Coming soon"],
    outcomes: ["Join waitlist"],
    communityLabel: "سيُعلن لاحقًا",
    roadmapLabel: "Coming soon roadmap",
  },
];

export const dashboardSnapshot = {
  learnerName: "محمد",
  membershipLabel: "Graphic Design Annual",
  membershipStatus: "Active until 12 Feb 2027",
  activeTracks: 1,
  completionRate: 28,
  todayTasks: [
    "رتب ملفات المشروع واعمل naming واضح",
    "شوف الفيديو المطلوب وطبق نفس الخطوات على ملفك",
    "ارفع النتيجة النهائية أو screenshot للمراجعة",
  ],
  notifications: [
    "في Quiz جديد لنهاية الأسبوع الرابع",
    "تم فتح toolkit جديد خاص بالـ branding basics",
    "آخر فرصة قبل انتهاء خصم All Access",
  ],
};

export const adminSnapshot = {
  totalUsers: "1,240",
  activeMemberships: "412",
  pendingPayments: "18",
  pendingFeedback: "11",
  approvalRate: "82%",
  topDemand: "Graphic Design",
};

export function getTrackBySlug(slug: string) {
  return tracks.find((track) => track.slug === slug);
}

