type SeedTask = {
  title: string;
  titleAr: string;
  whyItMatters: string;
  whyItMattersAr: string;
  instructions: string;
  instructionsAr: string;
  expectedOutput: string;
  expectedOutputAr: string;
  estimatedMinutes: number;
  helpNotes: string;
  helpNotesAr: string;
  commonIssues: string[];
  checklist: string[];
};

type SeedDay = {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  estimatedMinutes: number;
  task: SeedTask;
};

export type SeedWeek = {
  title: string;
  titleAr: string;
  objective: string;
  objectiveAr: string;
  explanation: string;
  explanationAr: string;
  expectedOutcome: string;
  expectedOutcomeAr: string;
  quizTitle: string;
  quizTitleAr: string;
  days: SeedDay[];
};

function createDay(dayNumber: number, focusEn: string, focusAr: string, outputEn: string, outputAr: string): SeedDay {
  return {
    title: `Day ${dayNumber}`,
    titleAr: `اليوم ${dayNumber}`,
    description: focusEn,
    descriptionAr: focusAr,
    estimatedMinutes: 75,
    task: {
      title: focusEn,
      titleAr: focusAr,
      whyItMatters: `This day removes a common beginner blocker around ${focusEn.toLowerCase()}.`,
      whyItMattersAr: `هذا اليوم يعالج واحدة من أكثر مشاكل المبتدئ تكرارًا في ${focusAr}.`,
      instructions: `Read the day brief, watch the linked material, and apply the workflow directly on your own file before marking the task complete.`,
      instructionsAr: `اقرأ شرح اليوم، شاهد المصدر المرتبط، ثم طبّق الخطوات مباشرة على ملفك أنت قبل تعليم المهمة كمكتملة.`,
      expectedOutput: outputEn,
      expectedOutputAr: outputAr,
      estimatedMinutes: 75,
      helpNotes: "Do not move to the next day until the output exists in a saved file or screenshot.",
      helpNotesAr: "لا تنتقل لليوم التالي قبل أن يصبح عندك ناتج محفوظ فعلاً كملف أو screenshot.",
      commonIssues: [
        "Skipping file organization",
        "Using random fonts without hierarchy",
        "Watching without applying",
      ],
      checklist: [
        "Open the right source file",
        "Finish the task on your own file",
        "Export or capture the final result",
      ],
    },
  };
}

