"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function deleteUser(userId: string) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Delete the user from authentication system
    // This typically cascades to profiles if set up correctly,
    // but if not, we might need to delete profile manually first.
    // Assuming standard setup, deleting auth user is the way.

    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error("Error deleting auth user:", authError);
      return { error: authError.message };
    }

    // Also try to delete from public.profiles just in case cascade isn't set,
    // although RLS might block this if not careful, but we are admin.
    // Actually using admin client ignores RLS so we are good.
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      // Don't fail the whole action if auth delete worked, but good to know
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Delete user exception:", error);
    return { error: error.message };
  }
}
