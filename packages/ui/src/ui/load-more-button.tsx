import * as React from "react";
import { Button } from "./button";
import { Spinner } from "./spinner";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ILoadMoreButtonContract } from "../contracts/component-contracts";

export interface LoadMoreButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick">,
    ILoadMoreButtonContract {}

/**
 * Geist LoadMoreButton
 * Reference: https://vercel.com/geist/load-more-button
 */
export function LoadMoreButton({
  loading = false,
  hasMore = true,
  onLoadMore,
  label = "Muat Lebih Banyak",
  loadingLabel = "Memuat data...",
  className,
  ...props
}: LoadMoreButtonProps) {
  if (!hasMore) {
    return (
      <div className="py-2 text-center text-xs text-muted-foreground">
        Semua data telah ditampilkan.
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={onLoadMore}
      className={cn("w-full gap-2 text-xs", className)}
      {...props}
    >
      {loading ? (
        <>
          <Spinner className="size-3.5" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </>
      )}
    </Button>
  );
}
