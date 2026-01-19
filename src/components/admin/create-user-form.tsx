"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { createUser } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle2 } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Creating..." : "Create User"}
    </Button>
  );
}

export default function CreateUserForm() {
  const [state, setState] = useState<any>(null);

  async function clientAction(formData: FormData) {
    const result = await createUser(null, formData);
    setState(result);
  }

  return (
    <form action={clientAction} className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" name="fullName" type="text" required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <Select name="role" required defaultValue="broker">
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="broker">Mediator</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          <span>{state.error}</span>
        </div>
      )}
      {state?.success && (
        <div className="flex items-center gap-2 text-sm text-green-500 bg-green-50 p-2 rounded">
          <CheckCircle2 className="h-4 w-4" />
          <span>{state.success}</span>
        </div>
      )}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
