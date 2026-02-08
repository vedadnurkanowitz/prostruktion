import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvidence() {
  console.log("Checking project_evidence table...");
  const { data, error } = await supabase
    .from("project_evidence")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error fetching project_evidence:", error);
    if (error.code === "42P01") {
      console.log("--> CONCLUSION: Table 'project_evidence' DOES NOT EXIST.");
    } else if (error.code === "42501") {
      console.log(
        "--> CONCLUSION: RLS Policy denied access (Permission denied).",
      );
    } else {
      console.log("--> CONCLUSION: Other error.");
    }
  } else {
    console.log("Success! Table exists. Row count:", data.length);
  }
}

checkEvidence();
