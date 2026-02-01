"use client";

import { useState, useEffect } from "react";
import { createProject } from "@/app/actions-project";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Users, Loader2 } from "lucide-react";

type Worker = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export default function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [error, setError] = useState("");

  // Workers state
  const [selectedSubcontractor, setSelectedSubcontractor] =
    useState<string>("");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  const fetchUsers = async () => {
    const supabase = createClient();

    // Fetch from Supabase
    const { data: p } = await supabase
      .from("profiles")
      .select("id, full_name, role, email")
      .eq("role", "partner");
    const { data: b } = await supabase
      .from("profiles")
      .select("id, full_name, role, email")
      .eq("role", "broker");

    // Start with Supabase data
    let allPartners = p || [];
    let allBrokers = b || [];
    let allSubs: any[] = [];
    let allContractors: any[] = [];

    // Also load from localStorage
    try {
      const storedPartners = localStorage.getItem("prostruktion_partners");
      if (storedPartners) {
        const parsed = JSON.parse(storedPartners);
        parsed.forEach((item: any) => {
          // Avoid duplicates by name
          if (!allPartners.some((p: any) => p.full_name === item.name)) {
            allPartners.push({
              id: `local-partner-${item.name}`,
              full_name: item.name,
              email: item.email,
              role: "partner",
            });
          }
        });
      }

      const storedMediators = localStorage.getItem("prostruktion_mediators");
      if (storedMediators) {
        const parsed = JSON.parse(storedMediators);
        parsed.forEach((item: any) => {
          if (!allBrokers.some((b: any) => b.full_name === item.name)) {
            allBrokers.push({
              id: `local-broker-${item.name}`,
              full_name: item.name,
              email: item.email,
              role: "broker",
            });
          }
        });
      }

      const storedSubs = localStorage.getItem("prostruktion_subcontractors");
      if (storedSubs) {
        const parsed = JSON.parse(storedSubs);
        parsed.forEach((item: any) => {
          allSubs.push({
            id: `local-sub-${item.name}`,
            full_name: item.name,
            email: item.email,
            role: "subcontractor",
          });
        });
      }

      const storedContractors = localStorage.getItem(
        "prostruktion_contractors",
      );
      if (storedContractors) {
        const parsed = JSON.parse(storedContractors);
        parsed.forEach((item: any) => {
          allContractors.push({
            id: `local-contractor-${item.name}`,
            full_name: item.name,
            email: item.email,
            role: "contractor",
          });
        });
      }
    } catch (e) {
      console.error("Error loading contacts from localStorage:", e);
    }

    setPartners(allPartners);
    setBrokers(allBrokers);
    setSubcontractors(allSubs);
    setContractors(allContractors);
  };

  // Fetch workers when subcontractor changes
  const fetchWorkersForSubcontractor = async (subcontractorId: string) => {
    if (!subcontractorId) {
      setWorkers([]);
      setSelectedWorkers([]);
      return;
    }

    setLoadingWorkers(true);

    // Extract the subcontractor name from the ID
    const sub = subcontractors.find((s) => s.id === subcontractorId);
    if (!sub) {
      setLoadingWorkers(false);
      return;
    }

    const subName = sub.full_name;
    const supabase = createClient();

    // Fetch workers from contacts table where company_name matches
    const { data: workersData, error } = await supabase
      .from("contacts")
      .select("id, name, email, role, status")
      .eq("role", "worker")
      .eq("company_name", subName);

    if (error) {
      console.error("Error fetching workers:", error);
    }

    const mappedWorkers = (workersData || []).map((w: any) => ({
      id: w.id,
      name: w.name, // Ensure we map name correctly
      email: w.email,
      role: w.role,
      status: w.status,
    }));

    setWorkers(mappedWorkers);
    setSelectedWorkers([]); // Reset selection when subcontractor changes
    setLoadingWorkers(false);
  };

  useEffect(() => {
    if (open) {
      fetchUsers();
      // Reset workers when dialog opens
      setSelectedSubcontractor("");
      setWorkers([]);
      setSelectedWorkers([]);
    }
  }, [open]);

  // Fetch workers when subcontractor selection changes
  useEffect(() => {
    if (selectedSubcontractor) {
      fetchWorkersForSubcontractor(selectedSubcontractor);
    }
  }, [selectedSubcontractor, subcontractors]);

  const handleWorkerToggle = (workerId: string) => {
    setSelectedWorkers((prev) =>
      prev.includes(workerId)
        ? prev.filter((id) => id !== workerId)
        : [...prev, workerId],
    );
  };

  const handleSubmit = async (formData: FormData) => {
    // Add selected workers to form data
    formData.set("workerIds", JSON.stringify(selectedWorkers));

    const result = await createProject(null, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
      // Optional: Trigger global refresh or toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Only Super Admins can initialize new projects.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="e.g. Office Renovation Berlin"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contractValue">Contract Value (€)</Label>
            <Input
              id="contractValue"
              name="contractValue"
              type="number"
              step="0.01"
              required
              placeholder="15000.00"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Scope of work..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="partnerId">Assign Partner</Label>
              <Select name="partnerId">
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name || p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="brokerId">Assign Mediator</Label>
              <Select name="brokerId">
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {brokers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.full_name || b.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="subcontractorId">Assign Subcontractor</Label>
              <Select
                name="subcontractorId"
                value={selectedSubcontractor}
                onValueChange={(value) => setSelectedSubcontractor(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {subcontractors.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name || s.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contractorId">Assign Contractor</Label>
              <Select name="contractorId">
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {contractors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name || c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Workers Selection - Shows when subcontractor is selected */}
          {selectedSubcontractor && (
            <div className="grid gap-2 border rounded-lg p-3 bg-muted/20">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <Label className="font-medium">Assign Workers</Label>
                {loadingWorkers && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>

              {!loadingWorkers && workers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No workers found for this subcontractor. Add workers in the
                  Contacts section first.
                </p>
              ) : (
                <div className="grid gap-2 max-h-[150px] overflow-y-auto pr-2">
                  {workers.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleWorkerToggle(worker.id)}
                    >
                      <Checkbox
                        id={`worker-${worker.id}`}
                        checked={selectedWorkers.includes(worker.id)}
                        onCheckedChange={() => handleWorkerToggle(worker.id)}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {worker.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {worker.status || "Active"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedWorkers.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedWorkers.length} worker
                  {selectedWorkers.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end pt-4">
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
