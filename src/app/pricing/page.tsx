import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { MarketingFooter } from "@/components/marketing-footer";
import { MarketingHeader } from "@/components/marketing-header";
import { SectionHeading } from "@/components/section-heading";
import { plans } from "@/lib/site-content";

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <MarketingHeader />
      <main className="mx-auto max-w-7xl space-y-12 px-5 py-16 md:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="تسعير سنوي واضح ومناسب للمصريين"
          description="في النسخة الجديدة، التسعير مبني على اشتراك سنوي للمسار أو All Access. الدفع اليدوي عبر Vodafone Cash في الوقت الحالي، مع review queue واضحة ورسائل متابعة."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {plans.map((plan) => (
            <article key={plan.name} className="surface rounded-[34px] p-7">
              <div className="flex items-center justify-between">
                <p className="text-2xl font-semibold text-white">{plan.name}</p>
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                  {plan.badge}
                </span>
              </div>
              <p className="mt-4 text-5xl font-semibold text-[var(--color-accent-soft)]">{plan.price}</p>
              <p className="mt-4 text-sm leading-7 text-slate-300">{plan.note}</p>
              <div className="mt-6 space-y-3">
                {[
                  "Roadmap أسبوعي ويومي منظم",
                  "Content library مرتب حسب المرحلة",
                  "Toolkit access مرتبط بالمسار",
                  "WhatsApp community للمشتركين",
                  "Feedback requests داخل المنصة",
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="surface rounded-[34px] p-7">
          <h2 className="text-2xl font-semibold text-white">Manual payment flow</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              "اختر الخطة المناسبة",
              "حوّل عبر Vodafone Cash",
              "ارفع screenshot للتحويل",
              "انتظر مراجعة admin ثم unlock فوري",
            ].map((step) => (
              <div key={step} className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 text-sm text-slate-300">
                {step}
              </div>
            ))}
          </div>
          <Link
            href="/dashboard/billing"
            className="mt-6 inline-flex rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Preview billing workspace
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}

