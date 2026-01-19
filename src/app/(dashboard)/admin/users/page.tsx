import CreateUserForm from "@/components/admin/create-user-form";
import UserList from "@/components/admin/user-list";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Partners & Mediators
          </h2>
          <p className="text-muted-foreground">
            Manage system users and access.
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6 border-b">
          <h3 className="font-semibold text-lg">Add New User</h3>
          <p className="text-sm text-muted-foreground">
            Create a new account for a Partner or Mediator.
          </p>
          <CreateUserForm />
        </div>
        <div className="p-6">
          <h3 className="font-semibold text-lg mb-4">Existing Users</h3>
          <UserList />
        </div>
      </div>
    </div>
  );
}
