import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

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

  // Auto-recovery: If profile is missing (e.g. accidental deletion), recreate it
  if (!profile) {
    console.log("Profile missing. Attempting to recreate Admin profile...");
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      full_name: "Admin User",
      role: "super_admin",
      company_name: "Headquarters",
    });

    if (insertError) {
      console.error("Failed to recover profile:", insertError);
    }
  }

  const role = profile?.role || "super_admin"; // Default fallbacks

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-gray-100 via-white to-gray-200 dark:bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] dark:from-gray-800 dark:via-gray-950 dark:to-black overflow-hidden">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
