import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "broker"; // Default fallback

  return (
    <div className="flex min-h-screen w-full bg-gray-50/50 dark:bg-gray-900/50 overflow-hidden">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex h-14 items-center gap-4 border-b bg-white dark:bg-gray-950 px-6 shrink-0">
          <h1 className="font-semibold text-lg">Dashboard</h1>
          {/* Add UserNav or other topbar items here */}
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
