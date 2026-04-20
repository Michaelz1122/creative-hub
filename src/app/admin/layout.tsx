import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/workspace-shell";
import { adminNav } from "@/lib/navigation";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
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
