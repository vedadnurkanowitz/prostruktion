import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing Supabase URL or Key in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log("Testing Supabase Connection...");
  console.log("URL:", supabaseUrl);

  // 1. Test Connection by selecting (count)
  console.log("\n--- Step 1: Check Connection (Select Count) ---");
  const { count, error: selectError } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true });

  if (selectError) {
    console.error("Connection Check Failed:", selectError.message);
    return;
  }
  console.log("Connection Successful! Current Project Count:", count);

  // 2. Test Insert
  console.log("\n--- Step 2: Test Insert Project ---");
  const testProject = {
    title: `Test Project ${new Date().toISOString()}`,
    description:
      "This is a test project created by a script to verify Supabase connection.",
    contract_value: 12345.67,
    status: "active",
    partner_id: null,
    broker_id: null,
  };

  const { data, error: insertError } = await supabase
    .from("projects")
    .insert(testProject)
    .select()
    .single();

  if (insertError) {
    console.error("Insert Failed:", insertError.message);
    console.error("Details:", insertError);
  } else {
    console.log("Insert Successful!");
    console.log("Inserted Project:", data);

    // Optional: Cleanup
    // console.log('\n--- Step 3: Cleanup (Delete Test Project) ---');
    // const { error: deleteError } = await supabase.from('projects').delete().eq('id', data.id);
    // if (deleteError) console.error('Cleanup Failed:', deleteError.message);
    // else console.log('Cleanup Successful! Test project deleted.');
  }
}

testSupabase().catch((err) => console.error("Unexpected Error:", err));
