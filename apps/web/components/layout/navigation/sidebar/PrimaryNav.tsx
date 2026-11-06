// components/layout/navigation/sidebar/PrimaryNav.tsx
// Tiga menu utama di atas daftar grup: Dashboard, Analytics, Report.
// Datanya dari `primaryNav` di config/Navigasi.ts.

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRbac } from "@/components/layout/shell/RbacContext"
import { getPrimaryIcon } from "./lib/Icons"
import { NavRowContent } from "./NavRow"
import { navRowClass } from "./lib/Styles"
import { isPrimaryActive } from "./lib/Utilitas"

export function PrimaryNav() {
  const pathname = usePathname()
  const { filteredPrimaryNav } = useRbac()

  return (
    <ul className="flex flex-col gap-px">
      {filteredPrimaryNav.map((item) => {
        const isActive = isPrimaryActive(pathname, item.href)

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
        )
      })}
    </ul>
  )
}
