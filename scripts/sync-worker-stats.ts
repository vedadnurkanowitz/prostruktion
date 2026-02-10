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

async function syncWorkerStats() {
  console.log("Starting worker stats sync...");

  // 1. Fetch all projects
  const { data: projects, error: pError } = await supabase
    .from("projects")
    .select("id, status, project_workers(worker_id)");

  if (pError || !projects) {
    console.error("Error fetching projects:", pError);
    return;
  }

  // 2. Calculate Stats
  const workerStats: Record<
    string,
    { active: number; completed: number; complaints: number }
  > = {};

  projects.forEach((p) => {
    const isCompleted = ["Finished", "Archived", "Completed"].includes(
      p.status,
    );
    const isActive = ["In Progress", "Active", "In Abnahme"].includes(p.status); // Adjusted to include In Abnahme

    if (p.project_workers) {
      p.project_workers.forEach((pw: any) => {
        const wid = pw.worker_id;
        if (!workerStats[wid])
          workerStats[wid] = { active: 0, completed: 0, complaints: 0 };

        if (isCompleted) workerStats[wid].completed++;
        if (isActive) workerStats[wid].active++;
      });
    }
  });

  console.log(
    `Found stats for ${Object.keys(workerStats).length} workers. Updating DB...`,
  );

  // 3. Update Workers
  for (const [workerId, stats] of Object.entries(workerStats)) {
    // Calculate Success Rate
    // ((Completed - Complaints) / Completed) * 100
    // If completed is 0, default to 100 for new workers
    let successRate = 100;
    if (stats.completed > 0) {
      const rawRate =
        ((stats.completed - stats.complaints) / stats.completed) * 100;
      successRate = Math.round(Math.max(0, Math.min(100, rawRate)));
    }

    const { error } = await supabase
      .from("workers")
      .update({
        active_projects: stats.active,
        completed_projects: stats.completed,
        success_rate: successRate,
      })
      .eq("id", workerId);

    if (error) {
      console.error(`Error updating worker ${workerId}:`, error);
    } else {
      console.log(
        `Updated worker ${workerId}: active=${stats.active}, completed=${stats.completed}, success=${successRate}%`,
      );
    }
  }

  console.log("Sync complete.");
}

syncWorkerStats();
