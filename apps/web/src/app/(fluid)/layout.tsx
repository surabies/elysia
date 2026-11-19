import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth, signOut } from "@/lib/auth/index";
import {
  canAccessInternalRoute,
  isInternalUser,
} from "@/lib/auth/access-control";
import { DashboardShell, SidebarProvider } from "@/components/layout/index";
import { TooltipProvider } from "@/components/ui/tooltip";

export const dynamic = "force-dynamic";

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

  // Tolak mutlak pelanggan (USER) dari area verifikasi (fluid)
  if (!isInternalUser(user.roles)) {
    redirect("/");
  }

  // Verifikasi role terhadap halaman verifikasi yang diminta
  const headerList = await headers();
  const currentPathname = headerList.get("x-pathname") ?? "/verifikasi";
  if (!canAccessInternalRoute(user.roles, currentPathname)) {
    redirect("/dashboard?error=forbidden");
  }

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
