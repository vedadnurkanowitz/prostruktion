import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const columnsToCheck = [
  "project_id",
  "project_name",
  "recipient_name",
  "recipient_role",
  "amount",
  "status",
  "date",
  "invoice_type",
  "description",
];

async function checkColumns() {
  console.log(
    "Checking for missing columns by attempting to select each one...",
  );
  const missingColumns = [];

  for (const col of columnsToCheck) {
    try {
      const { error } = await supabase.from("invoices").select(col).limit(1);
      if (
        error &&
        error.message.includes("column") &&
        error.message.includes("does not exist")
      ) {
        console.log(`❌ Column '${col}' is MISSING.`);
        missingColumns.push(col);
      } else if (error) {
        console.log(`❓ Error checking column '${col}': ${error.message}`);
        // If the table doesn't exist, we'll see that error too.
        if (error.message.includes('relation "invoices" does not exist')) {
          console.error("The entire 'invoices' table is missing!");
          return;
        }
      } else {
        console.log(`✅ Column '${col}' exists.`);
      }
    } catch (err: any) {
      console.error(`Unexpected error for column '${col}':`, err);
    }
  }

  if (missingColumns.length > 0) {
    console.log("\nSummary of MISSING columns:");
    missingColumns.forEach((c) => console.log(`- ${c}`));
  } else {
    console.log("\nAll checked columns exist.");
  }
}

checkColumns();
