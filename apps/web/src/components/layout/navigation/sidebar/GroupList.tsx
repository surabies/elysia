// components/layout/navigation/sidebar/GroupList.tsx
// Tampilan root: daftar grup/direktorat. Satu baris per grup, panah di kanan.

import { useRbac } from "@/components/layout/shell/RbacContext"
import { getGroupIcon } from "./lib/Icons"
import { NavRowContent, RowChevron } from "./NavRow"
import { navRowClass } from "./lib/Styles"

type Props = {
  activeGroupId?: string
  onOpen: (groupId: string) => void
}

export function GroupList({ activeGroupId, onOpen }: Props) {
  const { filteredNavGroups } = useRbac()

  return (
    <ul className="flex flex-col gap-px">
      {filteredNavGroups.map((group) => (
        <li key={group.id}>
          <button
            type="button"
            onClick={() => onOpen(group.id)}
            className={navRowClass(group.id === activeGroupId)}
          >
            <NavRowContent
              icon={getGroupIcon(group.id)}
              trailing={<RowChevron />}
            >
              {group.title}
            </NavRowContent>
          </button>
        </li>
      ))}
    </ul>
  )
}
