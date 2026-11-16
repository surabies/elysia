"use client"

// features/publik/components/hasil-tagihan/index.tsx — kartu hasil
// cek-tagihan: header identitas + tab (tagihan/riwayat/info).
import { CreditCard, BarChart2, User } from "@/components/ui/hugeicons-compat"
import {
  PillTabs,
  PillTabsList,
  PillTabsTrigger,
  PillTabsContent,
} from "../PillTabs"
import { HasilTagihanHeader } from "./Kepala"
import { TabTagihan } from "./TabTagihan"
import { TabRiwayat } from "./TabRiwayat"
import { TabInfo } from "./TabInfo"
import type { HasilCekTagihan } from "../../lib/api"

const TABS = [
  { value: "tagihan", label: "Tagihan", icon: CreditCard },
  { value: "riwayat", label: "Riwayat", icon: BarChart2 },
  { value: "info", label: "Informasi", icon: User },
] as const

export function HasilTagihan({ hasil }: { hasil: HasilCekTagihan }) {
  return (
    <div className="w-full min-w-0">
      <HasilTagihanHeader hasil={hasil} />

      <div className="p-4 sm:p-6">
        <PillTabs defaultValue="tagihan" className="flex w-full flex-col">
          <PillTabsList>
            {TABS.map(({ value, label, icon: Icon }) => (
              <PillTabsTrigger
                key={value}
                value={value}
                className="gap-1.5 text-xs font-semibold"
              >
                <Icon className="size-3.5 shrink-0" />
                <span>{label}</span>
              </PillTabsTrigger>
            ))}
          </PillTabsList>

          <PillTabsContent value="tagihan" forceMount className="mt-4">
            <TabTagihan hasil={hasil} />
          </PillTabsContent>
          <PillTabsContent value="riwayat" forceMount className="mt-4">
            <TabRiwayat hasil={hasil} />
          </PillTabsContent>
          <PillTabsContent value="info" forceMount className="mt-4">
            <TabInfo hasil={hasil} />
          </PillTabsContent>
        </PillTabs>
      </div>
    </div>
  )
}
