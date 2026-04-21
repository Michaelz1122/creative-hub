import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/workspace-shell";
import { getAvailableAdminPermissions, requireAnyPermission } from "@/lib/auth";
import { adminNav } from "@/lib/navigation";

export const dynamic = "force-dynamic";

const adminPermissionKeys = [
  "users.manage",
  "payments.review",
  "tracks.manage",
  "roadmap.manage",
  "memberships.manage",
  "feedback.manage",
  "content.manage",
  "coupons.manage",
  "quizzes.manage",
  "plans.manage",
  "roles.manage",
] as const;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const permissions = await getAvailableAdminPermissions();
  await requireAnyPermission(adminPermissionKeys);

  const visibleNavItems = adminNav
    .filter((item) => !item.permissionKey || permissions.includes(item.permissionKey))
    .map(({ href, label, caption }) => ({ href, label, caption }));

  return (
    <WorkspaceShell
      badge="Admin control center"
      title="Admin"
      description="الإدارة في Creative Hub يجب أن تبقى هادئة وواضحة: صلاحيات حقيقية، عمليات يومية آمنة، ومسارات تشغيل بدون اعتماد على الكود."
      navItems={visibleNavItems}
    >
      {children}
    </WorkspaceShell>
  );
}
