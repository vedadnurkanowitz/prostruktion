"use server";

import { createClient } from "@supabase/supabase-js";

// Create admin client that bypasses RLS
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// --- Partner Actions ---

export async function getPartnerStats(partnerId: string) {
  const supabase = getAdminClient();

  // 1. Get Projects for this Partner
  const { data: projects, error } = await supabase
    .from("projects")
    .select("contract_value, created_at")
    .eq("partner_id", partnerId);

  if (error) {
    console.error("Error fetching partner stats:", error);
    return { projectCount: 0, totalSales: 0 };
  }

  // 2. Calculate Stats
  const projectCount = projects.length;
  const totalSales = projects.reduce(
    (sum, p) => sum + (p.contract_value || 0),
    0,
  );

  return { projectCount, totalSales };
}

export async function getPartnerProjects(partnerId: string) {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      broker_profile:broker_id(full_name, email)
    `,
    )
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching partner projects:", error);
    return [];
  }

  // Map to UI-friendly format if needed, similar to Admin
  return data.map((p) => ({
    id: p.id,
    project: p.title,
    address: p.description
      ? p.description.split("\n")[0].replace("Address: ", "")
      : "",
    mediator: p.broker_profile?.full_name || (p.broker_id ? "Mediator" : "-"),
    status: p.status,
    amount: p.contract_value,
    date: p.created_at,
  }));
}

export async function getPartnerMediators(partnerId: string) {
  const supabase = getAdminClient();

  // Find all brokers associated with projects assigned to this partner
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      broker_id,
      broker_profile:broker_id(
        id,
        full_name,
        email,
        phone,
        company_name
      )
    `,
    )
    .eq("partner_id", partnerId)
    .not("broker_id", "is", null);

  if (error) {
    console.error("Error fetching partner mediators:", error);
    return [];
  }

  // Deduplicate brokers
  const uniqueBrokersMap = new Map();

  data.forEach((item: any) => {
    if (item.broker_profile) {
      uniqueBrokersMap.set(item.broker_profile.id, item.broker_profile);
    }
  });

  return Array.from(uniqueBrokersMap.values());
}

// --- Broker (Mediator) Actions ---

export async function getBrokerStats(brokerId: string) {
  const supabase = getAdminClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("contract_value, status")
    .eq("broker_id", brokerId);

  if (error) {
    console.error("Error fetching broker stats:", error);
    return { activeDeals: 0, totalCommission: 0 };
  }

  // Active Deals: Not finished/cancelled
  const activeDeals = projects.filter(
    (p) => !["Finished", "Cancelled", "Abnahme"].includes(p.status),
  ).length;

  // Potential/Earned Commission (10%)
  const totalCommission = projects.reduce((sum, p) => {
    // Exclude cancelled projects from commission calc if needed
    // For now, assuming all assigned projects count or logic can be refined
    return sum + (p.contract_value || 0) * 0.1;
  }, 0);

  return { activeDeals, totalCommission };
}

export async function getBrokerProjects(brokerId: string) {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      partner_profile:partner_id(full_name, company_name)
    `,
    )
    .eq("broker_id", brokerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching broker projects:", error);
    return [];
  }

  return data.map((p) => ({
    id: p.id,
    project: p.title,
    partner:
      p.partner_profile?.company_name ||
      p.partner_profile?.full_name ||
      "Direct",
    status: p.status,
    amount: p.contract_value,
    commission: (p.contract_value || 0) * 0.1,
    date: p.created_at,
  }));
}
