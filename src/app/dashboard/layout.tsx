import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/workspace-shell";
import { requireUser } from "@/lib/auth";
import { dashboardNav } from "@/lib/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser();

  return (
    <WorkspaceShell
      badge="Learner workspace"
      title="Dashboard"
      description="المنصة نفسها يفترض أن تقود المستخدم: أين يبدأ، ماذا يفعل اليوم، وماذا بعد ذلك."
      navItems={dashboardNav}
    >
      {children}
    </WorkspaceShell>
  );
}
