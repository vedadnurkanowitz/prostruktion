"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Euro,
  Receipt,
  AlertTriangle,
  FileWarning,
  ArrowUpRight,
  Download,
  ChevronRight,
  ChevronDown,
  Plus,
  Rocket,
  CheckCircle2,
} from "lucide-react";

import { useEffect } from "react";

export default function FinancialDashboardPage() {
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [readyToInvoiceProjects, setReadyToInvoiceProjects] = useState<any[]>(
    [],
  );
  const [invoicedProjects, setInvoicedProjects] = useState<any[]>([]);

  useEffect(() => {
    // Load from LocalStorage
    const storedInvoices = localStorage.getItem("prostruktion_invoices");
    if (storedInvoices) {
      try {
        const parsed = JSON.parse(storedInvoices);
        if (Array.isArray(parsed)) {
          // Append to existing mock data
          setReadyToInvoiceProjects((prev) => {
            // Filter out any that might already exist by ID if we were using real IDs,
            // but for now just appending is fine for the demo.
            // Avoid duplicates if IDs clash (mock ids are low, stored dates are high)
            const existingIds = new Set(prev.map((p) => p.id));
            const newItems = parsed.filter((p) => !existingIds.has(p.id));
            return [...prev, ...newItems];
          });
        }
      } catch (e) {
        console.error("Failed to parse stored invoices", e);
      }
    }
  }, []);

  const handleCreateInvoice = (project: any) => {
    // 1. Calculate splits
    const totalAmount = project.projectTotal || project.amount;

    // Check if mediator exists
    const hasMediator =
      project.mediator &&
      project.mediator !== "-" &&
      project.mediator.trim() !== "";

    const totalCommission = totalAmount * 0.3;

    let companyShare, partnerShare, mediatorShare;

    if (hasMediator) {
      companyShare = totalAmount * 0.1; // 10%
      partnerShare = totalAmount * 0.1; // 10%
      mediatorShare = totalAmount * 0.1; // 10%
    } else {
      companyShare = totalAmount * 0.15; // 15%
      partnerShare = totalAmount * 0.15; // 15%
      mediatorShare = 0;
    }

    // 2. Set current invoice data for modal
    setCurrentInvoice({
      ...project,
      totalCommission,
      companyShare,
      partnerShare,
      mediatorShare,
      hasMediator,
    });

    // 3. Mark locally as sent and move to Invoiced table
    setReadyToInvoiceProjects((prev) =>
      prev.filter((p) => p.id !== project.id),
    );

    // Add to Invoiced Projects
    const newInvoice = {
      status: "Unpaid",
      color: "bg-blue-300",
      date: new Date().toLocaleDateString("en-US", {
        year: "2-digit",
        month: "short",
        day: "numeric",
      }),
      inv: `INV-${1050 + Math.floor(Math.random() * 100)}`, // Generate mock invoice #
      partner: project.project, // Assuming format matches design
      amount: `€ ${project.amount.toLocaleString()}`,
      overdue: false,
    };
    setInvoicedProjects((prev) => [newInvoice, ...prev]);

    // 4. Open success modal
    setSuccessModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Financial Dashboard
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 relative">
          <div className="absolute top-4 right-4">
            <ArrowUpRight className="h-5 w-5 text-blue-600" />
          </div>
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-200">
              <Euro className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cash on Hand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              € 325,000
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              Period: 30 days <ChevronDown className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 border border-blue-200">
              <Receipt className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Awaited Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-blue-600">€ 215,000</div>
              <span className="text-xs text-muted-foreground">
                Next 30 days
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              All Partners - Mar 01 - Mai 2024
            </div>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Overdue €
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">€ 50,500</div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              Due Date: End <ChevronDown className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900 border border-orange-200">
              <FileWarning className="h-4 w-4 text-orange-600" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              8 Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xl font-bold text-blue-600">3</div>
                <div className="text-xs text-muted-foreground">Due</div>
              </div>
              <div className="h-8 w-px bg-orange-200"></div>
              <div>
                <div className="text-xl font-bold text-red-600">5</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            </div>

            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              Due Date: Paid <ChevronDown className="h-3 w-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ready to Invoice Table */}
      <Card className="bg-white dark:bg-gray-950 border-none shadow-none ring-1 ring-gray-200 dark:ring-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-purple-50/50 dark:bg-purple-900/10 rounded-t-lg">
          <CardTitle className="text-base font-semibold">
            Ready to Invoice (Not Sent)
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-blue-600 hover:text-blue-700"
          >
            View All <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
              <TableRow>
                <TableHead>Project #</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Mediator</TableHead>
                <TableHead>Employer</TableHead>
                <TableHead>Abnahme Date</TableHead>
                <TableHead className="text-right">Invoice Amount €</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readyToInvoiceProjects.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.project}</TableCell>
                  <TableCell>{row.partner}</TableCell>
                  <TableCell>{row.mediator || "-"}</TableCell>
                  <TableCell>{row.emp}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell className="text-right font-bold">
                    € {row.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {row.status === "Sent" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 bg-green-50 text-green-700 border-green-200"
                          disabled
                        >
                          Sent <CheckCircle2 className="ml-1 h-3 w-3" />
                        </Button>
                      ) : row.overdue ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200"
                          onClick={() => handleCreateInvoice(row)}
                        >
                          {row.action}{" "}
                          <span className="ml-1 font-normal text-muted-foreground text-[10px] bg-white px-1.5 rounded">
                            {row.days}
                          </span>
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="h-7 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleCreateInvoice(row)}
                        >
                          {row.action}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                      >
                        Mark as Sent
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between p-3 border-t bg-gray-50 dark:bg-gray-900/20 rounded-b-lg">
            <div className="text-xs text-muted-foreground">
              Showing 1 to 5 of 8 entries
            </div>
            <div className="font-bold text-sm">Total: € 149,500</div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                &lt;
              </Button>
              <span className="text-xs font-medium">1</span>
              <span className="text-xs text-muted-foreground">2</span>
              <span className="text-xs text-muted-foreground">3</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                &gt;
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invoiced Table */}
        <Card className="bg-white dark:bg-gray-950 border-none shadow-none ring-1 ring-gray-200 dark:ring-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-t-lg">
            <CardTitle className="text-base font-semibold">Invoiced</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-blue-600 hover:text-blue-700"
            >
              View All &gt;
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                <TableRow>
                  <TableHead>Status #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead className="text-right">Amount €</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicedProjects.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge
                        className={`${row.overdue ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : row.status === "Unpaid" && row.color === "bg-green-500" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200"} border-0 w-16 justify-center`}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{row.date}</TableCell>
                    <TableCell className="text-xs font-medium">
                      {row.inv}
                    </TableCell>
                    <TableCell className="text-xs">{row.partner}</TableCell>
                    <TableCell
                      className={`text-right font-bold text-sm ${row.overdue ? "text-red-600" : ""}`}
                    >
                      {row.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-3 border-t bg-gray-50 dark:bg-gray-900/20 rounded-b-lg">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                Showing 1 to 9 of 8 entries <ChevronDown className="h-3 w-3" />
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                  Download CSV <Download className="h-3 w-3" />
                </span>
                € 92,800
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card className="bg-white dark:bg-gray-950 border-none shadow-none ring-1 ring-gray-200 dark:ring-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-red-50/50 dark:bg-red-900/10 rounded-t-lg">
            <CardTitle className="text-base font-semibold">Expenses</CardTitle>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              <Plus className="mr-1 h-3 w-3" /> Add Expense
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Expense #</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount €</TableHead>
                  <TableHead className="text-right">Days Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    status: "Unpaid",
                    date: "May 29, 24",
                    exp: "EXP-1152",
                    cat: "Accounting",
                    amount: "€ 2,800",
                    days: "7 days",
                    overdue: false,
                  },
                  {
                    status: "Overdue",
                    date: "May 23, 24",
                    exp: "EXP-1144",
                    cat: "Travel",
                    amount: "€ 6,200",
                    days: "4 days",
                    overdue: true,
                  },
                  {
                    status: "Overdue",
                    date: "Apr 17, 24",
                    exp: "EXP-1140",
                    cat: "Salaries",
                    amount: "€ 18,100",
                    days: "8 days",
                    overdue: true,
                  },
                ].map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge
                        className={`${row.overdue ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : "bg-green-100 text-green-700 hover:bg-green-200"} border-0 w-16 justify-center`}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{row.date}</TableCell>
                    <TableCell className="text-xs font-medium">
                      {row.exp}
                    </TableCell>
                    <TableCell className="text-xs">{row.cat}</TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      {row.amount}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {row.days}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-3 border-t bg-gray-50 dark:bg-gray-900/20 rounded-b-lg">
              <div className="text-[10px] text-muted-foreground">
                Total: 5 <span className="mx-1">|</span> Pending: 3{" "}
                <span className="mx-1">|</span> Due Soon: 1{" "}
                <span className="font-bold text-foreground">€ 28,750</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-xs text-muted-foreground font-normal">
                  Total:
                </span>
                <Badge
                  variant="secondary"
                  className="bg-gray-200 hover:bg-gray-200 text-gray-700"
                >
                  Dats € 28,750
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" /> Invoice Created & Email Sent
            </DialogTitle>
            <DialogDescription>
              The invoice has been created and sent to the partner.
            </DialogDescription>
          </DialogHeader>

          {currentInvoice && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
                <div className="flex justify-between font-medium">
                  <span>Project</span>
                  <span>{currentInvoice.project}</span>
                </div>
                <div className="flex justify-between">
                  <span>Wait List Total</span>
                  <span>€ {currentInvoice.amount.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-blue-600 pb-2">
                    <span>Total 30% Commission</span>
                    <span>
                      € {currentInvoice.totalCommission.toLocaleString()}
                    </span>
                  </div>
                  <div className="pl-4 space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>
                        Your Company (
                        {currentInvoice.hasMediator ? "10%" : "15%"})
                      </span>
                      <span>
                        € {currentInvoice.companyShare.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Partner ({currentInvoice.hasMediator ? "10%" : "15%"})
                      </span>
                      <span>
                        € {currentInvoice.partnerShare.toLocaleString()}
                      </span>
                    </div>
                    {currentInvoice.hasMediator && (
                      <div className="flex justify-between">
                        <span>Mediator (10%)</span>
                        <span>
                          € {currentInvoice.mediatorShare.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded text-blue-700">
                <Rocket className="h-3 w-3" />
                <span>Email sent successfully to {currentInvoice.partner}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSuccessModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
