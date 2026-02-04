import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gnxewlrlmdoffbhbexsk.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdueGV3bHJsbWRvZmZiaGJleHNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MjU1MDYsImV4cCI6MjA4NDIwMTUwNn0.OywbdIs-57Ums4f2_zAqNMRU5t8onY4_dp6rg2GCxsY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log("Testing Project Query...");

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,

      partner_profile:profiles!partner_id(id, full_name, email, company_name),
      broker_profile:profiles!broker_id(id, full_name, email),
      contractor:contacts!contractor_id(id, name, company_name),
      subcontractor:contacts!subcontractor_id(id, name, company_name),
      project_work_types(work_type_key, price),
      project_additional_services(service_id, price)
    `,
    )
    .limit(1);

  if (error) {
    console.error("---------------- ERROR ----------------");
    console.error(JSON.stringify(error, null, 2));
    console.error("---------------------------------------");
  } else {
    console.log("Success!", data);
  }
}

testQuery();
