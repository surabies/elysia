"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { DrdTab } from "@/server/services/dashboard/drd.service";

interface DrdNavbarControlsProps {
  period: string;
  periods: string[];
  tab: DrdTab;
  query: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  exportAction?: ReactNode;
}

function pageHref(
  period: string,
  tab: DrdTab,
  page: number,
  pageSize: number,
  query: string,
) {
  const params = new URLSearchParams({
    periode: period,
    tab,
    page: String(page),
    pageSize: String(pageSize),
  });
  if (query) params.set("q", query);
  return `/laporan/lap-drd?${params.toString()}`;
}

export function DrdNavbarControls({
  period,
  periods,
  tab,
  query,
  page,
  pageSize,
  total,
  totalPages,
  exportAction,
}: DrdNavbarControlsProps) {
  const [target, setTarget] = React.useState<HTMLElement | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const searchTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const [searchValue, setSearchValue] = React.useState(query);
  const isSummary = tab === "ringkasan";

  React.useEffect(() => {
    setTarget(document.getElementById("drd-navbar-controls"));
  }, []);

  React.useEffect(() => {
    setSearchValue(query);
  }, [query]);

  React.useEffect(() => {
    if (isSummary || searchValue === query) return;

    searchTimer.current = setTimeout(() => {
      const params = new URLSearchParams({
        periode: period,
        tab,
        page: "1",
        pageSize: String(pageSize),
      });
      if (searchValue) params.set("q", searchValue);
      router.replace(`/laporan/lap-drd?${params.toString()}`, { scroll: false });
    }, 350);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [isSummary, pageSize, period, query, router, searchValue, tab]);

  if (!target) return null;

  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);
  const submitFilter = () => {
    window.setTimeout(() => formRef.current?.requestSubmit(), 0);
  };

  return createPortal(
    <div className="mx-auto flex w-full max-w-screen-2xl min-w-0 items-center">
      <form
        ref={formRef}
        action="/laporan/lap-drd"
        className="flex w-full min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-2"
      >
        <input type="hidden" name="tab" value={tab} />
        <div className="flex min-w-0 items-center gap-2 max-sm:w-full">
          <Select
            name="periode"
            defaultValue={period}
            onValueChange={submitFilter}
          >
            <SelectTrigger
              id="drd-navbar-period"
              size="sm"
              aria-label="Filter periode laporan"
              className="h-8 w-32 shrink-0 px-2.5 text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              {periods.length ? (
                periods.map((item) => (
                  <SelectItem key={item} value={item}>
                    {new Date(
                      Number(item.slice(0, 4)),
                      Number(item.slice(4, 6)) - 1,
                      1,
                    ).toLocaleDateString("id-ID", {
                      month: "short",
                      year: "numeric",
                    })}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value={period}>{period}</SelectItem>
              )}
            </SelectContent>
          </Select>

          {!isSummary && (
            <InputGroup className="h-8 w-[min(42vw,220px)] min-w-0 shrink-0 bg-card sm:w-52">
              <InputGroupAddon
                align="inline-start"
                className="py-0 pl-2.5 pr-0"
              >
                <Search aria-hidden="true" className="size-3.5" />
              </InputGroupAddon>
              <InputGroupInput
                id="drd-navbar-search"
                name="q"
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Cari data DRD"
                aria-label="Cari data DRD"
                className="h-full px-2 py-1 text-copy-13"
              />
            </InputGroup>
          )}
        </div>

        {!isSummary && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 max-sm:w-full">
            <Select
              name="pageSize"
              defaultValue={String(pageSize)}
              onValueChange={submitFilter}
            >
              <SelectTrigger
                id="drd-navbar-page-size"
                size="sm"
                aria-label="Jumlah baris per halaman"
                className="h-8 w-28 px-2.5 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                {[50, 100, 200, 500, 1000].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size} baris
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <nav
              className="flex shrink-0 items-center gap-1"
              aria-label="Navigasi halaman DRD"
            >
              {page <= 1 ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled
                  aria-label="Halaman sebelumnya"
                  className="size-8"
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                </Button>
              ) : (
                <Button
                  asChild
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Halaman sebelumnya"
                  className="size-8"
                >
                  <Link href={pageHref(period, tab, page - 1, pageSize, query)}>
                    <ChevronLeft aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              )}
              <span
                className="min-w-12 whitespace-nowrap text-center text-xs tabular-nums text-muted-foreground"
                aria-label={`Halaman ${page} dari ${Math.max(1, totalPages)}; baris ${firstRow} sampai ${lastRow} dari ${total}`}
              >
                {page} / {Math.max(1, totalPages)}
              </span>
              {page >= totalPages ? (
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled
                  aria-label="Halaman berikutnya"
                  className="size-8"
                >
                  <ChevronRight aria-hidden="true" className="size-4" />
                </Button>
              ) : (
                <Button
                  asChild
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Halaman berikutnya"
                  className="size-8"
                >
                  <Link href={pageHref(period, tab, page + 1, pageSize, query)}>
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              )}
            </nav>
            {exportAction}
          </div>
        )}
      </form>
    </div>,
    target,
  );
}
