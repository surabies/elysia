"use client";

import * as React from "react";
import {
  navGroups,
  primaryNav,
  filterNavGroups,
  filterPrimaryNav,
  flattenNavItems,
  type NavGroup,
  type NavItem,
} from "@/config/navigasi";

export type RbacContextType = {
  userRoles: string[];
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isSuperAdmin: boolean;
  filteredNavGroups: NavGroup[];
  filteredPrimaryNav: NavItem[];
  filteredAllNavItems: NavItem[];
};

const RbacContext = React.createContext<RbacContextType | undefined>(undefined);

export function RbacProvider({
  roles = [],
  children,
}: {
  roles?: string[];
  children: React.ReactNode;
}) {
  const isSuperAdmin = roles.includes("SUPERADMIN");

  const filteredNavGroups = React.useMemo(() => {
    return filterNavGroups(navGroups, roles);
  }, [roles]);

  const filteredPrimaryNav = React.useMemo(() => {
    return filterPrimaryNav(primaryNav, roles);
  }, [roles]);

  const filteredAllNavItems = React.useMemo(() => {
    return flattenNavItems(filteredNavGroups);
  }, [filteredNavGroups]);

  const hasRole = React.useCallback(
    (role: string) => isSuperAdmin || roles.includes(role),
    [isSuperAdmin, roles]
  );

  const hasAnyRole = React.useCallback(
    (targetRoles: string[]) =>
      isSuperAdmin || targetRoles.some((r) => roles.includes(r)),
    [isSuperAdmin, roles]
  );

  const value = React.useMemo(
    () => ({
      userRoles: roles,
      hasRole,
      hasAnyRole,
      isSuperAdmin,
      filteredNavGroups,
      filteredPrimaryNav,
      filteredAllNavItems,
    }),
    [
      roles,
      hasRole,
      hasAnyRole,
      isSuperAdmin,
      filteredNavGroups,
      filteredPrimaryNav,
      filteredAllNavItems,
    ]
  );

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

export function useRbac(): RbacContextType {
  const ctx = React.useContext(RbacContext);
  if (!ctx) {
    // Default fallback if rendered outside provider
    return {
      userRoles: ["SUPERADMIN"],
      hasRole: () => true,
      hasAnyRole: () => true,
      isSuperAdmin: true,
      filteredNavGroups: navGroups,
      filteredPrimaryNav: primaryNav,
      filteredAllNavItems: flattenNavItems(navGroups),
    };
  }
  return ctx;
}
