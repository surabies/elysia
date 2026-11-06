"use client"

import * as React from "react"

type SidebarContextType = {
  isOpen: boolean
  toggleSidebar: () => void
  setIsOpen: (open: boolean) => void
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

const STORAGE_KEY = "elysia-sidebar-state"

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpenState] = React.useState<boolean>(true)
  const [mounted, setMounted] = React.useState(false)

  // Baca status awal dari localStorage setelah mount
  React.useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) {
        setIsOpenState(saved === "true")
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
    <SidebarContext.Provider value={{ isOpen, toggleSidebar, setIsOpen }}>
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
