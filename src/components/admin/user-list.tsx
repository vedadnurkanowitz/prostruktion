import { createClient } from "@/lib/supabase/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import DeleteUserButton from "@/components/admin/delete-user-button";

export default async function UserList() {
  const supabase = await createClient();

  // Fetch profiles ordered by creation time
  // sort by created_at desc
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="text-red-500">Error loading users: {error.message}</div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Joined</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles?.map((profile: any) => (
            <TableRow key={profile.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {profile.full_name?.substring(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{profile.full_name || "Unknown"}</span>
                </div>
              </TableCell>
              <TableCell>
                <RoleBadge role={profile.role} />
              </TableCell>
              <TableCell>{profile.email}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <DeleteUserButton
                  userId={profile.id}
                  userName={profile.full_name}
                />
              </TableCell>
            </TableRow>
          ))}
          {profiles?.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-4 text-muted-foreground"
              >
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "super_admin") {
    return (
      <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
        Super Admin
      </Badge>
    );
  }
  if (role === "partner") {
    return (
      <Badge
        variant="secondary"
        className="bg-blue-100 text-blue-700 hover:bg-blue-200"
      >
        Partner
      </Badge>
    );
  }
  if (role === "broker") {
    return (
      <Badge
        variant="outline"
        className="border-orange-200 text-orange-700 bg-orange-50"
      >
        Mediator
      </Badge>
    );
  }
  return <Badge variant="outline">{role}</Badge>;
}
