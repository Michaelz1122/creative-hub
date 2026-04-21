import { saveTrackAction } from "@/app/actions/tracks";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inputClassName = "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none";

function TrackForm({
  values,
  submitLabel,
}: {
  values?: {
    id?: string;
    slug?: string;
    name?: string;
    nameAr?: string;
    summary?: string;
    summaryAr?: string;
    status?: string;
    isFeatured?: boolean;
    sortOrder?: number;
    roadmapLengthDays?: number;
    accentColor?: string | null;
    heroImageUrl?: string | null;
    communityLabel?: string | null;
    communityDescription?: string | null;
    inviteUrl?: string | null;
    isCommunityEnabled?: boolean;
  };
  submitLabel: string;
}) {
  return (
    <form action={saveTrackAction} className="grid gap-4">
      {values?.id ? <input type="hidden" name="trackId" value={values.id} /> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <input name="slug" defaultValue={values?.slug || ""} placeholder="graphic-design" className={inputClassName} />
        <select name="status" defaultValue={values?.status || "COMING_SOON"} className={inputClassName}>
          <option value="ACTIVE" className="bg-slate-950">
            Active
          </option>
          <option value="COMING_SOON" className="bg-slate-950">
            Coming soon
          </option>
          <option value="ARCHIVED" className="bg-slate-950">
            Archived
          </option>
        </select>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <input name="name" defaultValue={values?.name || ""} placeholder="Track name" className={inputClassName} />
        <input name="nameAr" defaultValue={values?.nameAr || ""} placeholder="اسم المسار" className={inputClassName} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <textarea name="summary" rows={3} defaultValue={values?.summary || ""} placeholder="Summary" className={inputClassName} />
        <textarea name="summaryAr" rows={3} defaultValue={values?.summaryAr || ""} placeholder="وصف المسار" className={inputClassName} />
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        <input
          name="sortOrder"
          type="number"
          min={0}
          defaultValue={values?.sortOrder ?? 0}
          placeholder="Order"
          className={inputClassName}
        />
        <input
          name="roadmapLengthDays"
          type="number"
          min={1}
          defaultValue={values?.roadmapLengthDays ?? 60}
          placeholder="Roadmap days"
          className={inputClassName}
        />
        <input name="accentColor" defaultValue={values?.accentColor || ""} placeholder="#f3b63f" className={inputClassName} />
        <select name="isFeatured" defaultValue={String(values?.isFeatured ?? false)} className={inputClassName}>
          <option value="false" className="bg-slate-950">
            Standard
          </option>
          <option value="true" className="bg-slate-950">
            Featured
          </option>
        </select>
      </div>
      <input name="heroImageUrl" defaultValue={values?.heroImageUrl || ""} placeholder="Hero image URL" className={inputClassName} />
      <div className="grid gap-4 xl:grid-cols-2">
        <input
          name="communityLabel"
          defaultValue={values?.communityLabel || ""}
          placeholder="Community label"
          className={inputClassName}
        />
        <select
          name="isCommunityEnabled"
          defaultValue={String(values?.isCommunityEnabled ?? false)}
          className={inputClassName}
        >
          <option value="true" className="bg-slate-950">
            Community visible
          </option>
          <option value="false" className="bg-slate-950">
            Community hidden
          </option>
        </select>
      </div>
      <textarea
        name="communityDescription"
        rows={3}
        defaultValue={values?.communityDescription || ""}
        placeholder="Community description"
        className={inputClassName}
      />
      <input name="inviteUrl" defaultValue={values?.inviteUrl || ""} placeholder="WhatsApp invite URL" className={inputClassName} />
      <button
        type="submit"
        className="w-fit rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default async function AdminTracksPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  await requirePermission("tracks.manage");
  const resolvedSearchParams = await searchParams;
  const tracks = await prisma.track.findMany({
    include: {
      community: true,
      plans: true,
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Tracks
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">إدارة المسارات كمنتجات</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          من هنا تقدر تنشئ أو تعدل المسارات نفسها: status، الترتيب، الوصف، الصورة، عدد أيام الـ roadmap، وإعدادات الـ community
          المرتبطة بها.
        </p>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          تم حفظ بيانات المسار بنجاح.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          لم يكتمل الحفظ. راجع الحقول الأساسية ثم أعد المحاولة.
        </div>
      ) : null}

      <section className="surface rounded-[30px] p-6">
        <h2 className="text-2xl font-semibold text-white">إضافة مسار جديد</h2>
        <div className="mt-6">
          <TrackForm submitLabel="Create track" />
        </div>
      </section>

      <section className="space-y-5">
        {tracks.map((track) => (
          <article key={track.id} className="surface rounded-[30px] p-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
              <span>{track.slug}</span>
              <span>{track.status}</span>
              <span>Order {track.sortOrder}</span>
              <span>{track.plans.length} plan(s)</span>
              <span>{track.community?.isEnabled ? "Community visible" : "Community hidden"}</span>
            </div>
            <h2 className="mt-3 text-xl font-semibold text-white">{track.nameAr}</h2>
            <div className="mt-5">
              <TrackForm
                submitLabel="Save track changes"
                values={{
                  id: track.id,
                  slug: track.slug,
                  name: track.name,
                  nameAr: track.nameAr,
                  summary: track.summary,
                  summaryAr: track.summaryAr,
                  status: track.status,
                  isFeatured: track.isFeatured,
                  sortOrder: track.sortOrder,
                  roadmapLengthDays: track.roadmapLengthDays,
                  accentColor: track.accentColor,
                  heroImageUrl: track.heroImageUrl,
                  communityLabel: track.community?.label,
                  communityDescription: track.community?.description,
                  inviteUrl: track.community?.inviteUrl,
                  isCommunityEnabled: track.community?.isEnabled,
                }}
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
