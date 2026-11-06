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

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpenState] = React.useState<boolean>(true)
  const [sidebarWidth, setSidebarWidthState] = React.useState<number>(DEFAULT_SIDEBAR_WIDTH)
  const [isResizing, setIsResizing] = React.useState<boolean>(false)
  const [mounted, setMounted] = React.useState(false)

  // Baca status awal dan lebar dari localStorage setelah mount
  React.useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) {
        setIsOpenState(saved === "true")
      }
      const savedWidth = localStorage.getItem(WIDTH_STORAGE_KEY)
      if (savedWidth !== null) {
        let parsed = parseInt(savedWidth, 10)
        if (!isNaN(parsed)) {
          parsed = Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, parsed))
          setSidebarWidthState(parsed)
          document.documentElement.style.setProperty("--sidebar-width", `${parsed}px`)
        }
      }
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }, [])

  const setIsOpen = React.useCallback((open: boolean) => {
    setIsOpenState(open)
    try {
      localStorage.setItem(STORAGE_KEY, String(open))
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
    } catch {
      // Abaikan
    }
  }, [])

  const toggleSidebar = React.useCallback(() => {
    setIsOpenState((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
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
