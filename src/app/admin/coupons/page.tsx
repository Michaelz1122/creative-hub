import { saveCouponAction } from "@/app/actions/coupons";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inputClassName = "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none";

function formatDateTimeLocal(date: Date | null) {
  if (!date) {
    return "";
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function CouponForm({
  tracks,
  values,
  submitLabel,
}: {
  tracks: Awaited<ReturnType<typeof prisma.track.findMany>>;
  values?: {
    id?: string;
    code?: string;
    label?: string | null;
    discountType?: string;
    discountValue?: number;
    planScope?: string | null;
    trackId?: string | null;
    maxUses?: number | null;
    perUserLimit?: number | null;
    expiresAt?: Date | null;
    isActive?: boolean;
  };
  submitLabel: string;
}) {
  return (
    <form action={saveCouponAction} className="grid gap-4">
      {values?.id ? <input type="hidden" name="couponId" value={values.id} /> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <input name="code" defaultValue={values?.code || ""} placeholder="WELCOME10" className={inputClassName} />
        <input name="label" defaultValue={values?.label || ""} placeholder="Display label" className={inputClassName} />
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        <select name="discountType" defaultValue={values?.discountType || "percentage"} className={inputClassName}>
          <option value="percentage" className="bg-slate-950">
            Percentage
          </option>
          <option value="fixed" className="bg-slate-950">
            Fixed amount
          </option>
          <option value="free" className="bg-slate-950">
            Free access
          </option>
        </select>
        <input
          name="discountValue"
          type="number"
          min={0}
          defaultValue={values?.discountValue ?? 0}
          placeholder="Discount value"
          className={inputClassName}
        />
        <select name="planScope" defaultValue={values?.planScope || ""} className={inputClassName}>
          <option value="" className="bg-slate-950">
            Any scope
          </option>
          <option value="TRACK" className="bg-slate-950">
            Track only
          </option>
          <option value="ALL_ACCESS" className="bg-slate-950">
            All-access only
          </option>
        </select>
        <select name="trackId" defaultValue={values?.trackId || ""} className={inputClassName}>
          <option value="" className="bg-slate-950">
            Any track
          </option>
          {tracks.map((track) => (
            <option key={track.id} value={track.id} className="bg-slate-950">
              {track.nameAr}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        <input
          name="maxUses"
          type="number"
          min={0}
          defaultValue={values?.maxUses ?? undefined}
          placeholder="Usage limit"
          className={inputClassName}
        />
        <input
          name="perUserLimit"
          type="number"
          min={0}
          defaultValue={values?.perUserLimit ?? undefined}
          placeholder="Per-user limit"
          className={inputClassName}
        />
        <input
          name="expiresAt"
          type="datetime-local"
          defaultValue={formatDateTimeLocal(values?.expiresAt || null)}
          className={inputClassName}
        />
        <select name="isActive" defaultValue={String(values?.isActive ?? true)} className={inputClassName}>
          <option value="true" className="bg-slate-950">
            Active
          </option>
          <option value="false" className="bg-slate-950">
            Inactive
          </option>
        </select>
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

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  await requirePermission("coupons.manage");
  const resolvedSearchParams = await searchParams;
  const [tracks, coupons] = await Promise.all([
    prisma.track.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.coupon.findMany({
      include: {
        track: true,
        redemptions: {
          include: {
            user: true,
            paymentRequest: {
              include: {
                plan: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Coupons
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">تشغيل الكوبونات والاستخدام</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          من هنا تقدر تنشئ أو تعدل كوبونات percentage أو fixed أو free، تحدد scope، limits، expiry، وتشوف آخر استخدامات فعلية لها.
        </p>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          تم حفظ الكوبون بنجاح.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          لم يكتمل الحفظ. راجع الحقول الأساسية ثم أعد المحاولة.
        </div>
      ) : null}

      <section className="surface rounded-[30px] p-6">
        <h2 className="text-2xl font-semibold text-white">إضافة coupon جديدة</h2>
        <div className="mt-6">
          <CouponForm tracks={tracks} submitLabel="Create coupon" />
        </div>
      </section>

      <section className="space-y-5">
        {coupons.map((coupon) => (
          <article key={coupon.id} className="surface rounded-[30px] p-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>{coupon.code}</span>
              <span>{coupon.discountType}</span>
              <span>{coupon.planScope || "Any scope"}</span>
              <span>{coupon.track?.nameAr || "Any track"}</span>
              <span>{coupon.usedCount} use(s)</span>
              <span>{coupon.isActive ? "Active" : "Inactive"}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-white">{coupon.label || coupon.code}</h2>
            <p className="mt-2 text-sm text-slate-400">
              Max uses: {coupon.maxUses ?? "Unlimited"} - Per user: {coupon.perUserLimit ?? "Unlimited"} - Expiry:{" "}
              {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleString() : "No expiry"}
            </p>
            <div className="mt-5">
              <CouponForm
                tracks={tracks}
                submitLabel="Save coupon changes"
                values={{
                  id: coupon.id,
                  code: coupon.code,
                  label: coupon.label,
                  discountType: coupon.discountType,
                  discountValue: coupon.discountValue,
                  planScope: coupon.planScope,
                  trackId: coupon.trackId,
                  maxUses: coupon.maxUses,
                  perUserLimit: coupon.perUserLimit,
                  expiresAt: coupon.expiresAt,
                  isActive: coupon.isActive,
                }}
              />
            </div>
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-white">Recent usage</h3>
              {coupon.redemptions.length ? (
                coupon.redemptions.map((redemption) => (
                  <div key={redemption.id} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm text-slate-300">
                    <p>{redemption.user.email}</p>
                    <p className="mt-2 text-slate-500">
                      {redemption.paymentRequest?.plan.nameAr || "Manual redemption"} - {new Date(redemption.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                  لا توجد سجلات استخدام لهذا الكوبون بعد.
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
