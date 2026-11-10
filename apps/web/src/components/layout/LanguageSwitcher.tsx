import { ChevronDown } from "lucide-react"
import Link from "next/link"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { currentLanguageLabel, languages } from "@/config/site"
import { cn } from "@/lib/utils"

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  return (
    <div className={cn("relative", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex cursor-pointer appearance-none items-center gap-1 bg-transparent p-0 text-label-12 font-medium text-foreground outline-none data-[state=open]:[&>svg]:rotate-180"
          >
            {currentLanguageLabel}
            <ChevronDown
              size={14}
              className="transition-transform duration-300 text-muted-foreground"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="top" align="start" className="min-w-0">
          {languages.map((language) => (
            <DropdownMenuItem key={language.label} asChild>
              <Link href={language.href}>{language.label}</Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
