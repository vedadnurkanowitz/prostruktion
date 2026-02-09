import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config({ path: "./.env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectStatus() {
  console.log("Checking project statuses...");

  // Get one project
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, status")
    .limit(5);

  if (error) {
    console.error("Error fetching projects:", error);
    return;
  }

  console.log("Sample projects:", projects);

  if (projects && projects.length > 0) {
    const p = projects[0];
    console.log(
      `Attempting to update status for project ${p.id} to 'In Abnahme'`,
    );

    const { error: updateError } = await supabase
      .from("projects")
      .update({ status: "In Abnahme" })
      .eq("id", p.id);

    if (updateError) {
      console.error("Update failed:", updateError);
      // Try to see if it accepts 'Abnahme'
      console.log(
        `Attempting to update status for project ${p.id} to 'Abnahme'`,
      );
      const { error: updateError2 } = await supabase
        .from("projects")
        .update({ status: "Abnahme" })
        .eq("id", p.id);
      if (updateError2) {
        console.error("Update 2 failed:", updateError2);
      } else {
        console.log("Update 2 success: 'Abnahme' is valid.");
      }
    } else {
      console.log("Update success: 'In Abnahme' is valid.");
      // Revert
      await supabase
        .from("projects")
        .update({ status: p.status })
        .eq("id", p.id);
    }
  }
}

checkProjectStatus();
