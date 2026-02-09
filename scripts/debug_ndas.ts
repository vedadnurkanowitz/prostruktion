import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function debugNDAS() {
  console.log("Searching for 'NDAS' in contacts...");

  // 1. Find the contact ID for NDAS
  const { data: contacts, error: contactError } = await supabase
    .from("contacts")
    .select("id, name, role")
    .ilike("name", "%NDAS%");

  if (contactError) {
    console.error("Error fetching contact:", contactError);
    return;
  }

  if (!contacts || contacts.length === 0) {
    console.log("No contact found with name 'NDAS'");
    return;
  }

  console.log("Found contacts:", contacts);

  // 2. For each contact, find linked projects
  for (const contact of contacts) {
    console.log(
      `\nChecking projects for ${contact.name} (${contact.role}, ID: ${contact.id})...`,
    );

    // Check all possible columns just in case
    const columns = [
      "subcontractor_id",
      "partner_id",
      "broker_id",
      "contractor_id",
    ];

    for (const col of columns) {
      const { data: projects, error: projectError } = await supabase
        .from("projects")
        .select(`id, title, status, created_at, actual_start, ${col}`)
        .eq(col, contact.id);

      if (projectError) {
        console.error(
          `Error fetching projects for column ${col}:`,
          projectError,
        );
      } else if (projects && projects.length > 0) {
        console.log(`Found ${projects.length} projects in column '${col}':`);
        projects.forEach((p) => {
          console.log(
            ` - Title: "${p.title}", Status: "${p.status}", Start: ${p.actual_start || p.created_at}`,
          );
        });
      } else {
        console.log(`No projects found in column '${col}'`);
      }
    }
  }
}

debugNDAS();
