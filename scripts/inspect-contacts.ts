import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectContacts() {
  console.log("Inspecting Contacts Table...");

  const { data, error } = await supabase.from("contacts").select("*").limit(10);

  if (error) {
    console.error("Error fetching contacts:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Contacts structure:", JSON.stringify(data[0], null, 2));
    const roles = [...new Set(data.map((c) => c.role))];
    console.log("Roles found in contacts:", roles);
  } else {
    console.log("No contacts found in 'contacts' table.");
  }

  console.log("Inspecting Profiles Table...");
  const { data: profiles, error: pError } = await supabase
    .from("profiles")
    .select("*")
    .limit(10);

  if (pError) {
    console.error("Error fetching profiles:", pError);
  } else if (profiles && profiles.length > 0) {
    console.log("Profiles structure:", JSON.stringify(profiles[0], null, 2));
    const roles = [...new Set(profiles.map((p) => p.role))];
    console.log("Roles found in profiles:", roles);
  } else {
    console.log("No profiles found.");
  }
}

inspectContacts();
