import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log("Testing Frontend Query...");

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
            *,
            customer:customer_id(id, customer_number, name, email, phone, address),
            partner_profile:partner_id(id, full_name, email, company_name),
            broker_profile:broker_id(id, full_name, email),
            contractor:contractor_id(id, name, company_name),
            subcontractor:subcontractor_id(id, name, company_name),
            project_work_types(work_type_key, price),
            project_additional_services(service_id, price)
          `,
    )
    .limit(1);

  if (error) {
    console.error("Query Failed!");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Details:", error.details);
    console.error("Hint:", error.hint);
  } else {
    console.log("Query Successful!");
    console.log(JSON.stringify(data, null, 2));
  }
}

testQuery();
