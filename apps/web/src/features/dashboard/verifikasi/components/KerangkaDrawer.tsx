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

export function KerangkaDrawer({
  judul,
  subjudul,
  onTutup,
  footer,
  informasi,
  children,
}: {
  judul: string;
  subjudul: string;
  onTutup: () => void;
  footer?: React.ReactNode;
  informasi?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Drawer open direction="right" onOpenChange={(v) => !v && onTutup()}>
      <DrawerContent className="inset-y-3! right-3! left-auto! h-auto! w-[min(64rem,calc(100vw-1.5rem))]! max-w-none! gap-0 overflow-hidden rounded-2xl border border-border bg-background p-0 shadow-2xl">
        <DrawerHeader className="shrink-0 border-b border-border bg-card/80 px-6 py-5 text-left">
          <div className="flex items-start gap-4 pr-8">
            <IconStack
              aria-hidden="true"
              className="h-14 w-12 shrink-0 text-primary"
            >
              <PencilLine className="size-5" aria-hidden="true" />
            </IconStack>
            <div className="min-w-0 flex-1 self-center">
              <p className="text-label-12 font-semibold tracking-[0.14em] text-primary uppercase">
                Edit data
              </p>
              <DrawerTitle className="mt-0.5 text-heading-20">
                {judul}
              </DrawerTitle>
              <DrawerDescription className="mt-1 truncate text-copy-13">
                {subjudul}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Tutup form edit"
                className="absolute top-5 right-5"
              >
                <X aria-hidden="true" />
              </Button>
            </DrawerClose>
          </div>
          {informasi && (
            <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3">
              {informasi}
            </div>
          )}
        </DrawerHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-6">{children}</div>
        </ScrollArea>

        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-card px-6 py-4">
            {footer}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
