// components/layout/navigation/sidebar/GroupList.tsx
// Tampilan root: daftar grup/direktorat dengan dukungan label seksi dan filter grup.

"use client";

import { useRbac } from "@/components/layout/shell/RbacContext";
import { getGroupIcon } from "./lib/Icons";
import { NavRowContent, RowChevron } from "./NavRow";
import { navRowClass } from "./lib/Styles";
import type { NavGroup } from "@/config/navigasi";

type Props = {
  activeGroupId?: string;
  onOpen: (groupId: string) => void;
  groups?: NavGroup[];
  label?: string;
};

export function GroupList({ activeGroupId, onOpen, groups, label }: Props) {
  const { filteredNavGroups } = useRbac();

  const listToRender = groups
    ? groups.filter((g) => filteredNavGroups.some((fg) => fg.id === g.id))
    : filteredNavGroups;

  if (listToRender.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5">
      {label && (
        <div className="px-3 py-1 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/60 select-none">
          {label}
        </div>
      )}
      <ul className="flex flex-col gap-px">
        {listToRender.map((group) => (
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
    </div>
  );
}
