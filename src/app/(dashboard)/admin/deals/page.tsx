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
  ArrowDown,
  AlertCircle,
} from "lucide-react";

import { useEffect } from "react";

export default function FinancialDashboardPage() {
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);

  // Staging: Individual Projects from Project Management
  const [forInvoiceProjects, setForInvoiceProjects] = useState<any[]>([]);

  // Ready: Batched by Partner
  const [readyToInvoiceProjects, setReadyToInvoiceProjects] = useState<any[]>(
    [],
  );

  const [invoicedProjects, setInvoicedProjects] = useState<any[]>([]);
  const [receivedProjects, setReceivedProjects] = useState<any[]>([]);

  useEffect(() => {
    // Load from LocalStorage
    const storedInvoices = localStorage.getItem("prostruktion_invoices");
    if (storedInvoices) {
      try {
        const parsed = JSON.parse(storedInvoices);
        if (Array.isArray(parsed)) {
          // 1. Separate "For Invoice" items
          const forInvoice = parsed.filter((p) => p.status === "For Invoice");
          setForInvoiceProjects(forInvoice);

          // 2. Separate "Ready" items (waiting for batch invoice)
          const ready = parsed.filter((p) => p.status === "Ready");
          setReadyToInvoiceProjects(ready);
        }
      } catch (e) {
        console.error("Failed to parse stored invoices", e);
      }
    }

    // Load Generated Invoices
    const storedGenerated = localStorage.getItem(
      "prostruktion_generated_invoices",
    );
    if (storedGenerated) {
      try {
        const parsedInv = JSON.parse(storedGenerated);
        if (Array.isArray(parsedInv)) {
          setInvoicedProjects(
            parsedInv.filter((i: any) => i.status === "Unpaid"),
          );
          setReceivedProjects(
            parsedInv.filter((i: any) => i.status === "Received"),
          );
        }
      } catch (e) {
        console.error("Failed to parse generated invoices", e);
      }
    }
  }, []);

  const handleMoveToReady = (project: any) => {
    // Update local state
    setForInvoiceProjects((prev) => prev.filter((p) => p.id !== project.id));

    const updatedProject = { ...project, status: "Ready" };
    setReadyToInvoiceProjects((prev) => [...prev, updatedProject]);

    // Update LocalStorage
    const storedInvoices = JSON.parse(
      localStorage.getItem("prostruktion_invoices") || "[]",
    );
    const updatedStorage = storedInvoices.map((p: any) =>
      p.id === project.id ? { ...p, status: "Ready" } : p,
    );
    localStorage.setItem(
      "prostruktion_invoices",
      JSON.stringify(updatedStorage),
    );
  };

  const handleBatchInvoice = (partnerName: string) => {
    // Find all projects for this partner in Ready state
    const batchProjects = readyToInvoiceProjects.filter(
      (p) => p.partner === partnerName,
    );
    if (batchProjects.length === 0) return;

    // Calculate totals for the batch
    const totalAmount = batchProjects.reduce(
      (sum, p) => sum + (p.amount || 0),
      0,
    );
    // Note: p.amount in storage IS the share (company share), as per admin/projects logic.
    // If we want total project value we should have stored it.
    // Looking at admin/projects, 'amount' saved to 'prostruktion_invoices' IS the Calculated Company Share.
    // So summing them is correct for the Invoice Amount.

    const totalCommission = (totalAmount / 0.1) * 0.3; // Reverse calc for demo or just use sum.
    // Actually, let's just sum the stored values for simplicity in this demo.

    // Create Invoice Data for Modal (Aggregated)
    const invoiceData = {
      project: `Batch Invoice: ${batchProjects.length} Projects`,
      partner: partnerName,
      amount: totalAmount,
      totalCommission: batchProjects.reduce(
        (sum, p) => sum + p.projectTotal * 0.3,
        0,
      ), // Assuming projectTotal exists
      companyShare: totalAmount,
      partnerShare: batchProjects.reduce(
        (sum, p) => sum + p.projectTotal * 0.15,
        0,
      ), // Approx
      hasMediator: false,
      mediatorShare: 0,
    };
    setCurrentInvoice(invoiceData);

    // Update Local States
    setReadyToInvoiceProjects((prev) =>
      prev.filter((p) => p.partner !== partnerName),
    );

    // Create Single Invoice Entry
    const newInvoice = {
      status: "Unpaid",
      color: "bg-blue-300",
      date: new Date().toLocaleDateString("en-US", {
        year: "2-digit",
        month: "short",
        day: "numeric",
      }),
      inv: `INV-${1050 + Math.floor(Math.random() * 100)}`,
      partner: partnerName,
      amount: `€ ${totalAmount.toLocaleString()}`,
      overdue: false,
    };
    // Update LocalStorage (Mark all as Sent)
    const storedInvoices = JSON.parse(
      localStorage.getItem("prostruktion_invoices") || "[]",
    );
    const updatedStorage = storedInvoices.map((p: any) =>
      p.partner === partnerName && p.status === "Ready"
        ? { ...p, status: "Sent" }
        : p,
    );
    localStorage.setItem(
      "prostruktion_invoices",
      JSON.stringify(updatedStorage),
    );

    // Save New Invoice to Storage
    const storedGenerated = JSON.parse(
      localStorage.getItem("prostruktion_generated_invoices") || "[]",
    );
    const invoiceWithId = { ...newInvoice, id: Date.now() };
    // Update state with ID
    setInvoicedProjects((prev) => [{ ...invoiceWithId }, ...prev]);

    localStorage.setItem(
      "prostruktion_generated_invoices",
      JSON.stringify([invoiceWithId, ...storedGenerated]),
    );

    setSuccessModalOpen(true);
  };

  // Helper to Group Ready Projects by Partner
  const getGroupedReadyProjects = () => {
    const groups: {
      [key: string]: {
        partner: string;
        count: number;
        total: number;
        projects: any[];
      };
    } = {};

    readyToInvoiceProjects.forEach((p) => {
      if (!groups[p.partner]) {
        groups[p.partner] = {
          partner: p.partner,
          count: 0,
          total: 0,
          projects: [],
        };
      }
      groups[p.partner].count += 1;
      groups[p.partner].total += p.amount || 0;
      groups[p.partner].projects.push(p);
    });

    return Object.values(groups);
  };

  const calculateDaysPending = (dateString: string) => {
    const createdDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleMarkAsReceived = (invoice: any) => {
    const updatedInvoice = {
      ...invoice,
      status: "Received",
      color: "bg-green-500", // Green for received/paid
    };

    // Update State
    setInvoicedProjects((prev) => prev.filter((i) => i.id !== invoice.id));
    setReceivedProjects((prev) => [updatedInvoice, ...prev]);

    // Update LocalStorage
    const storedGenerated = JSON.parse(
      localStorage.getItem("prostruktion_generated_invoices") || "[]",
    );
    const updatedStorage = storedGenerated.map((i: any) =>
      i.id === invoice.id ? updatedInvoice : i,
    );
    localStorage.setItem(
      "prostruktion_generated_invoices",
      JSON.stringify(updatedStorage),
    );
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

      {/* For Invoice Table (Input) */}
      <Card className="bg-white dark:bg-gray-950 border-none shadow-none ring-1 ring-gray-200 dark:ring-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-t-lg">
          <CardTitle className="text-base font-semibold">For Invoice</CardTitle>
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
                <TableHead>Project</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead className="text-right">Amount €</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forInvoiceProjects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground py-8"
                  >
                    No projects waiting for invoice.
                  </TableCell>
                </TableRow>
              ) : (
                forInvoiceProjects.map((row) => {
                  const daysPending = calculateDaysPending(row.date);
                  const isOverdueForBatch = daysPending >= 14;

                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.project}
                      </TableCell>
                      <TableCell>{row.partner}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>
                        <div
                          className={`flex items-center gap-2 text-xs font-medium ${isOverdueForBatch ? "text-green-600" : "text-muted-foreground"}`}
                        >
                          {daysPending} Days
                          {isOverdueForBatch && (
                            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px]">
                              <AlertCircle className="h-3 w-3" /> Batch Ready
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        € {row.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className={`h-7 text-white ${isOverdueForBatch ? "bg-green-600 hover:bg-green-700 animate-pulse" : "bg-blue-600 hover:bg-blue-700"}`}
                          onClick={() => handleMoveToReady(row)}
                        >
                          {isOverdueForBatch
                            ? "Move to Ready!"
                            : "Move to Ready"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ready to Invoice Table (Batched) */}
      <Card className="bg-white dark:bg-gray-950 border-none shadow-none ring-1 ring-gray-200 dark:ring-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-purple-50/50 dark:bg-purple-900/10 rounded-t-lg">
          <CardTitle className="text-base font-semibold">
            Ready to Invoice (Batched by Partner)
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
                <TableHead>Partner</TableHead>
                <TableHead>Projects Count</TableHead>
                <TableHead className="text-right">Total Amount €</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getGroupedReadyProjects().length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground py-8"
                  >
                    No projects ready for batch invoicing.
                  </TableCell>
                </TableRow>
              ) : (
                getGroupedReadyProjects().map((group, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {group.partner}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{group.count} Projects</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      € {group.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="h-7 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleBatchInvoice(group.partner)}
                      >
                        Invoice Batch
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoiced Table (New Section) */}
      <Card className="bg-white dark:bg-gray-950 border-none shadow-none ring-1 ring-gray-200 dark:ring-gray-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-t-lg">
          <CardTitle className="text-base font-semibold">Invoiced</CardTitle>
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
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Partner</TableHead>
                <TableHead className="text-right">Amount €</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicedProjects.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    No invoiced projects pending receipt.
                  </TableCell>
                </TableRow>
              ) : (
                invoicedProjects.map((row, i) => (
                  <TableRow key={row.id || i}>
                    <TableCell>
                      <Badge
                        className={`${row.overdue ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200"} border-0 w-16 justify-center`}
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
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="h-7 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleMarkAsReceived(row)}
                      >
                        <ArrowDown className="h-3 w-3 mr-1" /> Receive
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Received Table (was Invoiced) */}
        <Card className="bg-white dark:bg-gray-950 border-none shadow-none ring-1 ring-gray-200 dark:ring-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-green-50/50 dark:bg-green-900/10 rounded-t-lg">
            <CardTitle className="text-base font-semibold">Received</CardTitle>
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
                {receivedProjects.map((row, i) => (
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
              <CheckCircle2 className="h-5 w-5" /> Batch Invoice Created & Sent
            </DialogTitle>
            <DialogDescription>
              A single invoice for the partner's batch has been created and
              sent.
            </DialogDescription>
          </DialogHeader>

          {currentInvoice && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
                <div className="flex justify-between font-medium">
                  <span>Batch</span>
                  <span>{currentInvoice.project}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Batch Value</span>
                  <span>€ {currentInvoice.amount.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  {/* Simplified view for Batch */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    Includes {currentInvoice.amount / 1000} projects (est)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded text-blue-700">
                <Rocket className="h-3 w-3" />
                <span>
                  Invoice sent successfully to {currentInvoice.partner}
                </span>
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
