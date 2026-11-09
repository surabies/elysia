"use client";

import * as React from "react";
import { PencilLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconStack } from "@/components/reui/icon-stack";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/Utilitas";

export function KerangkaDrawer({
  judul,
  subjudul,
  onTutup,
  footer,
  informasi,
  lebar = "w-[min(32rem,calc(100vw-1.5rem))]!",
  children,
}: {
  judul: string;
  subjudul: string;
  onTutup: () => void;
  footer?: React.ReactNode;
  informasi?: React.ReactNode;
  lebar?: string;
  children: React.ReactNode;
}) {
  return (
    <Drawer open direction="right" onOpenChange={(v) => !v && onTutup()}>
      <DrawerContent
        className={cn(
          "inset-y-3! right-3! left-auto! h-auto! max-w-none! gap-0 overflow-hidden rounded-2xl border border-border bg-background p-0 shadow-2xl",
          lebar,
        )}
      >
        <DrawerHeader className="shrink-0 border-b border-border bg-card/80 px-5 py-4 text-left">
          <div className="flex items-start gap-3.5 pr-8">
            <IconStack
              aria-hidden="true"
              className="h-12 w-10 shrink-0 text-primary"
            >
              <PencilLine className="size-4.5" aria-hidden="true" />
            </IconStack>
            <div className="min-w-0 flex-1 self-center">
              <DrawerTitle className="mt-0.5 text-heading-18 font-semibold">
                {judul}
              </DrawerTitle>
              <DrawerDescription className="mt-0.5 truncate text-copy-13 text-muted-foreground">
                {subjudul}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Tutup form edit"
                className="absolute top-4 right-4 size-8"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </DrawerClose>
          </div>
          {informasi && (
            <div className="mt-3.5 rounded-xl border border-border bg-muted/30 p-3">
              {informasi}
            </div>
          )}
        </DrawerHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-5">{children}</div>
        </ScrollArea>

        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-5 py-3.5">
            {footer}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
