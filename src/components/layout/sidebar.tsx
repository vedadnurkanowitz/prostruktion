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
      { name: "Todos", href: "/admin/todos", icon: CheckSquare },
      { name: "Financials", href: "/admin/deals", icon: Briefcase },
      { name: "Projects", href: "/admin/projects", icon: Folder },
      { name: "Map", href: "/admin/map", icon: MapIcon },
      { name: "Complaints", href: "/admin/complaints", icon: AlertOctagon },
      { name: "Contacts", href: "/admin/contacts", icon: Users },
      { name: "Archive", href: "/admin/archive", icon: Archive },
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
    <div className="flex min-h-screen flex-col border-r border-white/5 bg-gray-900/90 backdrop-blur-3xl w-64 shrink-0 shadow-2xl z-20 transition-all duration-300 relative overflow-hidden">
      {/* Top Gloss Reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none z-0" />

      <div className="flex h-16 items-center border-b border-white/5 px-4 font-bold text-lg gap-3 text-white relative z-10">
        <Image
          src="/logo-dark.png"
          alt="Prostruktion Logo"
          width={40}
          height={40}
          className="object-contain rounded-xl shadow-lg ring-1 ring-white/10"
        />
        <span className="relative z-10 drop-shadow-sm tracking-wide">
          Prostruktion
        </span>
      </div>
      <div className="flex-1 overflow-auto py-4 scrollbar-thin scrollbar-thumb-gray-600/50 scrollbar-track-transparent relative z-10">
        <nav className="grid items-start px-4 text-sm font-medium gap-2">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-300 ease-out group relative overflow-hidden border border-transparent",
                pathname === item.href
                  ? "bg-white/10 border-white/10 text-white shadow-[0_4px_24px_-1px_rgba(0,0,0,0.2)] backdrop-blur-md font-semibold ring-1 ring-white/5"
                  : "text-gray-400 hover:bg-white/5 hover:border-white/5 hover:text-white hover:shadow-lg hover:-translate-y-0.5",
              )}
            >
              {pathname === item.href && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />
              )}
              <item.icon
                className={cn(
                  "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                  pathname === item.href
                    ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                    : "text-gray-500 group-hover:text-yellow-400",
                )}
              />
              <span className="relative z-10">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t border-white/5 p-4 bg-gradient-to-t from-black/40 to-transparent relative z-10">
        <div className="flex items-center justify-between px-2 py-2 mb-2 bg-black/20 rounded-lg backdrop-blur-md shadow-inner ring-1 ring-white/5 border border-white/5">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
            {role?.replace("_", " ")}
          </span>
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-gray-400 hover:bg-white/5 hover:text-red-400 hover:border-red-500/20 border border-transparent transition-all duration-300 group rounded-xl"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
