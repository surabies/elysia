// components/layout/navigation/sidebar/NavNodeRow.tsx
// Satu baris item menu: link langsung bergaya Vercel Geist.

"use client";

import * as React from "react";
import Link from "next/link";
import { isNavFolder, type NavNode } from "@/config/navigasi";
import { getItemIcon } from "./lib/Icons";
import { NavRowContent, type SidebarIconComponent } from "./NavRow";
import { navRowClass } from "./lib/Styles";
import type { ActiveInfo } from "./types/Tipe";
import { isPending, nodeKey } from "./lib/Utilitas";

type Props = {
  node: NavNode;
  active: ActiveInfo;
  fallbackIcon: SidebarIconComponent;
};

export function NavNodeRow({ node, active, fallbackIcon }: Props) {
  if (isNavFolder(node)) {
    return (
      <li className="flex flex-col gap-0.5">
        {node.children.map((child, i) => (
          <NavNodeRow
            key={nodeKey(child, i)}
            node={child}
            active={active}
            fallbackIcon={fallbackIcon}
          />
        ))}
      </li>
    );
  }

  const isActive = node === active.item;

  return (
    <li>
      <Link
        href={node.href}
        aria-current={isActive ? "page" : undefined}
        className={navRowClass(isActive)}
      >
        <NavRowContent
          icon={getItemIcon(node.title, fallbackIcon)}
          trailing={
            isPending(node) && (
              <span className="shrink-0 rounded-full border border-sidebar-border px-1.5 py-0.5 text-[10px] leading-none font-medium text-sidebar-foreground/70">
                Segera
              </span>
            )
          }
        >
          {node.title}
        </NavRowContent>
      </Link>
    </li>
  );
}
