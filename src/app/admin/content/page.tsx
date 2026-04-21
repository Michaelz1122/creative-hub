import {
  deleteContentItemAction,
  deleteToolkitItemAction,
  saveContentItemAction,
  saveToolkitItemAction,
} from "@/app/actions/content";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const contentTypeOptions = ["VIDEO", "ARTICLE", "GUIDE", "NOTE", "REFERENCE", "DOWNLOAD", "CHECKLIST"];
const difficultyOptions = ["BEGINNER", "FOUNDATIONAL", "INTERMEDIATE", "ADVANCED"];

function selectClassName() {
  return "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none";
}

function inputClassName() {
  return "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none";
}

type ContentFormValues = {
  id?: string;
  trackId?: string | null;
  title?: string;
  titleAr?: string;
  type?: string;
  provider?: string | null;
  summary?: string | null;
  summaryAr?: string | null;
  url?: string | null;
  difficulty?: string;
  estimatedMinutes?: number | null;
  isRequired?: boolean;
  isFeatured?: boolean;
  isPublished?: boolean;
  sortOrder?: number;
  tags?: string[];
};

function ContentForm({
  tracks,
  values,
  submitLabel,
}: {
  tracks: Awaited<ReturnType<typeof prisma.track.findMany>>;
  values?: ContentFormValues;
  submitLabel: string;
}) {
  return (
    <form action={saveContentItemAction} className="grid gap-4">
      {values?.id ? <input type="hidden" name="contentId" value={values.id} /> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-slate-300">العنوان</label>
          <input name="title" defaultValue={values?.title || ""} className={inputClassName()} />
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">العنوان بالعربي</label>
          <input name="titleAr" defaultValue={values?.titleAr || ""} className={inputClassName()} />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm text-slate-300">المسار</label>
          <select name="trackId" defaultValue={values?.trackId || "global"} className={selectClassName()}>
            <option value="global" className="bg-slate-950">
              عام
            </option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id} className="bg-slate-950">
                {track.nameAr}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">النوع</label>
          <select name="type" defaultValue={values?.type || "GUIDE"} className={selectClassName()}>
            {contentTypeOptions.map((option) => (
              <option key={option} value={option} className="bg-slate-950">
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">المستوى</label>
          <select name="difficulty" defaultValue={values?.difficulty || "BEGINNER"} className={selectClassName()}>
            {difficultyOptions.map((option) => (
              <option key={option} value={option} className="bg-slate-950">
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">الوقت بالدقائق</label>
          <input
            name="estimatedMinutes"
            type="number"
            min={0}
            defaultValue={values?.estimatedMinutes ?? 0}
            className={inputClassName()}
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm text-slate-300">Provider</label>
        <input name="provider" defaultValue={values?.provider || ""} className={inputClassName()} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-slate-300">ملخص</label>
          <textarea
            name="summary"
            rows={3}
            defaultValue={values?.summary || ""}
            className={inputClassName()}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">ملخص بالعربي</label>
          <textarea
            name="summaryAr"
            rows={3}
            defaultValue={values?.summaryAr || ""}
            className={inputClassName()}
          />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_140px_1fr]">
        <div>
          <label className="mb-2 block text-sm text-slate-300">الرابط</label>
          <input name="url" defaultValue={values?.url || ""} className={inputClassName()} />
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">الترتيب</label>
          <input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={values?.sortOrder ?? 0}
            className={inputClassName()}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">Tags</label>
          <input
            name="tags"
            defaultValue={(values?.tags || []).join(", ")}
            className={inputClassName()}
            placeholder="photoshop, setup, exports"
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm text-slate-300">Required</label>
          <select name="isRequired" defaultValue={String(values?.isRequired ?? false)} className={selectClassName()}>
            <option value="false" className="bg-slate-950">
              Optional
            </option>
            <option value="true" className="bg-slate-950">
              Required
            </option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">Featured</label>
          <select name="isFeatured" defaultValue={String(values?.isFeatured ?? false)} className={selectClassName()}>
            <option value="false" className="bg-slate-950">
              Standard
            </option>
            <option value="true" className="bg-slate-950">
              Featured
            </option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">النشر</label>
          <select name="isPublished" defaultValue={String(values?.isPublished ?? false)} className={selectClassName()}>
            <option value="false" className="bg-slate-950">
              Draft
            </option>
            <option value="true" className="bg-slate-950">
              Published
            </option>
          </select>
        </div>
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

type ToolkitFormValues = {
  id?: string;
  trackId?: string | null;
  title?: string;
  titleAr?: string;
  category?: string;
  summary?: string | null;
  summaryAr?: string | null;
  fileUrl?: string | null;
  previewImageUrl?: string | null;
  isFeatured?: boolean;
  isPublished?: boolean;
};

function ToolkitForm({
  tracks,
  values,
  submitLabel,
}: {
  tracks: Awaited<ReturnType<typeof prisma.track.findMany>>;
  values?: ToolkitFormValues;
  submitLabel: string;
}) {
  return (
    <form action={saveToolkitItemAction} className="grid gap-4">
      {values?.id ? <input type="hidden" name="toolkitId" value={values.id} /> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-slate-300">العنوان</label>
          <input name="title" defaultValue={values?.title || ""} className={inputClassName()} />
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">العنوان بالعربي</label>
          <input name="titleAr" defaultValue={values?.titleAr || ""} className={inputClassName()} />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-slate-300">المسار</label>
          <select name="trackId" defaultValue={values?.trackId || "global"} className={selectClassName()}>
            <option value="global" className="bg-slate-950">
              عام
            </option>
            {tracks.map((track) => (
              <option key={track.id} value={track.id} className="bg-slate-950">
                {track.nameAr}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">الفئة</label>
          <input name="category" defaultValue={values?.category || ""} className={inputClassName()} />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-slate-300">ملخص</label>
          <textarea
            name="summary"
            rows={3}
            defaultValue={values?.summary || ""}
            className={inputClassName()}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">ملخص بالعربي</label>
          <textarea
            name="summaryAr"
            rows={3}
            defaultValue={values?.summaryAr || ""}
            className={inputClassName()}
          />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-slate-300">رابط الملف</label>
          <input name="fileUrl" defaultValue={values?.fileUrl || ""} className={inputClassName()} />
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">رابط الـ preview</label>
          <input name="previewImageUrl" defaultValue={values?.previewImageUrl || ""} className={inputClassName()} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-slate-300">Featured</label>
          <select name="isFeatured" defaultValue={String(values?.isFeatured ?? false)} className={selectClassName()}>
            <option value="false" className="bg-slate-950">
              Standard
            </option>
            <option value="true" className="bg-slate-950">
              Featured
            </option>
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm text-slate-300">النشر</label>
          <select name="isPublished" defaultValue={String(values?.isPublished ?? false)} className={selectClassName()}>
            <option value="false" className="bg-slate-950">
              Draft
            </option>
            <option value="true" className="bg-slate-950">
              Published
            </option>
          </select>
        </div>
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

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  await requirePermission("content.manage");
  const resolvedSearchParams = await searchParams;
  const [tracks, contentItems, toolkitItems] = await Promise.all([
    prisma.track.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    }),
    prisma.contentItem.findMany({
      include: { track: true },
      orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.toolkitItem.findMany({
      include: { track: true },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Content Ops
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">تشغيل المكتبة والـ toolkits من الإدارة</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          من هنا تقدر تضيف أو تعدل المحتوى والـ toolkits بدون لمس الكود: ربط بالمسار، تحديد النوع والصعوبة، ترتيب العناصر، تمييز المهم
          منها، ثم نشره مباشرة للمتعلمين.
        </p>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          تم حفظ آخر تعديل بنجاح.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          لم يكتمل الحفظ. راجع الحقول المطلوبة ثم أعد المحاولة.
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">إضافة content item</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            أنشئ عنصرًا جديدًا للمكتبة وحدد هل هو required أو optional، وكم وقته، وهل تريد إبراز ظهوره.
          </p>
          <div className="mt-6">
            <ContentForm tracks={tracks} submitLabel="Create content item" />
          </div>
        </article>

        <article className="surface rounded-[30px] p-6">
          <h2 className="text-2xl font-semibold text-white">إضافة toolkit item</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            أضف الملفات والقوالب والأدوات التي يحتاجها المتعلم داخل المسار، مع الفئة والـ preview والرابط المباشر.
          </p>
          <div className="mt-6">
            <ToolkitForm tracks={tracks} submitLabel="Create toolkit item" />
          </div>
        </article>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Content items</h2>
          <span className="text-sm text-slate-500">{contentItems.length} item(s)</span>
        </div>
        <div className="space-y-5">
          {contentItems.map((item) => (
            <article key={item.id} className="surface rounded-[30px] p-6">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>{item.track?.nameAr || "عام"}</span>
                <span>{item.type}</span>
                <span>{item.difficulty}</span>
                <span>{item.isRequired ? "Required" : "Optional"}</span>
                <span>{item.isPublished ? "Published" : "Draft"}</span>
                <span>{item.isFeatured ? "Featured" : "Standard"}</span>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-white">{item.titleAr}</h3>
              <div className="mt-5">
                <ContentForm
                  tracks={tracks}
                  submitLabel="Save content changes"
                  values={{
                    id: item.id,
                    trackId: item.trackId,
                    title: item.title,
                    titleAr: item.titleAr,
                    type: item.type,
                    provider: item.provider,
                    summary: item.summary,
                    summaryAr: item.summaryAr,
                    url: item.url,
                    difficulty: item.difficulty,
                    estimatedMinutes: item.estimatedMinutes,
                    isRequired: item.isRequired,
                    isFeatured: item.isFeatured,
                    isPublished: item.isPublished,
                    sortOrder: item.sortOrder,
                    tags: item.tags,
                  }}
                />
              </div>
              <form action={deleteContentItemAction} className="mt-4">
                <input type="hidden" name="contentId" value={item.id} />
                <button
                  type="submit"
                  className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10"
                >
                  Delete content item
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-white">Toolkit items</h2>
          <span className="text-sm text-slate-500">{toolkitItems.length} item(s)</span>
        </div>
        <div className="space-y-5">
          {toolkitItems.map((item) => (
            <article key={item.id} className="surface rounded-[30px] p-6">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>{item.track?.nameAr || "عام"}</span>
                <span>{item.category}</span>
                <span>{item.isPublished ? "Published" : "Draft"}</span>
                <span>{item.isFeatured ? "Featured" : "Standard"}</span>
              </div>
              <h3 className="mt-3 text-xl font-semibold text-white">{item.titleAr}</h3>
              <div className="mt-5">
                <ToolkitForm
                  tracks={tracks}
                  submitLabel="Save toolkit changes"
                  values={{
                    id: item.id,
                    trackId: item.trackId,
                    title: item.title,
                    titleAr: item.titleAr,
                    category: item.category,
                    summary: item.summary,
                    summaryAr: item.summaryAr,
                    fileUrl: item.fileUrl,
                    previewImageUrl: item.previewImageUrl,
                    isFeatured: item.isFeatured,
                    isPublished: item.isPublished,
                  }}
                />
              </div>
              <form action={deleteToolkitItemAction} className="mt-4">
                <input type="hidden" name="toolkitId" value={item.id} />
                <button
                  type="submit"
                  className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10"
                >
                  Delete toolkit item
                </button>
              </form>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
