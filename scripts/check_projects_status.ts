import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Using anon key since it is client facing in repo usually?? No, this is node script.
// Wait, the user provided me with `src/lib/supabase/client.ts` which uses `createBrowserClient` likely.
// I need `createClient` for node environment.
// However I can just use the provided anon key if I have it. I'll check `.env.local` first.

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjects() {
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, title, status, lat, lng");

  if (error) {
    console.error("Error fetching projects:", error);
    return;
  }

  console.log("Projects count:", projects.length);
  const statuses = new Set(projects.map((p) => p.status));
  console.log("Unique statuses:", Array.from(statuses));

  if (projects.length > 0) {
    console.log("Sample project:", projects[0]);
  }
}

checkProjects();
