import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatusValues() {
  console.log("Checking project attributes...");

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .limit(1);
  const p = projects?.[0];

  if (!p) {
    console.log("No projects found.");
    return;
  }

  console.log("Testing abnahme_confirmed arbitrary strings...");
  if (p) {
    const { error: errorStr } = await supabase
      .from("projects")
      .update({ abnahme_confirmed: "Doing Abnahme Now" })
      .eq("id", p.id);
    console.log(
      "String 'Doing Abnahme Now' update:",
      errorStr ? "Failed: " + errorStr.message : "Success",
    );
    // revert
    await supabase
      .from("projects")
      .update({ abnahme_confirmed: p.abnahme_confirmed || null })
      .eq("id", p.id);
  }
}

checkStatusValues();
