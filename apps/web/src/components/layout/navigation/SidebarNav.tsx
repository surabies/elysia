// components/layout/navigation/SidebarNav.tsx
// Sidebar drill-down bergaya Vercel untuk aplikasi pemerintahan & billing air.
//
//  Tata letak bervariatif & dinamis:
//  - Puncak: Modul mandiri observasi (Dashboard, Analitik, Peta Spasial)
//  - Operasional Lapangan: Grup Operasional & Monitoring, Verifikasi & Mutasi
//  - Tengah: Modul mandiri pusat Data Pelanggan
//  - Billing & Konfigurasi: Grup Billing & Laporan, Master Data
//  - Penutup Siklus: Modul mandiri Closing Periode
//  - Footer: Modul mandiri Pengaturan Sistem

"use client";

import * as React from "react";
import { cn } from "@/lib/Utilitas";
import { GroupDetail } from "./sidebar/GroupDetail";
import { GroupList } from "./sidebar/GroupList";
import { PrimaryNav } from "./sidebar/PrimaryNav";
import { SidebarSearch } from "./sidebar/SidebarSearch";
import { Slide } from "./sidebar/Slide";
import { RowSeparator } from "./sidebar/NavRow";
import { useSidebarDrilldown } from "./sidebar/hooks/UseSidebarDrilldown";
import {
  standaloneTopNav,
  standaloneMidNav,
  standaloneClosingNav,
  standaloneBottomNav,
  navGroups,
} from "@/config/Navigasi";

// Kelompok grup tematik
const operasionalGroups = navGroups.filter(
  (g) => g.id === "monitoring" || g.id === "verifikasi"
);
const billingMasterGroups = navGroups.filter(
  (g) => g.id === "laporan" || g.id === "master"
);

export function SidebarNav({
  className,
  withSearch = false,
}: {
  className?: string;
  withSearch?: boolean;
}) {
  const {
    active,
    activeGroupId,
    currentGroup,
    direction,
    openGroup,
    backToRoot,
  } = useSidebarDrilldown();

  const isInitialMount = React.useRef(true);

  React.useEffect(() => {
    isInitialMount.current = false;
  }, []);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {withSearch && <SidebarSearch />}

      <nav aria-label="Menu utama" className="overflow-hidden">
        {currentGroup ? (
          <Slide
            key={currentGroup.id}
            direction={direction}
            animate={!isInitialMount.current}
          >
            <GroupDetail
              group={currentGroup}
              active={active}
              onBack={backToRoot}
            />
          </Slide>
        ) : (
          <Slide
            key="root"
            direction={direction}
            animate={!isInitialMount.current}
          >
            <div className="flex flex-col gap-px">
              {/* 1. Bagian Puncak: Observasi & Visualisasi Spasial (Standalone) */}
              <PrimaryNav items={standaloneTopNav} />

              <div className="py-1">
                <RowSeparator />
              </div>

              {/* 2. Kelompok Grup Operasional */}
              <GroupList
                groups={operasionalGroups}
                activeGroupId={activeGroupId}
                onOpen={openGroup}
              />

              <div className="py-1.5">
                <RowSeparator />
              </div>

              {/* 3. Bagian Tengah: Pusat Data Pelanggan (Standalone) */}
              <PrimaryNav items={standaloneMidNav} />

              <div className="py-1.5">
                <RowSeparator />
              </div>

              {/* 4. Kelompok Grup Billing & Master */}
              <GroupList
                groups={billingMasterGroups}
                activeGroupId={activeGroupId}
                onOpen={openGroup}
              />

              <div className="py-1.5">
                <RowSeparator />
              </div>

              {/* 5. Aksi Puncak Bulanan: Closing Periode (Standalone) */}
              <PrimaryNav items={standaloneClosingNav} />

              <div className="py-1.5">
                <RowSeparator />
              </div>

              {/* 6. Footer Paling Bawah: Pengaturan & Preferensi Sistem (Standalone) */}
              <PrimaryNav items={standaloneBottomNav} />
            </div>
          </Slide>
        )}
      </nav>
    </div>
  );
}
