import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testArchive() {
  console.log("Fetching one project...");
  const { data: projects, error: fetchError } = await supabase
    .from("projects")
    .select("id, status")
    .limit(1);

  if (fetchError) {
    console.error("Fetch error:", fetchError);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log("No projects found to test.");
    return;
  }

  const project = projects[0];
  console.log(
    `Testing update on project ${project.id} (current status: ${project.status})`,
  );

  // Try to update status to 'Archived'
  const { error: updateError } = await supabase
    .from("projects")
    .update({ status: "Archived" })
    .eq("id", project.id);

  if (updateError) {
    console.error("❌ Update failed:", updateError);
    console.log("Details:", JSON.stringify(updateError, null, 2));
  } else {
    console.log("✅ Update successful!");

    // Revert
    console.log("Reverting status...");
    await supabase
      .from("projects")
      .update({ status: project.status })
      .eq("id", project.id);
  }
}

testArchive();
