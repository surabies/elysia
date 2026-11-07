import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth/index";
import { DashboardShell, SidebarProvider } from "@/components/layout/index";
import { TooltipProvider } from "@/components/ui/tooltip";

async function keluar() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function FluidLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { user } = session;

  return (
    <SidebarProvider>
      <TooltipProvider delayDuration={100}>
        <DashboardShell
          tanpaSidebar
          user={{
            name: user.name ?? null,
            email: user.email ?? "",
            image: user.image ?? null,
            role: user.role,
            roles: user.roles,
          }}
          onKeluar={keluar}
        >
          {children}
        </DashboardShell>
      </TooltipProvider>
    </SidebarProvider>
  );
}
