import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/workspace-shell";
import { dashboardNav } from "@/lib/navigation";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
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
