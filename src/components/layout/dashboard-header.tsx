"use client";

import { usePathname } from "next/navigation";

const ROUTE_TITLES: Record<string, string> = {
  "/admin/dashboard": "Overview",
  "/admin/todos": "Tasks & Todos",
  "/admin/deals": "Financials",
  "/admin/projects": "Projects",
  "/admin/map": "Project Map",
  "/admin/complaints": "Complaints",
  "/admin/contacts": "Contacts",
  "/admin/archive": "Archive",
  "/admin/subcontractors": "Subcontractors",
  "/partner/dashboard": "Regional Overview",
  "/partner/brokers": "My Mediators",
  "/broker/dashboard": "My Deals",
  "/broker/commission": "Commission",
};

export function DashboardHeader() {
  const pathname = usePathname();

  const hiddenRoutes = [
    "/admin/map",
    "/admin/dashboard", // Overview
    "/admin/todos",
    "/admin/deals", // Financials
    "/admin/projects",
    "/admin/complaints",
    "/admin/contacts",
    "/admin/archive",
    "/admin/subcontractors",
  ];

  if (hiddenRoutes.includes(pathname)) return null;

  // Find exact match or fallback to generic logic
  let title = ROUTE_TITLES[pathname];

  if (!title) {
    if (pathname.includes("/admin/projects/")) title = "Project Details";
    else if (pathname.includes("/admin/users")) title = "User Management";
    else title = "Dashboard";
  }

  return (
    <header className="flex h-16 items-center gap-4 liquid-glass px-6 shrink-0 z-10 mx-6 mt-6 rounded-2xl">
      <h1 className="font-semibold text-lg text-gray-900 dark:text-white">
        {title}
      </h1>
      {/* Add UserNav or other topbar items here */}
    </header>
  );
}
