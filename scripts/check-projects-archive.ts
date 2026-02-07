import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const columnsToCheck = ["is_archived", "status", "archived_at"];

async function checkProjectsColumns() {
  console.log("Checking for columns in 'projects' table...");
  const missingColumns = [];

  for (const col of columnsToCheck) {
    try {
      const { error } = await supabase.from("projects").select(col).limit(1);
      if (
        error &&
        error.message.includes("column") &&
        error.message.includes("does not exist")
      ) {
        console.log(`❌ Column '${col}' is MISSING.`);
        missingColumns.push(col);
      } else if (error) {
        console.log(`❓ Error checking column '${col}': ${error.message}`);
      } else {
        console.log(`✅ Column '${col}' exists.`);
      }
    } catch (err: any) {
      console.error(`Unexpected error for column '${col}':`, err);
    }
  }
}

checkProjectsColumns();