export const graphicDesignRoadmapSeed: SeedWeek[] = [
  {
    title: "Week 1 - Setup and designer readiness",
    titleAr: "الأسبوع 1 - التجهيز والاستعداد للمصمم",
    objective: "Set up tools, files, fonts, and a clean beginner workflow.",
    objectiveAr: "تجهيز الأدوات والملفات والخطوط وبداية workflow مناسبة للمبتدئ.",
    explanation: "This week removes setup confusion before visual work starts.",
    explanationAr: "هذا الأسبوع يزيل فوضى البداية قبل الدخول في التنفيذ البصري نفسه.",
    expectedOutcome: "A ready machine, organized folders, and confidence opening Photoshop correctly.",
    expectedOutcomeAr: "جهاز جاهز، فولدرات مرتبة، وثقة في فتح Photoshop وضبطه بشكل صحيح.",
    quizTitle: "Week 1 readiness quiz",
    quizTitleAr: "اختبار الجاهزية للأسبوع الأول",
    days: [
      createDay(1, "Install Photoshop and set workspace basics", "تثبيت فوتوشوب وضبط الواجهة الأساسية", "A working Photoshop installation and workspace screenshot", "صورة تثبت أن Photoshop شغال والواجهة مضبوطة"),
      createDay(2, "Fix Arabic typing and RTL issues", "حل مشاكل الكتابة العربي والـ RTL", "An Arabic text sample saved in a PSD", "ملف PSD فيه نص عربي مضبوط"),
      createDay(3, "Organize folders, references, and exports", "تنظيم الفولدرات والمراجع والـ exports", "A reusable project folder structure", "هيكل فولدرات تقدر تكرره في كل مشروع"),
      createDay(4, "Install and classify essential fonts", "تثبيت وتصنيف الخطوط الأساسية", "A starter font library list", "قائمة خطوط بداية مرتبة"),
      createDay(5, "Understand canvas sizes and social formats", "فهم أحجام اللوحات ومقاسات السوشيال", "Three new canvases for common social formats", "3 ملفات جديدة بمقاسات مختلفة"),
      createDay(6, "Practice layers, groups, and smart naming", "التدريب على الـ layers والـ groups والتسمية", "A PSD with clear naming and groups", "ملف PSD منظم بالأسماء والجروبات"),
      createDay(7, "Learn export settings without losing quality", "تعلم الـ export بدون فقدان جودة", "Feed and story exports with correct settings", "نسخ feed وstory مصدرة صح"),
      createDay(8, "Create your first clean practice file", "إنشاء أول ملف تدريبي نظيف", "A simple starter post using the week setup", "تصميم بسيط يثبت أن الأساس جاهز"),
    ],
  },
  {
    title: "Week 2 - Core design fundamentals",
    titleAr: "الأسبوع 2 - أساسيات التصميم التي ستستخدمها فعلًا",
    objective: "Understand layout, hierarchy, contrast, and spacing in practical terms.",
    objectiveAr: "فهم التكوين والهيراركي والتباين والمسافات بشكل عملي.",
    explanation: "The learner starts seeing why some designs feel strong and others feel messy.",
    explanationAr: "المتعلم يبدأ يفهم لماذا بعض التصميمات تبدو قوية وبعضها يبدو عشوائيًا.",
    expectedOutcome: "Ability to build cleaner layouts instead of stacking random elements.",
    expectedOutcomeAr: "القدرة على بناء layout أنظف بدل رص عناصر عشوائية.",
    quizTitle: "Week 2 fundamentals quiz",
    quizTitleAr: "اختبار أساسيات الأسبوع الثاني",
    days: [
      createDay(9, "Spot visual hierarchy in real examples", "تمييز الهيراركي في أمثلة حقيقية", "Notes comparing weak and strong hierarchy", "ملاحظات مقارنة بين hierarchy ضعيفة وقوية"),
      createDay(10, "Use spacing to improve readability", "استخدام المسافات لتحسين القراءة", "A revised layout with better spacing", "نسخة محسنة من layout بالمسافات"),
      createDay(11, "Apply contrast with type and shape", "تطبيق التباين بالنصوص والأشكال", "A single-post design using contrast correctly", "تصميم منشور يطبق التباين بشكل صحيح"),
      createDay(12, "Balance text blocks and focal points", "موازنة الكتل النصية ونقطة التركيز", "One poster with a clear focal point", "بوستر فيه focal point واضحة"),
      createDay(13, "Use alignment and grids", "استخدام الـ alignment والـ grids", "A layout rebuilt on a grid", "تصميم معاد بناؤه على grid"),
      createDay(14, "Simplify busy compositions", "تبسيط التكوينات المزدحمة", "Before-and-after redesign comparison", "مقارنة قبل وبعد لتصميم مبسط"),
      createDay(15, "Build a clean typographic card", "بناء card typographic نظيفة", "A typographic card exported for review", "كارت typographic جاهز للمراجعة"),
      createDay(16, "Finish a fundamentals recap project", "إنهاء مشروع مراجعة الأساسيات", "A polished static post using the week lessons", "بوست static متقن يثبت فهمك للأسبوع"),
    ],
  },
  {
    title: "Week 3 - Color, images, and practical styling",
    titleAr: "الأسبوع 3 - اللون والصور والأسلوب العملي",
    objective: "Choose colors with more control and treat images without chaos.",
    objectiveAr: "اختيار الألوان بشكل أذكى والتعامل مع الصور بدون فوضى.",
    explanation: "This week turns style decisions into a repeatable process.",
    explanationAr: "هذا الأسبوع يحول قرارات الستايل إلى عملية يمكن تكرارها.",
    expectedOutcome: "Cleaner color usage and more controlled image treatment.",
    expectedOutcomeAr: "استخدام أنظف للألوان وتعامل أكثر تحكمًا مع الصور.",
    quizTitle: "Week 3 color and image quiz",
    quizTitleAr: "اختبار الألوان والصور للأسبوع الثالث",
    days: [
      createDay(17, "Build simple color palettes for offers", "بناء palettes بسيطة للعروض", "Two mini palettes for different moods", "2 palette صغيرين لاستخدامين مختلفين"),
      createDay(18, "Match color to audience and message", "ربط اللون بالجمهور والرسالة", "A short rationale for your chosen colors", "شرح قصير لاختياراتك اللونية"),
      createDay(19, "Cut and place product images cleanly", "قص ووضع صور المنتج بشكل نظيف", "A composited product shot in a social layout", "صورة منتج مدمجة داخل layout"),
      createDay(20, "Use shadows and depth without overdoing it", "استخدام الظلال والعمق بدون مبالغة", "An updated design with restrained depth", "تصميم مطور بعمق متوازن"),
      createDay(21, "Control background texture and noise", "التحكم في الخلفيات والـ noise", "A background treatment sample set", "مجموعة تجارب للخلفيات"),
      createDay(22, "Style a sale or promo post", "تنسيق بوست عرض أو promo", "A promo post with clear hierarchy and image styling", "بوست promo منسق بوضوح"),
      createDay(23, "Retouch and crop images for speed", "تجهيز الصور وقصها بسرعة", "Three prepared assets ready for reuse", "3 أصول جاهزة لإعادة الاستخدام"),
      createDay(24, "Ship a complete visual mini campaign", "إنهاء mini campaign بصري كامل", "A 3-post mini campaign for one offer", "mini campaign من 3 تصميمات"),
    ],
  },
  {
    title: "Week 4 - Social media workflow",
    titleAr: "الأسبوع 4 - Workflow متكرر للسوشيال ميديا",
    objective: "Turn scattered skills into a repeatable production system.",
    objectiveAr: "تحويل المهارات المتفرقة إلى workflow إنتاج متكررة.",
    explanation: "The learner starts producing under constraints like real client work.",
    explanationAr: "المتعلم يبدأ يشتغل تحت قيود تشبه شغل العملاء الحقيقي.",
    expectedOutcome: "A repeatable process from brief to export.",
    expectedOutcomeAr: "عملية قابلة للتكرار من brief وحتى export.",
    quizTitle: "Week 4 workflow quiz",
    quizTitleAr: "اختبار workflow للأسبوع الرابع",
    days: [
      createDay(25, "Read a brief and extract priorities", "قراءة brief واستخراج الأولويات", "A filled brief summary sheet", "ورقة brief مختصرة ومفهومة"),
      createDay(26, "Sketch layout ideas fast", "رسم أفكار layout بسرعة", "Three rough layout options", "3 أفكار layout سريعة"),
      createDay(27, "Build the first feed post from brief", "بناء أول feed post من brief", "One feed post draft", "مسودة أول feed post"),
      createDay(28, "Adapt the post for story format", "تكييف التصميم لصيغة story", "A story version of the same campaign", "نسخة story من نفس الحملة"),
      createDay(29, "Create a second variation efficiently", "إنشاء variation ثانية بكفاءة", "A second variation built from the same system", "variation ثانية من نفس النظام"),
      createDay(30, "Package files and exports correctly", "تجهيز الملفات والـ exports بشكل صحيح", "A final exports package", "حزمة exports نهائية"),
      createDay(31, "Review and refine based on feedback", "مراجعة وتحسين التصميم بناء على feedback", "A revised version with change notes", "نسخة معدلة مع ملاحظات التعديل"),
      createDay(32, "Deliver a small social campaign", "تسليم حملة سوشيال صغيرة", "A 4-piece campaign ready to show", "حملة 4 قطع جاهزة للعرض"),
    ],
  },
  {
    title: "Week 5 - Branding basics",
    titleAr: "الأسبوع 5 - أساسيات البراندنج",
    objective: "Introduce brand thinking beyond single social posts.",
    objectiveAr: "إدخال عقلية البراند بدل التوقف عند بوستات منفردة.",
    explanation: "The user learns consistency, not just isolated design execution.",
    explanationAr: "المستخدم يتعلم الاتساق وليس فقط تنفيذ تصميم منفرد.",
    expectedOutcome: "A small brand direction with repeatable visual rules.",
    expectedOutcomeAr: "اتجاه بصري صغير للبراند يمكن تكراره بوضوح.",
    quizTitle: "Week 5 branding quiz",
    quizTitleAr: "اختبار البراندنج للأسبوع الخامس",
    days: [
      createDay(33, "Understand brand personality and references", "فهم شخصية البراند والمراجع", "A simple brand mood sheet", "mood sheet بسيطة للبراند"),
      createDay(34, "Choose type, color, and shape language", "اختيار اللغة البصرية من نوع وخط ولون", "A brand starter style tile", "style tile مبدئي للبراند"),
      createDay(35, "Design a basic logo direction safely", "تصميم اتجاه لوجو مبدئي بشكل آمن", "One rough logo exploration board", "board مبدئي لاستكشاف اللوجو"),
      createDay(36, "Build a mini identity board", "بناء هوية مصغرة", "A one-page identity summary", "صفحة واحدة تلخص الهوية"),
      createDay(37, "Apply brand rules to social templates", "تطبيق الهوية على templates للسوشيال", "Two brand-consistent social templates", "2 template متسقين مع الهوية"),
      createDay(38, "Present the rationale behind choices", "عرض مبررات الاختيارات البصرية", "A short brand presentation page", "صفحة عرض قصيرة توضح المبررات"),
      createDay(39, "Revise identity after critique", "تعديل الهوية بعد النقد", "An updated identity board", "لوحة هوية محدثة"),
      createDay(40, "Package a brand starter kit", "تجهيز brand starter kit", "A folder containing core brand assets", "فولدر فيه الأصول الأساسية للبراند"),
    ],
  },
  {
    title: "Week 6 - Portfolio projects and case presentation",
    titleAr: "الأسبوع 6 - مشاريع البورتفوليو وعرضها",
    objective: "Turn exercises into portfolio-worthy pieces.",
    objectiveAr: "تحويل التمارين إلى مشاريع تستحق الدخول في البورتفوليو.",
    explanation: "The learner starts presenting work like a professional, not just finishing it.",
    explanationAr: "المتعلم يبدأ يعرض شغله كأنه محترف وليس فقط ينهيه.",
    expectedOutcome: "At least two portfolio-ready pieces with clear presentation logic.",
    expectedOutcomeAr: "قطعتان على الأقل جاهزتان للبورتفوليو مع طريقة عرض واضحة.",
    quizTitle: "Week 6 portfolio quiz",
    quizTitleAr: "اختبار البورتفوليو للأسبوع السادس",
    days: [
      createDay(41, "Choose portfolio-worthy projects", "اختيار المشاريع المناسبة للبورتفوليو", "A shortlist of your strongest pieces", "قائمة قصيرة بأقوى مشاريعك"),
      createDay(42, "Refine one old project to a new standard", "تطوير مشروع قديم إلى مستوى أفضل", "A polished revision of an older design", "نسخة مصقولة من مشروع قديم"),
      createDay(43, "Build mockups that support the idea", "بناء mockups تخدم الفكرة", "One mockup presentation board", "لوحة عرض باستخدام mockups"),
      createDay(44, "Write project context and decisions", "كتابة سياق المشروع وقراراتك", "A short case-study text draft", "مسودة case study مختصرة"),
      createDay(45, "Present before/after improvements", "عرض تطورك قبل وبعد", "A comparison slide or image set", "مقارنة بصرية قبل وبعد"),
      createDay(46, "Sequence images for case-study flow", "ترتيب الصور في case study", "A clean project presentation sequence", "تسلسل عرض واضح للمشروع"),
      createDay(47, "Collect feedback and revise the project", "جمع feedback وتعديل المشروع", "A final portfolio version after feedback", "نسخة نهائية للبورتفوليو بعد المراجعة"),
    ],
  },
  {
    title: "Week 7 - Client communication and pricing",
    titleAr: "الأسبوع 7 - التواصل مع العميل والتسعير",
    objective: "Introduce real-world client handling with practical scripts.",
    objectiveAr: "إدخال الواقع العملي للتعامل مع العميل باستخدام scripts واضحة.",
    explanation: "The learner should understand how to sound organized before taking a client.",
    explanationAr: "المتعلم يجب أن يفهم كيف يبدو منظمًا ومحترفًا قبل أخذ أول عميل.",
    expectedOutcome: "Basic confidence around inquiry handling, pricing, scope, and revisions.",
    expectedOutcomeAr: "ثقة أساسية في الرد على العميل والتسعير وتحديد scope والـ revisions.",
    quizTitle: "Week 7 client readiness quiz",
    quizTitleAr: "اختبار الجاهزية للتعامل مع العميل",
    days: [
      createDay(48, "Map the full client journey", "رسم رحلة العميل كاملة", "A client journey checklist", "checklist لرحلة العميل"),
      createDay(49, "Write a clean inquiry response", "كتابة رد احترافي على inquiry", "A reusable inquiry reply template", "template جاهز للرد على inquiry"),
      createDay(50, "Define scope and revision policy", "تحديد scope وسياسة التعديلات", "A mini scope document", "مستند scope صغير"),
      createDay(51, "Price a starter package in EGP", "تسعير باقة بداية بالجنيه المصري", "A simple pricing table in EGP", "جدول تسعير بسيط بالجنيه"),
      createDay(52, "Request deposit and set payment terms", "طلب العربون وتحديد شروط الدفع", "A payment terms message template", "template لرسالة شروط الدفع"),
      createDay(53, "Create a delivery checklist", "إنشاء checklist للتسليم", "A client delivery checklist", "checklist للتسليم للعميل"),
      createDay(54, "Handle feedback without losing control", "التعامل مع feedback بدون فقدان السيطرة", "A revision response script", "script للرد على التعديلات"),
    ],
  },
  {
    title: "Week 8 - Final readiness and launch",
    titleAr: "الأسبوع 8 - الجاهزية النهائية والانطلاق",
    objective: "Consolidate the whole track into a repeatable personal system.",
    objectiveAr: "تجميع كل ما سبق في نظام شخصي قابل للتكرار.",
    explanation: "The learner finishes with a roadmap behind them and a next-step plan in front of them.",
    explanationAr: "المتعلم ينهي المسار ومعه خطة واضحة لما بعده، لا مجرد ملفات متفرقة.",
    expectedOutcome: "A ready starter portfolio, personal workflow, and first client-readiness pack.",
    expectedOutcomeAr: "بورتفوليو بداية جاهز، workflow شخصية، وحزمة أولية للتعامل مع العميل.",
    quizTitle: "Final track assessment",
    quizTitleAr: "التقييم النهائي للمسار",
    days: [
      createDay(55, "Audit your strongest and weakest points", "تقييم نقاط قوتك وضعفك", "A self-audit summary sheet", "ورقة تقييم ذاتي مختصرة"),
      createDay(56, "Fix one recurring technical mistake", "إصلاح خطأ تقني متكرر", "One corrected file showing improvement", "ملف مصحح يثبت التحسن"),
      createDay(57, "Prepare your portfolio sharing link", "تجهيز رابط مشاركة البورتفوليو", "A ready-to-share portfolio link or folder", "رابط أو فولدر جاهز للمشاركة"),
      createDay(58, "Build your first outreach message", "بناء أول رسالة outreach", "A short outreach script", "script قصير للـ outreach"),
      createDay(59, "Plan your next 30 days after the roadmap", "تخطيط أول 30 يوم بعد الـ roadmap", "A next-steps plan document", "وثيقة خطة المرحلة القادمة"),
      createDay(60, "Complete the final project and assessment", "إنهاء المشروع النهائي والتقييم", "A final exported project and completed assessment", "مشروع نهائي مصدّر مع التقييم النهائي"),
    ],
  },
];

