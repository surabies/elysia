"use client"

import * as React from "react"

export const DEFAULT_SIDEBAR_WIDTH = 256
export const MIN_SIDEBAR_WIDTH = 256
export const MAX_SIDEBAR_WIDTH = 420

type SidebarContextType = {
  isOpen: boolean
  toggleSidebar: () => void
  setIsOpen: (open: boolean) => void
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  isResizing: boolean
  setIsResizing: (resizing: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

const STORAGE_KEY = "elysia-sidebar-state"
const WIDTH_STORAGE_KEY = "elysia-sidebar-width"
const SIDEBAR_STATE_COOKIE = "sidebar_state"
const SIDEBAR_WIDTH_COOKIE = "sidebar_width"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 tahun

export function SidebarProvider({
  defaultOpen = true,
  defaultWidth = DEFAULT_SIDEBAR_WIDTH,
  children,
}: {
  defaultOpen?: boolean
  defaultWidth?: number
  children: React.ReactNode
}) {
  const [isOpen, setIsOpenState] = React.useState<boolean>(defaultOpen)
  const [sidebarWidth, setSidebarWidthState] = React.useState<number>(defaultWidth)
  const [isResizing, setIsResizing] = React.useState<boolean>(false)

  // Inisialisasi properti CSS di sisi client dan sinkronisasi cookie & localStorage
  React.useEffect(() => {
    // Sinkronisasi CSS variable di root
    document.documentElement.style.setProperty("--sidebar-width", `${sidebarWidth}px`)

    try {
      // Pastikan status & lebar konsisten di localStorage dan cookie untuk mencegah reload flash
      const savedState = localStorage.getItem(STORAGE_KEY)
      const savedWidth = localStorage.getItem(WIDTH_STORAGE_KEY)

      if (savedState !== null) {
        document.cookie = `${SIDEBAR_STATE_COOKIE}=${savedState}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
      } else {
        localStorage.setItem(STORAGE_KEY, String(isOpen))
      }

      if (savedWidth !== null) {
        document.cookie = `${SIDEBAR_WIDTH_COOKIE}=${savedWidth}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
      } else {
        localStorage.setItem(WIDTH_STORAGE_KEY, String(sidebarWidth))
      }
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }, [isOpen, sidebarWidth])

  const setIsOpen = React.useCallback((open: boolean) => {
    setIsOpenState(open)
    try {
      localStorage.setItem(STORAGE_KEY, String(open))
      document.cookie = `${SIDEBAR_STATE_COOKIE}=${open}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
    } catch {
      // Abaikan
    }
  }, [])

  const setSidebarWidth = React.useCallback((width: number) => {
    const clamped = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, Math.round(width)))
    setSidebarWidthState(clamped)
    document.documentElement.style.setProperty("--sidebar-width", `${clamped}px`)
    try {
      localStorage.setItem(WIDTH_STORAGE_KEY, String(clamped))
      document.cookie = `${SIDEBAR_WIDTH_COOKIE}=${clamped}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
    } catch {
      // Abaikan
    }
  }, [])

  const toggleSidebar = React.useCallback(() => {
    setIsOpenState((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
        document.cookie = `${SIDEBAR_STATE_COOKIE}=${next}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
      } catch {
        // Abaikan
      }
      return next
    })
  }, [])

  // Shortcut keyboard: Ctrl+B atau Cmd+B untuk toggle sidebar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        toggleSidebar,
        setIsOpen,
        sidebarWidth,
        setSidebarWidth,
        isResizing,
        setIsResizing,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
