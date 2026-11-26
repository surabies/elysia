import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/index";
import { TooltipProvider } from "@/components/ui/tooltip";
import { InteractiveWaterBackdrop } from "@/components/layout/InteractiveWaterBackdrop";

export default async function LayoutPenuh({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect("/login");

  return (
    <TooltipProvider delayDuration={100}>
      <div className="relative isolate flex min-h-screen flex-col bg-background text-foreground font-sans overflow-x-clip">
        <InteractiveWaterBackdrop />
        {children}
      </div>
    </TooltipProvider>
  );
}
