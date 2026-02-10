const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  console.log("Creating 'project_additional_works' table if not exists...");

  // SQL to create table
  const sql = `
    CREATE TABLE IF NOT EXISTS project_additional_works (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      price NUMERIC DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // We can't run raw SQL easily via client unless we use rpc or just check via inspection.
  // Assuming the user needs to run this manually in dashboard SQL editor usually,
  // BUT I can try to use standard creation logic via an RPC if available or just print instructions.
  // Actually, I should just ask the user to run it, OR use my 'run_command' tool to execute a migration if I had a migration system.
  // Since I don't have a migration system, I will provide the SQL in the final response.

  // However, I can TRY to check if it exists first.
  const { error } = await supabase
    .from("project_additional_works")
    .select("id")
    .limit(1);

  if (error && error.code === "42P01") {
    // undefined_table
    console.log("Table does not exist. Please run the SQL manually.");
    console.log(sql);
  } else {
    console.log(
      "Table seems to exist or another error occurred:",
      error || "OK",
    );
  }
}

createTable();
