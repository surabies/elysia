import * as React from "react";
import { Folder, FolderOpen, FileCode, FileText, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IFileTreeContract, IFileTreeItem } from "../contracts/component-contracts";

export interface FileTreeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect">,
    IFileTreeContract {}

function TreeItemNode({
  item,
  currentPath,
  selectedPath,
  onSelect,
}: {
  item: IFileTreeItem;
  currentPath: string;
  selectedPath?: string;
  onSelect?: (item: IFileTreeItem, fullPath: string) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(item.defaultOpen ?? false);
  const path = `${currentPath}/${item.name}`;
  const isSelected = selectedPath === path;
  const isDir = item.type === "directory";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDir) {
      setIsOpen(!isOpen);
    }
    onSelect?.(item, path);
  };

  return (
    <div className="select-none text-xs">
      <div
        onClick={handleClick}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-sm px-2 py-1 font-mono transition-colors",
          isSelected
            ? "bg-accent text-accent-foreground font-semibold"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        {isDir ? (
          <>
            <ChevronRight
              className={cn("size-3.5 transition-transform duration-200", isOpen && "rotate-90")}
            />
            {isOpen ? (
              <FolderOpen className="size-3.5 text-amber-500" />
            ) : (
              <Folder className="size-3.5 text-amber-500" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            {item.name.endsWith(".ts") || item.name.endsWith(".tsx") || item.name.endsWith(".js") ? (
              <FileCode className="size-3.5 text-blue-500" />
            ) : (
              <FileText className="size-3.5 text-zinc-400" />
            )}
          </>
        )}
        <span className="truncate">{item.name}</span>
      </div>

      {isDir && isOpen && item.children && (
        <div className="ml-3 border-l border-border/60 pl-1.5 space-y-0.5 mt-0.5">
          {item.children.map((child, index) => (
            <TreeItemNode
              key={`${child.name}-${index}`}
              item={child}
              currentPath={path}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Geist FileTree Explorer
 * Reference: https://vercel.com/geist/file-tree
 */
export function FileTree({
  items,
  onSelect,
  selectedPath,
  className,
  ...props
}: FileTreeProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-3 shadow-2xs font-mono text-xs",
        className
      )}
      {...props}
    >
      <div className="space-y-0.5">
        {items.map((item, index) => (
          <TreeItemNode
            key={`${item.name}-${index}`}
            item={item}
            currentPath=""
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
