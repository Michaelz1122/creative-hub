import type { ReactNode } from "react";

import { savePlanAction } from "@/app/actions/plans";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inputClassName = "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{label}</label>
      {children}
    </div>
  );
}

function PlanForm({
  tracks,
  values,
  submitLabel,
}: {
  tracks: Awaited<ReturnType<typeof prisma.track.findMany>>;
  values?: {
    id?: string;
    code?: string;
    name?: string;
    nameAr?: string;
    scope?: string;
    trackId?: string | null;
    priceCents?: number;
    currency?: string;
    billingPeriod?: string;
    durationDays?: number;
    isActive?: boolean;
  };
  submitLabel: string;
}) {
  return (
    <form action={savePlanAction} className="grid gap-4">
      {values?.id ? <input type="hidden" name="planId" value={values.id} /> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <Field label="Code">
          <input name="code" defaultValue={values?.code || ""} className={inputClassName} />
        </Field>
        <Field label="الاسم بالعربي">
          <input name="nameAr" defaultValue={values?.nameAr || ""} className={inputClassName} />
        </Field>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Field label="Name">
          <input name="name" defaultValue={values?.name || ""} className={inputClassName} />
        </Field>
        <Field label="Scope">
          <select name="scope" defaultValue={values?.scope || "TRACK"} className={inputClassName}>
            <option value="TRACK" className="bg-slate-950">
              Track-specific
            </option>
            <option value="ALL_ACCESS" className="bg-slate-950">
              All-access
            </option>
          </select>
        </Field>
      </div>
      <div className="grid gap-4 xl:grid-cols-5">
        <Field label="المسار">
          <select name="trackId" defaultValue={values?.trackId || ""} className={inputClassName}>
            <option value="" className="bg-slate-950">
              بدون مسار
            </option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id} className="bg-slate-950">
                {track.nameAr}
              </option>
            ))}
          </select>
        </Field>
        <Field label="السعر EGP">
          <input name="priceCents" type="number" min={0} defaultValue={values?.priceCents ?? 0} className={inputClassName} />
        </Field>
        <Field label="Currency">
          <input name="currency" defaultValue={values?.currency || "EGP"} className={inputClassName} />
        </Field>
        <Field label="Billing period">
          <input name="billingPeriod" defaultValue={values?.billingPeriod || "annual"} className={inputClassName} />
        </Field>
        <Field label="المدة بالأيام">
          <input name="durationDays" type="number" min={1} defaultValue={values?.durationDays ?? 365} className={inputClassName} />
        </Field>
      </div>
      <div>
        <Field label="الحالة">
          <select name="isActive" defaultValue={String(values?.isActive ?? true)} className={inputClassName}>
            <option value="true" className="bg-slate-950">
              Active
            </option>
            <option value="false" className="bg-slate-950">
              Inactive
            </option>
          </select>
        </Field>
      </div>
      <button
        type="submit"
        className="w-fit rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  await requirePermission("plans.manage");
  const resolvedSearchParams = await searchParams;
  const [tracks, plans] = await Promise.all([
    prisma.track.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    }),
    prisma.plan.findMany({
      include: { track: true },
      orderBy: [{ scope: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Plans & Pricing
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">إدارة الخطط والأسعار</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          من هنا تقدر تضيف خطط جديدة أو تعدل الحالية: سعر الاشتراك، هل هو خاص بمسار أم all-access، مدة التفعيل، وهل الخطة نشطة
          الآن أم لا.
        </p>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          تم حفظ الخطة بنجاح.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          لم يكتمل حفظ الخطة. راجع الحقول المطلوبة ثم أعد المحاولة.
        </div>
      ) : null}

      <section className="surface rounded-[30px] p-6">
        <h2 className="text-2xl font-semibold text-white">إضافة plan جديدة</h2>
        <p className="mt-2 text-sm leading-7 text-slate-400">
          حافظ على naming وcode واضحين، وحدد مدة التفعيل والسعر مباشرة من هنا بدل تعديل الـ seed أو الكود.
        </p>
        <div className="mt-6">
          <PlanForm tracks={tracks} submitLabel="Create plan" />
        </div>
      </section>

      <section className="space-y-5">
        {plans.map((plan) => (
          <article key={plan.id} className="surface rounded-[30px] p-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>{plan.code}</span>
              <span>{plan.scope === "ALL_ACCESS" ? "All-access" : plan.track?.nameAr || "Track"}</span>
              <span>{plan.priceCents} {plan.currency}</span>
              <span>{plan.durationDays} days</span>
              <span>{plan.isActive ? "Active" : "Inactive"}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-white">{plan.nameAr}</h2>
            <div className="mt-5">
              <PlanForm
                tracks={tracks}
                submitLabel="Save plan changes"
                values={{
                  id: plan.id,
                  code: plan.code,
                  name: plan.name,
                  nameAr: plan.nameAr,
                  scope: plan.scope,
                  trackId: plan.trackId,
                  priceCents: plan.priceCents,
                  currency: plan.currency,
                  billingPeriod: plan.billingPeriod,
                  durationDays: plan.durationDays,
                  isActive: plan.isActive,
                }}
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
