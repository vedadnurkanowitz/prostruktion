import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, title, status");

  if (error) {
    console.error("Error fetching projects:", error);
    return;
  }

  console.log("Projects count:", projects.length);
  const statuses = new Set(projects.map((p) => p.status));
  console.log("Unique statuses:", Array.from(statuses));

  // Show a few examples
  console.log("Example projects:", projects.slice(0, 3));
}

checkProjects();
