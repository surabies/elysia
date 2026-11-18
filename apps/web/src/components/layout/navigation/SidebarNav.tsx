// components/layout/navigation/SidebarNav.tsx
// Navigasi Sidebar terstruktur & bersih bergaya Vercel Geist Dashboard.
// Membagi modul ke dalam domain operasional PDAM yang konsisten dan flat (tanpa collapse/expand):
// 1. IKHTISAR
// 2. PENCATATAN METER (Pilar 1)
// 3. TAGIHAN (Pilar 2)
// 4. LANGGANAN (Pilar 3)
// 5. SETTING LANDING
// 6. PENGATURAN (Aplikasi, Pengguna & RBAC)

"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useRbac } from "@/components/layout/shell/RbacContext";
import { findActiveNav, type NavGroup } from "@/config/navigasi";
import { SidebarSearch } from "./sidebar/SidebarSearch";
import { NavNodeRow } from "./sidebar/NavNodeRow";
import { getGroupIcon } from "./sidebar/lib/Icons";
import { nodeKey } from "./sidebar/lib/Utilitas";
import type { ActiveInfo } from "./sidebar/types/Tipe";

export function SidebarNav({
  className,
  withSearch = false,
}: {
  className?: string;
  withSearch?: boolean;
}) {
  const pathname = usePathname();
  const { filteredNavGroups } = useRbac();

  // Menentukan node aktif dengan pencocokan href terbaik
  const found = findActiveNav(pathname);
  const active = React.useMemo<ActiveInfo>(
    () => ({
      item: found?.item,
      trail: found?.trail ?? [],
    }),
    [found]
  );

  return (
    <div className={cn("flex flex-col gap-2 pb-6", className)}>
      {withSearch && <SidebarSearch />}

      <nav aria-label="Menu navigasi utama" className="flex flex-col gap-2">
        {filteredNavGroups.map((group: NavGroup, idx: number) => {
          if (!group.items || group.items.length === 0) return null;

          return (
            <div key={group.id} className="flex flex-col">
              {/* Header Seksi: Label grup dengan garis pemisah horizontal tepat di sebelahnya */}
              <div
                className={cn(
                  "flex items-center gap-2 px-2.5 pb-1.5 select-none",
                  idx === 0 ? "pt-1" : "pt-3.5"
                )}
              >
                <span className="text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground/75 shrink-0">
                  {group.title}
                </span>
                <div className="h-px w-full bg-border/40" />
              </div>

              {/* Daftar item menu langsung (konsisten, flat, tanpa collapse/expand) */}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((node, i) => (
                  <NavNodeRow
                    key={nodeKey(node, i)}
                    node={node}
                    active={active}
                    fallbackIcon={getGroupIcon(group.id)}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );
}
