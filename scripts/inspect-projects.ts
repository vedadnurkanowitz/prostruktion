import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log("Inspecting Projects Table...");

  const { data, error } = await supabase.from("projects").select("*");

  if (error) {
    console.error("Error:", error);
    return;
  }

  if (data) {
    const allIds = data.map((p: any) => ({
      id: p.id,
      customer_id: p.customer_id,
      title: p.title,
    }));
    console.log("All Projects:", JSON.stringify(allIds, null, 2));

    if (data.length > 0) {
      console.log("Project Data Sample:", JSON.stringify(data[0], null, 2));
    } else {
      console.log("No projects found to inspect columns.");
    }
  }
}

inspectSchema();
