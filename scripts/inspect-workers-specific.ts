import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectWorkers() {
  const { data: workers, error } = await supabase
    .from("workers")
    .select("*")
    .or("name.eq.Milos Nikolic,name.eq.Marko Juhard");

  if (error) {
    console.error("Error fetching workers:", error);
    return;
  }

  console.log("In DB Workers Data:");
  workers.forEach((w) => {
    console.log(`- Name: ${w.name}`);
    console.log(`  ID: ${w.id}`);
    console.log(`  Cert Status: ${w.cert_status}`);
    console.log(`  A1 Status: ${w.a1_status}`);
    console.log(`  Success Rate: ${w.success_rate}`);
    console.log(`  Completed: ${w.completed_projects}`);
    console.log(`  Complaints: ${w.complaints}`);
    console.log("-------------------");
  });
}

inspectWorkers();
