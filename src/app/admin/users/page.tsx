import {
  createUserNoteAction,
  extendMembershipAction,
  grantMembershipAction,
  revokeMembershipAction,
} from "@/app/actions/users";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function inputClassName() {
  return "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none";
}

function getMembershipStateLabel(status: string, expiresAt: Date | null) {
  if (status === "ACTIVE" && expiresAt && expiresAt < new Date()) {
    return "Expired";
  }

  return status;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; success?: string; error?: string }>;
}) {
  await requirePermission("users.manage");
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q?.trim() || "";

  const [plans, users] = await Promise.all([
    prisma.plan.findMany({
      where: { isActive: true },
      include: { track: true },
      orderBy: [{ scope: "asc" }, { priceCents: "asc" }],
    }),
    prisma.user.findMany({
      where: query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        memberships: {
          include: {
            plan: {
              include: { track: true },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        paymentRequests: {
          include: {
            plan: {
              include: { track: true },
            },
          },
          orderBy: { submittedAt: "desc" },
          take: 5,
        },
        adminNotes: {
          include: {
            authorUser: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">
          Users & Memberships
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-white">تشغيل الوصول والعضويات بدون كود</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          من هنا تقدر تبحث عن أي مستخدم، ترى حالة عضوياته ومدفوعاته، تمنحه track أو all-access، تمدد العضوية، توقفها، أو تضيف
          ملاحظات تشغيلية سريعة.
        </p>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          تم تنفيذ آخر إجراء بنجاح.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          لم يكتمل الإجراء. راجع الحقول المطلوبة ثم أعد المحاولة.
        </div>
      ) : null}

      <form className="surface rounded-[30px] p-6">
        <label className="mb-2 block text-sm text-slate-300" htmlFor="q">
          ابحث بالاسم أو الإيميل
        </label>
        <div className="flex flex-col gap-4 md:flex-row">
          <input id="q" name="q" defaultValue={query} className={inputClassName()} placeholder="learner@creativehub.eg" />
          <button
            type="submit"
            className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Search users
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {users.map((user) => (
          <article key={user.id} className="surface rounded-[30px] p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">{user.name || user.email}</h2>
                <p className="mt-2 text-sm text-slate-400">{user.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                  {user.memberships.length} membership(s)
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                  {user.paymentRequests.length} recent payment request(s)
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                  {user.adminNotes.length} note(s)
                </div>
              </div>
            </div>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Memberships</h3>
                {user.memberships.length ? (
                  user.memberships.map((membership) => (
                    <div key={membership.id} className="rounded-[26px] border border-white/6 bg-white/[0.03] p-5">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>{membership.plan.scope === "ALL_ACCESS" ? "All-access" : membership.plan.track?.nameAr || "Track plan"}</span>
                        <span>{getMembershipStateLabel(membership.status, membership.expiresAt)}</span>
                        <span>{membership.source || "manual"}</span>
                      </div>
                      <p className="mt-3 text-lg font-semibold text-white">{membership.plan.nameAr}</p>
                      <p className="mt-2 text-sm text-slate-400">
                        {membership.startsAt ? `Start: ${new Date(membership.startsAt).toLocaleDateString()}` : "No start date"}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {membership.expiresAt ? `Expiry: ${new Date(membership.expiresAt).toLocaleDateString()}` : "No expiry date"}
                      </p>
                      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                        <form action={extendMembershipAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
                          <input type="hidden" name="membershipId" value={membership.id} />
                          <input
                            name="extendDays"
                            type="number"
                            min={1}
                            defaultValue={30}
                            className={inputClassName()}
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/5"
                          >
                            Extend
                          </button>
                        </form>
                        <form action={revokeMembershipAction}>
                          <input type="hidden" name="membershipId" value={membership.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10"
                          >
                            Revoke
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[26px] border border-dashed border-white/10 p-5 text-sm text-slate-400">
                    لا توجد عضويات بعد لهذا المستخدم.
                  </div>
                )}

                <div className="rounded-[26px] border border-dashed border-white/10 p-5">
                  <h4 className="text-base font-semibold text-white">Grant access</h4>
                  <form action={grantMembershipAction} className="mt-4 grid gap-4">
                    <input type="hidden" name="userId" value={user.id} />
                    <select name="planId" defaultValue={plans[0]?.id} className={inputClassName()}>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id} className="bg-slate-950">
                          {plan.nameAr} - {plan.scope === "ALL_ACCESS" ? "All-access" : plan.track?.nameAr || "Track"}
                        </option>
                      ))}
                    </select>
                    <select name="grantMode" defaultValue="manual" className={inputClassName()}>
                      <option value="manual" className="bg-slate-950">
                        Manual paid access
                      </option>
                      <option value="complimentary" className="bg-slate-950">
                        Complimentary access
                      </option>
                    </select>
                    <button
                      type="submit"
                      className="w-fit rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                    >
                      Grant membership
                    </button>
                  </form>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Payments & notes</h3>
                <div className="space-y-3">
                  {user.paymentRequests.length ? (
                    user.paymentRequests.map((request) => (
                      <div key={request.id} className="rounded-[26px] border border-white/6 bg-white/[0.03] p-5">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          <span>{request.status}</span>
                          <span>{new Date(request.submittedAt).toLocaleDateString()}</span>
                          <span>{request.plan.nameAr}</span>
                        </div>
                        {request.adminNote ? (
                          <p className="mt-3 text-sm leading-7 text-slate-300">{request.adminNote}</p>
                        ) : (
                          <p className="mt-3 text-sm text-slate-500">No admin note on this payment yet.</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[26px] border border-dashed border-white/10 p-5 text-sm text-slate-400">
                      لا توجد طلبات دفع حديثة لهذا المستخدم.
                    </div>
                  )}
                </div>

                <div className="rounded-[26px] border border-dashed border-white/10 p-5">
                  <h4 className="text-base font-semibold text-white">Admin notes</h4>
                  <div className="mt-4 space-y-3">
                    {user.adminNotes.map((note) => (
                      <div key={note.id} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm text-slate-300">
                        <p>{note.body}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                          {note.authorUser?.email || "Admin"} - {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                  <form action={createUserNoteAction} className="mt-4 grid gap-4">
                    <input type="hidden" name="userId" value={user.id} />
                    <textarea
                      name="body"
                      rows={4}
                      className={inputClassName()}
                      placeholder="أضف ملاحظة تشغيلية سريعة لهذا المستخدم"
                    />
                    <button
                      type="submit"
                      className="w-fit rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
                    >
                      Save note
                    </button>
                  </form>
                </div>
              </div>
            </section>
          </article>
        ))}
      </div>
    </div>
  );
}
