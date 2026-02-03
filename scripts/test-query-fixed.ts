import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFixedQuery() {
  console.log("Testing Fixed Frontend Query...");

  // Attempting to use table names and FK disambiguation
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
            *,
            customer:customers(id, customer_number, name, email, phone, address),
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
    console.error("Query Failed!");
    console.error("Message:", error.message);
    if (error.details) console.error("Details:", error.details);
    if (error.hint) console.error("Hint:", error.hint);
  } else {
    console.log("Query Successful!");
    console.log("Results found:", data.length);
  }
}

testFixedQuery();
