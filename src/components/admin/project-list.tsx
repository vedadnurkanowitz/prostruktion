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

export default async function ProjectList() {
  const supabase = await createClient();

  // Fetch projects with related partner and broker names
  // Supabase join syntax: profiles!partner_id(full_name), profiles!broker_id(full_name)
  // We need to alias the foreign key relationships if they are ambiguous, but usually direct inference works
  // or we just fetch IDs and map them. Let's try explicit join syntax.

  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      `
        *,
        partner:profiles!partner_id(full_name, email),
        broker:profiles!broker_id(full_name, email)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="text-red-500">
        Error loading projects: {error.message}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned Partner</TableHead>
            <TableHead>Assigned Mediator</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects?.map((project: any) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">
                <div>{project.title}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={project.status} />
              </TableCell>
              <TableCell>
                {project.partner ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {project.partner.full_name || "Partner"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {project.partner.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">
                    Unassigned
                  </span>
                )}
              </TableCell>
              <TableCell>
                {project.broker ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {project.broker.full_name || "Mediator"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {project.broker.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground italic">
                    Unassigned
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {new Intl.NumberFormat("en-DE", {
                  style: "currency",
                  currency: "EUR",
                }).format(project.contract_value)}
              </TableCell>
            </TableRow>
          ))}
          {projects?.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-4 text-muted-foreground"
              >
                No active projects found. Create one above.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "active":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
          Active
        </Badge>
      );
    case "draft":
      return <Badge variant="secondary">Draft</Badge>;
    case "completed":
      return (
        <Badge
          variant="secondary"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          Completed
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
