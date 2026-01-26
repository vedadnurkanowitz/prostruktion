"use client";

import { useState, useEffect } from "react";
import { createProject } from "@/app/actions-project";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { PlusCircle } from "lucide-react";

export default function CreateProjectDialog() {
  const [open, setOpen] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [brokers, setBrokers] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [error, setError] = useState("");

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

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const handleSubmit = async (formData: FormData) => {
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
      <DialogContent className="sm:max-w-[425px]">
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
              <Select name="subcontractorId">
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

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end pt-4">
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
