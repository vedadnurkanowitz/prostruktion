export default function BrokerDashboard() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Mediator Dashboard</h2>
      <p className="text-muted-foreground">
        Manage your deals and commissions.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Active Deals
          </div>
          <div className="text-2xl font-bold">2</div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Commission Earned
          </div>
          <div className="text-2xl font-bold">$3,200.00</div>
        </div>
      </div>
    </div>
  );
}
