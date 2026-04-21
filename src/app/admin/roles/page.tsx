import {
  assignUserRoleAction,
  removeUserRoleAction,
  saveRoleAction,
  syncRolePermissionsAction,
} from "@/app/actions/roles";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inputClassName = "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none";

export default async function AdminRolesPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  await requirePermission("roles.manage");
  const resolvedSearchParams = await searchParams;

  const [roles, permissions, users] = await Promise.all([
    prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: true,
          },
          orderBy: { assignedAt: "desc" },
        },
      },
      orderBy: [{ isSystem: "desc" }, { label: "asc" }],
    }),
    prisma.permission.findMany({
      orderBy: [{ group: "asc" }, { label: "asc" }],
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const permissionGroups = permissions.reduce<Record<string, typeof permissions>>((groups, permission) => {
    groups[permission.group] ||= [];
    groups[permission.group].push(permission);
    return groups;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-accent-soft)]">Roles & Permissions</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">إدارة الأدوار والصلاحيات من داخل المنصة</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          من هنا تقدر تنشئ أدوار جديدة، تربطها بالصلاحيات، ثم تسندها للمستخدمين بدون تعديل كود. الهدف الآن هو
          foundation تشغيلية واضحة، لا نظام معقد.
        </p>
      </div>

      {resolvedSearchParams?.success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          تم حفظ آخر تعديل في الأدوار أو الصلاحيات بنجاح.
        </div>
      ) : null}

      {resolvedSearchParams?.error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          لم يكتمل الإجراء. راجع الحقول أو قيود الصلاحيات ثم أعد المحاولة.
        </div>
      ) : null}

      <section className="surface rounded-[30px] p-6">
        <h2 className="text-2xl font-semibold text-white">إضافة role جديدة</h2>
        <form action={saveRoleAction} className="mt-6 grid gap-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <input name="name" className={inputClassName} placeholder="content_manager" />
            <input name="label" className={inputClassName} placeholder="Content Manager" />
          </div>
          <textarea
            name="description"
            rows={3}
            className={inputClassName}
            placeholder="وصف مختصر للدور ومسؤوليته"
          />
          <button
            type="submit"
            className="w-fit rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
          >
            Create role
          </button>
        </form>
      </section>

      <section className="space-y-5">
        {roles.map((role) => {
          const selectedPermissionIds = role.rolePermissions.map((entry) => entry.permissionId);

          return (
            <article key={role.id} className="surface rounded-[30px] p-6">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>{role.name}</span>
                <span>{role.isSystem ? "System role" : "Custom role"}</span>
                <span>{role.userRoles.length} assignment(s)</span>
                <span>{selectedPermissionIds.length} permission(s)</span>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{role.label}</h2>
                    {role.description ? <p className="mt-2 text-sm leading-7 text-slate-400">{role.description}</p> : null}
                  </div>

                  <form action={saveRoleAction} className="grid gap-4">
                    <input type="hidden" name="roleId" value={role.id} />
                    <div className="grid gap-4 xl:grid-cols-2">
                      <input name="name" defaultValue={role.name} className={inputClassName} />
                      <input name="label" defaultValue={role.label} className={inputClassName} />
                    </div>
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={role.description || ""}
                      className={inputClassName}
                    />
                    <button
                      type="submit"
                      className="w-fit rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
                    >
                      Save role details
                    </button>
                  </form>

                  <div className="rounded-[26px] border border-white/6 bg-white/[0.03] p-5">
                    <h3 className="text-lg font-semibold text-white">Assigned users</h3>
                    <div className="mt-4 space-y-3">
                      {role.userRoles.length ? (
                        role.userRoles.map((assignment) => (
                          <div key={assignment.id} className="rounded-2xl border border-white/6 bg-black/20 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-semibold text-white">{assignment.user.email}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                                  {new Date(assignment.assignedAt).toLocaleDateString()}
                                </p>
                              </div>
                              <form action={removeUserRoleAction}>
                                <input type="hidden" name="userRoleId" value={assignment.id} />
                                <button
                                  type="submit"
                                  className="rounded-full border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10"
                                >
                                  Remove role
                                </button>
                              </form>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">
                          لا يوجد مستخدمون مرتبطون بهذا الدور بعد.
                        </div>
                      )}
                    </div>

                    <form action={assignUserRoleAction} className="mt-5 grid gap-4 md:grid-cols-[1fr_auto]">
                      <input type="hidden" name="roleId" value={role.id} />
                      <select name="userId" defaultValue={users[0]?.id} className={inputClassName}>
                        {users.map((user) => (
                          <option key={user.id} value={user.id} className="bg-slate-950">
                            {user.email}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
                      >
                        Assign user
                      </button>
                    </form>
                  </div>
                </div>

                <div className="rounded-[26px] border border-dashed border-white/10 p-5">
                  <h3 className="text-lg font-semibold text-white">Permissions</h3>
                  <form action={syncRolePermissionsAction} className="mt-5 space-y-5">
                    <input type="hidden" name="roleId" value={role.id} />
                    {Object.entries(permissionGroups).map(([group, groupPermissions]) => (
                      <div key={group} className="space-y-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{group}</p>
                        <div className="grid gap-3">
                          {groupPermissions.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.03] p-4 text-sm text-slate-300"
                            >
                              <input
                                type="checkbox"
                                name="permissionIds"
                                value={permission.id}
                                defaultChecked={selectedPermissionIds.includes(permission.id)}
                                className="mt-1"
                              />
                              <span>
                                <span className="block font-semibold text-white">{permission.label}</span>
                                <span className="mt-1 block text-slate-500">{permission.key}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      type="submit"
                      className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/20 hover:bg-white/5"
                    >
                      Save permissions
                    </button>
                  </form>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
