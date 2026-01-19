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
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    const supabase = createClient();
    const { data: p } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("role", "partner");
    const { data: b } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("role", "broker");
    if (p) setPartners(p);
    if (b) setBrokers(b);
  };

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

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-end pt-4">
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
