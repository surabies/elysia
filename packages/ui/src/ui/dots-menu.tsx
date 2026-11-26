import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Button } from "./button";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IDotsMenuContract } from "../contracts/component-contracts";

export interface DotsMenuProps extends IDotsMenuContract {
  className?: string;
  triggerClassName?: string;
}

/**
 * Geist Dots Menu
 * Standalone three-dots action trigger with standard dropdown menu items.
 * Reference: https://vercel.com/geist/dots-menu
 */
export function DotsMenu({
  items,
  align = "end",
  size = "sm",
  className,
  triggerClassName,
}: DotsMenuProps) {
  return (
    <div className={cn("inline-flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={size === "sm" ? "xs" : "sm"}
            className={cn("size-7 p-0 data-[state=open]:bg-muted", triggerClassName)}
            aria-label="Menu Aksi"
          >
            <MoreHorizontal className="size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="min-w-40 text-xs">
          {items.map((item, index) => (
            <DropdownMenuItem
              key={index}
              disabled={item.disabled}
              onClick={item.onClick}
              className={cn(
                "flex cursor-pointer items-center gap-2",
                item.destructive && "text-destructive focus:text-destructive"
              )}
            >
              {item.icon && <span className="size-3.5 shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
