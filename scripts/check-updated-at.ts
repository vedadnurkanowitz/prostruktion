import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUpdatedAt() {
  console.log("Checking columns...");
  const { error } = await supabase
    .from("projects")
    .select("updated_at")
    .limit(1);
  if (
    error &&
    error.message.includes("column") &&
    error.message.includes("does not exist")
  ) {
    console.log("❌ 'updated_at' column MISSING.");
  } else if (error) {
    // access denied etc
    console.log("Error (could be RLS):", error.message);
  } else {
    console.log("✅ 'updated_at' column exists.");
  }
}

checkUpdatedAt();
