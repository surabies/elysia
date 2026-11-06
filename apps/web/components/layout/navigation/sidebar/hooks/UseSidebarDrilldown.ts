// components/layout/navigation/sidebar/hooks/UseSidebarDrilldown.ts
// Seluruh state sidebar: grup mana yang terbuka, arah animasi, halaman aktif.
// Komponen tampilan tidak perlu tahu cara kerjanya.

"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { findActiveNav, type NavGroup } from "@/config/Navigasi"
import { useRbac } from "@/components/layout/shell/RbacContext"
import type { ActiveInfo, Direction } from "../types/Tipe"

export function useSidebarDrilldown() {
  const { filteredNavGroups } = useRbac()
  const pathname = usePathname()
  const found = findActiveNav(pathname)
  const isAllowedGroup = found
    ? filteredNavGroups.some((g: NavGroup) => g.id === found.group.id)
    : false
  const activeGroupId = isAllowedGroup ? found?.group.id : undefined
  const activeItem = isAllowedGroup ? found?.item : undefined
  const activeTrail = isAllowedGroup ? found?.trail : undefined

  const active = React.useMemo<ActiveInfo>(
    () => ({ item: activeItem, trail: activeTrail ?? [] }),
    [activeItem, activeTrail]
  )

  // null = tampilan root (daftar grup). Selain itu = id grup yang dibuka.
  const [openGroupId, setOpenGroupId] = React.useState<string | null>(
    activeGroupId ?? null
  )
  const [direction, setDirection] = React.useState<Direction>("forward")

  // Sinkronisasi saat pengguna pindah ke grup lain (link / Ctrl+K).
  // Dilakukan saat render (bukan di useEffect) supaya tidak memicu render
  // berantai dan lolos aturan react-hooks/set-state-in-effect.
  const [prevActiveGroupId, setPrevActiveGroupId] =
    React.useState(activeGroupId)
  if (activeGroupId !== prevActiveGroupId) {
    setPrevActiveGroupId(activeGroupId)
    if (activeGroupId) {
      setDirection("forward")
      setOpenGroupId(activeGroupId)
    }
  }

  const openGroup = React.useCallback((groupId: string) => {
    setDirection("forward")
    setOpenGroupId(groupId)
  }, [])

  const backToRoot = React.useCallback(() => {
    setDirection("back")
    setOpenGroupId(null)
  }, [])

  const currentGroup = openGroupId
    ? filteredNavGroups.find((group: NavGroup) => group.id === openGroupId)
    : undefined

  return {
    active,
    activeGroupId,
    currentGroup,
    direction,
    openGroup,
    backToRoot,
  }
}
