import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/workspace-shell";
import { requireAdmin } from "@/lib/auth";
import { adminNav } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <WorkspaceShell
      badge="Admin control center"
      title="Admin"
      description="الإدارة في النسخة الجديدة يجب أن تكون domain-led: payments, tracks, roadmap, content, memberships, coupons, emails, settings."
      navItems={adminNav}
    >
      {children}
    </WorkspaceShell>
  );
}
