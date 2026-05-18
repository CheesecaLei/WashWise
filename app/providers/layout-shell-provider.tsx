"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { memberLayoutData, adminLayoutData } from "../data/layout-shell";
import type { LayoutShellContextValue } from "../types/layout-shell";

const LayoutShellContext = createContext<LayoutShellContextValue | null>(null);

export function LayoutShellProvider({ children, userRole = "member" }: { children: React.ReactNode; userRole?: "member" | "admin" }) {
  const router = useRouter();
  const isMobile = useSyncExternalStore(
    (onStoreChange) => {
      const mediaQueryList = window.matchMedia("(max-width:899.95px)");
      mediaQueryList.addEventListener("change", onStoreChange);

      return () => mediaQueryList.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(max-width:899.95px)").matches,
    () => false,
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(isMobile);
  }, [isMobile]);

  const layoutData = userRole === "admin" ? adminLayoutData : memberLayoutData;

  const value = useMemo<LayoutShellContextValue>(
    () => ({
      brandName: layoutData.brandName,
      sidebarTitle: layoutData.sidebarTitle,
      accountTitle: layoutData.accountTitle,
      navItems: layoutData.navItems,
      accountItems: layoutData.accountItems,
      footerLinks: layoutData.footerLinks,
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar: () => setSidebarCollapsed((prev) => !prev),
      navigate: (href: string) => router.push(href),
    }),
    [router, sidebarCollapsed, layoutData],
  );

  return <LayoutShellContext.Provider value={value}>{children}</LayoutShellContext.Provider>;
}

export function useLayoutShell() {
  const context = useContext(LayoutShellContext);
  if (!context) {
    throw new Error("useLayoutShell must be used inside LayoutShellProvider");
  }

  return context;
}
