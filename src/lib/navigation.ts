export const marketingNav = [
  { href: "/", label: "الرئيسية" },
  { href: "/pricing", label: "الأسعار" },
  { href: "/tracks/graphic-design", label: "Graphic Design" },
  { href: "/dashboard", label: "Dashboard" },
];

export const dashboardNav = [
  { href: "/dashboard", label: "Overview", caption: "ابدأ من هنا" },
  { href: "/dashboard/tracks", label: "My Tracks", caption: "المسارات والاشتراكات" },
  { href: "/dashboard/roadmap", label: "Roadmap", caption: "أسبوعك الحالي" },
  { href: "/dashboard/library", label: "Library", caption: "المحتوى والمراجع" },
  { href: "/dashboard/toolkits", label: "Toolkits", caption: "الملفات والقوالب" },
  { href: "/dashboard/community", label: "Community", caption: "روابط واتساب المتاحة" },
  { href: "/dashboard/feedback", label: "Feedback", caption: "المراجعات والردود" },
  { href: "/dashboard/billing", label: "Billing", caption: "العضويات والدفع" },
  { href: "/dashboard/notifications", label: "Notifications", caption: "التحديثات والتنبيهات" },
];

export const adminNav = [
  { href: "/admin", label: "Overview", caption: "صورة تشغيلية", permissionKey: null },
  { href: "/admin/users", label: "Users", caption: "المستخدمون والعضويات", permissionKey: "users.manage" },
  { href: "/admin/payments", label: "Payments", caption: "مراجعة التحويلات", permissionKey: "payments.review" },
  { href: "/admin/coupons", label: "Coupons", caption: "الكوبونات والاستخدام", permissionKey: "coupons.manage" },
  { href: "/admin/quizzes", label: "Quizzes", caption: "الاختبارات والنتائج", permissionKey: "quizzes.manage" },
  { href: "/admin/tracks", label: "Tracks", caption: "إدارة المسارات", permissionKey: "tracks.manage" },
  { href: "/admin/feedback", label: "Feedback", caption: "صندوق المراجعات", permissionKey: "feedback.manage" },
  { href: "/admin/roadmap", label: "Roadmap Builder", caption: "الأسابيع والمهام", permissionKey: "roadmap.manage" },
  { href: "/admin/content", label: "Content", caption: "المكتبة والـ toolkits", permissionKey: "content.manage" },
  { href: "/admin/settings", label: "Plans", caption: "الخطط والأسعار", permissionKey: "plans.manage" },
  { href: "/admin/roles", label: "Roles", caption: "الأدوار والصلاحيات", permissionKey: "roles.manage" },
];
