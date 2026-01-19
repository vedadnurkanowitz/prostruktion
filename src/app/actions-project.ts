"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(prevState: any, formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const contractValue = formData.get("contractValue") as string;
  const partnerId = formData.get("partnerId") as string;
  const brokerId = formData.get("brokerId") as string;

  if (!title || !contractValue) {
    return { error: "Title and Contract Value are required" };
  }

  const supabase = await createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
          // We need actual cookies to authenticate as Admin
          // This is a simplified server action pattern for current context
          // In a real Server Action you import cookies() and pass it
        },
        setAll(cookiesToSet) {},
      },
    },
  );

  // Proper way to get authenticated client in Server Action
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );

  // Verify Admin (Double check)
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabaseAuth.from("projects").insert({
    title,
    description,
    contract_value: parseFloat(contractValue),
    partner_id: partnerId || null,
    broker_id: brokerId || null,
    status: "active",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/dashboard");
  return { success: "Project created successfully" };
}
