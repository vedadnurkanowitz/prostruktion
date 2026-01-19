"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createUser(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const role = formData.get("role") as string;

  if (!email || !password || !fullName || !role) {
    return { error: "All fields are required" };
  }

  // Use Service Role to create user securely without logging them in
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll(cookiesToSet) {},
      },
    },
  );

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name: fullName },
    email_confirm: true,
  });

  if (error) {
    return { error: error.message };
  }

  // Update profile role (Trigger handles creation, but we update the role)
  if (data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: role, full_name: fullName })
      .eq("id", data.user.id);

    if (profileError) {
      return {
        error: "User created but failed to set role: " + profileError.message,
      };
    }
  }

  revalidatePath("/admin/users");
  return { success: `User ${email} created successfully!` };
}
