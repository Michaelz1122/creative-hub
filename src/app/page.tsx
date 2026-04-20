import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, LayoutDashboard, Map, ShieldCheck, Wallet } from "lucide-react";

import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { SectionHeading } from "@/components/section-heading";
import { plans, platformStats, tracks } from "@/lib/site-content";

export default function HomePage() {
  const activeTrack = tracks.find((track) => track.status === "active");

  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main>
        <section className="relative overflow-hidden">
          <div className="grid-fade absolute inset-0 opacity-70" />
          <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
            <div className="relative z-10 space-y-8">
              <div className="inline-flex rounded-full border border-[var(--color-accent)]/25 bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-accent-soft)]">
                Egyptian-first learning system for creative careers
              </div>
              <div className="space-y-6">
                <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] text-white md:text-7xl">
                  منصة تخليك تعرف
                  <span className="block text-[var(--color-accent-soft)]">
                    تبدأ منين وتكمّل إزاي
                  </span>
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-300">
                  Creative Hub ليست مجرد library. هي نظام تعلم عملي منظم للمصريين: roadmap يومي، resources
                  واضحة، toolkits، feedback، community، وcareer tools تساعدك تتعلم وتنفذ وتشتغل.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/tracks/graphic-design"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3 text-base font-semibold text-slate-950 transition hover:brightness-110"
                >
                  ابدأ بـ Graphic Design
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 px-6 py-3 text-base font-medium text-white transition hover:border-white/20 hover:bg-white/5"
                >
                  شوف شكل الـ Dashboard
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {platformStats.map((stat) => (
                  <div key={stat.label} className="metric-card rounded-[28px] p-5">
                    <p className="text-3xl font-semibold text-white">{stat.value}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="surface-strong relative rounded-[36px] p-6 md:p-8">
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent-soft)]">
                      Dashboard philosophy
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">
                      المنتج نفسه لازم يوجّهك
                    </h2>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    roadmap-first
                  </span>
                </div>
                <div className="rounded-[28px] border border-white/8 bg-black/25 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-400">Current week</p>
                      <p className="mt-2 text-xl font-semibold text-white">Week 4 - Social Media Workflow</p>
                    </div>
                    <div className="rounded-full bg-[var(--color-accent)]/10 px-4 py-2 text-sm text-[var(--color-accent-soft)]">
                      28% complete
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {[
                      "راجع الـ brief وحدد goal واضح للتصميم",
                      "ابنِ layout أساسي قبل ما تدخل في التفاصيل",
                      "صدّر النسخ المناسبة للـ feed والـ story",
                    ].map((task) => (
                      <div key={task} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        <span className="text-sm text-slate-200">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-sm font-semibold text-white">اليوم</p>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      ستعرف تعمل إيه ولماذا، وما المتوقع منك ترفعه أو تسلّمه.
                    </p>
                  </div>
                  <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-sm font-semibold text-white">بعد الأسبوع</p>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      Quiz بسيط + output واضح + milestone يثبت لك إنك اتحركت فعلًا.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-10 px-5 py-18 md:px-8">
          <SectionHeading
            eyebrow="What the platform solves"
            title="بدل التوهان بين فيديوهات وملفات متفرقة"
            description="المنصة مصممة لتقود المتعلم خطوة بخطوة: تبدأ setup صح، تعرف تعمل إيه كل يوم، تلاقي resources جاهزة في مكان واحد، وتستقبل feedback واضح على شغلك."
          />
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: Map,
                title: "Roadmap واضح",
                text: "كل أسبوع له objective، وكل يوم له tasks وresources وoutput متوقع.",
              },
              {
                icon: Clock3,
                title: "تعلم عملي",
                text: "المهم ليس المشاهدة فقط، بل التنفيذ والفهم والتسليم بشكل منظم.",
              },
              {
                icon: ShieldCheck,
                title: "Career tools",
                text: "تسعير، تواصل مع العميل، ملفات حقوقك، proposal templates، delivery checklists.",
              },
              {
                icon: Wallet,
                title: "دفع واقعي",
                text: "Manual Vodafone Cash flow مناسب للسوق المصري مع مراجعة وإشعارات واضحة.",
              },
            ].map((item) => (
              <div key={item.title} className="surface rounded-[30px] p-6">
                <item.icon className="h-6 w-6 text-[var(--color-accent-soft)]" />
                <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-10 px-5 py-18 md:px-8">
          <SectionHeading
            eyebrow="Tracks"
            title="المسارات من أول يوم مبنية للتوسع"
            description="نبدأ بـ Graphic Design كمجال active، لكن architecture من البداية تسمح بمسارات غير محدودة، لكل مسار roadmap ومكتبة ومجتمع وfeedback وpricing خاص به."
          />
          <div className="grid gap-6 lg:grid-cols-3">
            {tracks.map((track) => (
              <article key={track.slug} className="surface rounded-[32px] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold text-white">{track.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{track.arabicName}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {track.status === "active" ? "Active" : "Coming Soon"}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-300">{track.description}</p>
                <div className="mt-6 space-y-3">
                  {track.weeklyFocus.slice(0, 4).map((focus) => (
                    <div key={focus} className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                      {focus}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-sm text-slate-400">{track.roadmapLabel}</span>
                  <Link
                    href={`/tracks/${track.slug}`}
                    className="text-sm font-semibold text-[var(--color-accent-soft)] transition hover:text-white"
                  >
                    Explore track
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-10 px-5 py-18 md:px-8">
          <SectionHeading
            eyebrow="Roadmap Engine"
            title="الـ roadmap هو المنتج الرئيسي"
            description="بدل roadmap abstract وصعب، النسخة الجديدة تعتمد على 8 أسابيع تقريبًا، كل أسبوع له هدف واضح، وكل يوم فيه task بسيط ومباشر، resources مرتبطة، ومشاكل المبتدئ المتوقعة."
          />
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="surface rounded-[34px] p-6">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  "Week objective + expected outcome",
                  "Daily tasks with time estimate",
                  "Common beginner issues and help notes",
                  "Weekly quiz + milestone checkpoint",
                  "Linked content, toolkit, and output",
                  "Momentum and completion tracking",
                ].map((item) => (
                  <div key={item} className="rounded-[24px] border border-white/6 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="surface rounded-[34px] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
                Launch sequence
              </p>
              <div className="mt-5 space-y-4">
                {[
                  "Week 1: setup البرامج والخطوط والملفات",
                  "Week 2: fundamentals you actually use",
                  "Week 3-4: repeatable design workflow",
                  "Week 5-6: portfolio pieces and critique",
                  "Week 7-8: client readiness and delivery",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3 text-sm text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-10 px-5 py-18 md:px-8">
          <SectionHeading
            eyebrow="Pricing"
            title="سعر عملي يخدم السوق بدل ما يطرده"
            description="العضويات السنوية مصممة لتكون affordable وفي نفس الوقت واضحة القيمة. كل خطة تدفعها تفتح لك roadmap والمكتبة والـ feedback والـ community حسب نوعها."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {plans.map((plan) => (
              <article key={plan.name} className="surface rounded-[34px] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold text-white">{plan.name}</p>
                    <p className="mt-2 text-4xl font-semibold text-[var(--color-accent-soft)]">{plan.price}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {plan.badge}
                  </span>
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-300">{plan.note}</p>
                <Link
                  href="/pricing"
                  className="mt-6 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
                >
                  شوف التفاصيل
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-18 md:px-8">
          <div className="surface-strong rounded-[40px] p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent-soft)]">
                  Start with structure
                </p>
                <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">
                  ابدأ النسخة الجديدة على أساس أنضف وأوضح
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                  هذه البداية الجديدة للمشروع: architecture أقوى، data model أوضح، dashboard-centered UX، وfoundation جاهزة لتوسيع المسارات والـ admin logic مع الوقت.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
                <Link
                  href={activeTrack ? `/tracks/${activeTrack.slug}` : "/pricing"}
                  className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-6 py-3 text-base font-semibold text-slate-950 transition hover:brightness-110"
                >
                  ابدأ بالمسار الحالي
                </Link>
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-base font-medium text-white transition hover:border-white/20 hover:bg-white/5"
                >
                  شوف admin foundation
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

