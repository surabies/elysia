// components/layout/navigation/sidebar/GroupDetail.tsx
// Tampilan detail: baris "‹ Nama Grup" untuk kembali, lalu menu grup itu.

import { cn } from "@/lib/Utilitas"
import { GeistChevronLeft } from "./lib/GeistIcons"
import type { NavGroup } from "@/config/Navigasi"
import { getGroupIcon } from "./lib/Icons"
import { NavNodeRow } from "./NavNodeRow"
import { navRowClass } from "./lib/Styles"
import type { ActiveInfo } from "./types/Tipe"
import { nodeKey } from "./lib/Utilitas"

type Props = {
  group: NavGroup
  active: ActiveInfo
  onBack: () => void
}

export function GroupDetail({ group, active, onBack }: Props) {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onBack}
        aria-label={`Kembali ke daftar menu dari ${group.title}`}
        className={cn(navRowClass(false), "mb-1.5 font-medium pr-0.5")}
      >
        <div className="flex-none grid size-9 place-content-center">
          <GeistChevronLeft
            size={16}
            className="size-4 shrink-0 transition-transform duration-200 group-hover/row:-translate-x-0.5 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </div>
        <span className="flex-1 min-w-0 text-center text-sm font-medium truncate">
          {group.title}
        </span>
        <div className="flex-none size-9 pointer-events-none" aria-hidden="true" />
      </button>

      <ul className="flex flex-col gap-px">
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
  )
}
