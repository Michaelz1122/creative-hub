import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { SectionHeading } from "@/components/section-heading";
import { getTrackBySlug } from "@/lib/site-content";

export default async function TrackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const track = getTrackBySlug(slug);

  if (!track) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl space-y-12 px-5 py-16 md:px-8">
        <SectionHeading
          eyebrow={track.status === "active" ? "Active Track" : "Coming Soon"}
          title={`${track.name} | ${track.arabicName}`}
          description={track.description}
        />

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="surface rounded-[34px] p-7">
            <h2 className="text-2xl font-semibold text-white">ماذا سيشعر المستخدم داخل هذا المسار؟</h2>
            <div className="mt-6 space-y-3">
              {track.outcomes.map((outcome) => (
                <div key={outcome} className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                  {outcome}
                </div>
              ))}
            </div>
          </article>
          <article className="surface rounded-[34px] p-7">
            <h2 className="text-2xl font-semibold text-white">شكل الـ roadmap</h2>
            <div className="mt-6 space-y-3">
              {track.weeklyFocus.map((focus) => (
                <div key={focus} className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                  {focus}
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm leading-7 text-slate-400">{track.communityLabel}</p>
          </article>
        </div>

        <div className="surface-strong rounded-[38px] p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent-soft)]">
                Next step
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                {track.status === "active"
                  ? "ابدأ استكشاف الـ dashboard والـ roadmap"
                  : "هذا المسار جاهز architecture-wise وسيُفعّل لاحقًا"}
              </h2>
            </div>
            <Link
              href={track.status === "active" ? "/dashboard/tracks" : "/pricing"}
              className="inline-flex rounded-full bg-[var(--color-accent)] px-6 py-3 text-base font-semibold text-slate-950 transition hover:brightness-110"
            >
              {track.status === "active" ? "Open learner workspace" : "See plans"}
            </Link>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

