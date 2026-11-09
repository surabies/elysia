// components/layout/navigation/sidebar/PrimaryNav.tsx
// Menu mandiri pada sidebar (Direct Standalone Items).

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRbac } from "@/components/layout/shell/RbacContext";
import { getPrimaryIcon } from "./lib/Icons";
import { NavRowContent } from "./NavRow";
import { navRowClass } from "./lib/Styles";
import { isPrimaryActive } from "./lib/Utilitas";
import type { NavItem } from "@/config/Navigasi";

export function PrimaryNav({ items }: { items?: NavItem[] } = {}) {
  const pathname = usePathname();
  const { filteredPrimaryNav } = useRbac();

  const listToRender = items
    ? items.filter((item) => filteredPrimaryNav.some((p) => p.href === item.href))
    : filteredPrimaryNav;

  return (
    <ul className="flex flex-col gap-0.5">
      {listToRender.map((item) => {
        const isActive = isPrimaryActive(pathname, item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={navRowClass(isActive)}
            >
              <NavRowContent icon={getPrimaryIcon(item.href)}>
                {item.title}
              </NavRowContent>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
