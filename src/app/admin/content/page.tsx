import {
  toggleContentPublishAction,
  toggleToolkitFeaturedAction,
  toggleToolkitPublishAction,
} from "@/app/actions/content";
import { prisma } from "@/lib/prisma";

export default async function AdminContentPage() {
  const [contentItems, toolkitItems] = await Promise.all([
    prisma.contentItem.findMany({
      include: { track: true },
      orderBy: [{ isPublished: "desc" }, { createdAt: "desc" }],
    }),
    prisma.toolkitItem.findMany({
      include: { track: true },
      orderBy: [{ isPublished: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Content
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">تشغيل المكتبة والـ toolkits</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          هذه الصفحة لا تحاول أن تكون CMS كاملًا الآن. هي فقط المساحة اللازمة لتشغيل المكتبة والـ toolkit layer: رؤية العناصر الحالية وتغيير publish/featured بسرعة.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Content items</h2>
        <div className="grid gap-4">
          {contentItems.map((item) => (
            <div key={item.id} className="surface rounded-[24px] p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">{item.titleAr}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {item.track?.nameAr} - {item.type} - {item.difficulty} - {item.isRequired ? "Required" : "Optional"}
                  </p>
                </div>
                <form action={toggleContentPublishAction}>
                  <input type="hidden" name="contentId" value={item.id} />
                  <input type="hidden" name="nextValue" value={String(!item.isPublished)} />
                  <button
                    type="submit"
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/5"
                  >
                    {item.isPublished ? "Unpublish" : "Publish"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Toolkit items</h2>
        <div className="grid gap-4">
          {toolkitItems.map((item) => (
            <div key={item.id} className="surface rounded-[24px] p-4">
              <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto] xl:items-center">
                <div>
                  <p className="text-lg font-semibold text-white">{item.titleAr}</p>
                  <p className="mt-2 text-sm text-slate-400">
                    {item.track?.nameAr} - {item.category} - {item.isFeatured ? "Featured" : "Standard"}
                  </p>
                </div>
                <form action={toggleToolkitPublishAction}>
                  <input type="hidden" name="toolkitId" value={item.id} />
                  <input type="hidden" name="nextValue" value={String(!item.isPublished)} />
                  <button
                    type="submit"
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/5"
                  >
                    {item.isPublished ? "Unpublish" : "Publish"}
                  </button>
                </form>
                <form action={toggleToolkitFeaturedAction}>
                  <input type="hidden" name="toolkitId" value={item.id} />
                  <input type="hidden" name="nextValue" value={String(!item.isFeatured)} />
                  <button
                    type="submit"
                    className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/5"
                  >
                    {item.isFeatured ? "Remove featured" : "Make featured"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

