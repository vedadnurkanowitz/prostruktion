export default function PartnerDashboard() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Partner Dashboard</h2>
      <p className="text-muted-foreground">
        Regional performance and mediator management.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium text-muted-foreground">
            My Mediators
          </div>
          <div className="text-2xl font-bold">5</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Regional Sales
          </div>
          <div className="text-2xl font-bold">$12,450.00</div>
        </div>
      </div>
    </div>
  );
}
