import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/index";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function LayoutPenuh({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/login");

  return (
    <TooltipProvider delayDuration={100}>
      <main className="flex h-dvh min-h-0 flex-col bg-background">
        {children}
      </main>
    </TooltipProvider>
  );
}
