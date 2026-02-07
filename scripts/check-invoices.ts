import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInvoicesSchema() {
  const { data, error } = await supabase.from("invoices").select("*").limit(1);

  if (error) {
    console.error("Error selecting from invoices:", error);
    return;
  }

  if (data && data.length > 0) {
    console.log("Existing columns in a row:", Object.keys(data[0]));
  } else {
    // If no data, try to inspect error from an invalid select to see limits?
    // Or just try to insert a dummy record with only known columns if possible?
    console.log("No rows found, cannot infer columns from data.");
  }
}

checkInvoicesSchema();
