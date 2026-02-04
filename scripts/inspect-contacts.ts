import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectContacts() {
  console.log("Inspecting Contacts Table...");

  // Fetch ALL contacts to be sure
  const { data, error } = await supabase.from("contacts").select("*");

  if (error) {
    console.error("Error fetching contacts:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log(`Found ${data.length} total contacts.`);

    // Group by role
    const byRole: Record<string, number> = {};
    data.forEach((c) => {
      const r = c.role || "undefined";
      byRole[r] = (byRole[r] || 0) + 1;
    });
    console.log("Counts by Role:", byRole);

    // List recent Contractors
    const contractors = data.filter((c) => c.role === "contractor");
    if (contractors.length > 0) {
      console.log(
        "Contractors found:",
        contractors.map((c) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          created_at: c.created_at,
        })),
      );
    } else {
      console.log("NO contractors found in database.");
    }

    // Check for standard 'undefined' roles or mixed case
    const weirdRoles = data.filter(
      (c) =>
        ![
          "contractor",
          "worker",
          "partner",
          "broker",
          "subcontractor",
        ].includes(c.role),
    );
    if (weirdRoles.length > 0) {
      console.log(
        "Contacts with unexpected roles:",
        weirdRoles.map((c) => ({ name: c.name, role: c.role })),
      );
    }
  } else {
    console.log("No contacts found in 'contacts' table.");
  }
}

inspectContacts();
