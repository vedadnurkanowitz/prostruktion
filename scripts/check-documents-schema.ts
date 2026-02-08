import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDocuments() {
  console.log("Inspecting 'documents' table...");
  const { data, error } = await supabase.from("documents").select("*").limit(1);

  if (error) {
    console.log("Error querying documents:", error.message);
  } else {
    console.log("Documents sample:", data);
  }

  // Also check if we can list buckets (might fail with anon key)
  console.log("Checking buckets...");
  const { data: buckets, error: bucketError } =
    await supabase.storage.listBuckets();
  if (bucketError) {
    console.log("Error listing buckets:", bucketError.message);
  } else {
    console.log(
      "Buckets:",
      buckets.map((b) => b.name),
    );
  }
}

inspectDocuments();
