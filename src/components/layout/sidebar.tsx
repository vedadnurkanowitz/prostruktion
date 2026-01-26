"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  LogOut,
  Folder,
  Archive,
  HardHat,
  AlertOctagon,
  CheckSquare,
  Map as MapIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type SidebarProps = {
  role: "super_admin" | "partner" | "broker" | null;
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const navItems = [];

  if (role === "super_admin") {
    navItems.push(
      { name: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
      { name: "Financials", href: "/admin/deals", icon: Briefcase },
      { name: "Projects", href: "/admin/projects", icon: Folder },
      { name: "Complaints", href: "/admin/complaints", icon: AlertOctagon },
      { name: "Contacts", href: "/admin/contacts", icon: Users },
      { name: "Archive", href: "/admin/archive", icon: Archive },
      { name: "Todos", href: "/admin/todos", icon: CheckSquare },
      { name: "Map", href: "/admin/map", icon: MapIcon },
    );
  } else if (role === "partner") {
    navItems.push(
      {
        name: "Regional Overview",
        href: "/partner/dashboard",
        icon: LayoutDashboard,
      },
      { name: "My Mediators", href: "/partner/brokers", icon: Users },
    );
  } else if (role === "broker") {
    navItems.push(
      { name: "My Deals", href: "/broker/dashboard", icon: LayoutDashboard },
      { name: "Commission", href: "/broker/commission", icon: Briefcase },
    );
  }

  return (
    <div className="flex min-h-screen flex-col border-r border-gray-800 bg-gray-900 w-64 shrink-0">
      <div className="flex h-16 items-center border-b border-gray-800 px-4 font-bold text-lg gap-3 text-white">
        <Image
          src="/logo-dark.png"
          alt="Prostruktion Logo"
          width={40}
          height={40}
          className="object-contain rounded-lg"
        />
        Prostruktion
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium gap-2">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all",
                pathname === item.href
                  ? "bg-yellow-500 text-gray-900 shadow-md font-semibold"
                  : "text-gray-300 hover:bg-yellow-500 hover:text-gray-900 font-medium",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t border-gray-800 p-4">
        <div className="flex items-center justify-between px-2 py-2 mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {role?.replace("_", " ")}
          </span>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-gray-300 hover:bg-yellow-500 hover:text-gray-900 border border-gray-700"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
