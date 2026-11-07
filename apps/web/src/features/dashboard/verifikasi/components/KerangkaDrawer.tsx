"use client";

import * as React from "react";
import { PencilLine, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  children,
}: {
  judul: string;
  subjudul: string;
  onTutup: () => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Drawer
      open
      direction="right"
      onOpenChange={(v) => !v && onTutup()}
    >
      <DrawerContent className="!h-dvh !w-[min(100vw,64rem)] !max-w-none gap-0 overflow-hidden rounded-none border-l border-border bg-background p-0 shadow-2xl">
        <DrawerHeader className="shrink-0 border-b border-border bg-card/80 px-6 py-5 text-left">
          <div className="flex items-start gap-4 pr-8">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
              <PencilLine className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-label-12 font-semibold tracking-[0.14em] text-primary uppercase">
                Edit data
              </p>
              <DrawerTitle className="mt-1 text-heading-20">
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
