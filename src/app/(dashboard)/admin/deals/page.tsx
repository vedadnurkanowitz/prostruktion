"use client";

import React from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Building2,
  ChevronsUpDown,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

const parseGermanFloat = (str: string | number | undefined | null) => {
  if (typeof str === "number") return str;
  if (!str) return 0;

  const val = str.toString();

  // 1. Remove all non-numeric characters except '.' and ',' and '-'
  // This removes € symbols, spaces, etc.
  const clean = val.replace(/[^0-9.,-]/g, "");

  // 2. Remove dots (thousands separators)
  const noDots = clean.replace(/\./g, "");

  // 3. Replace comma with dot (decimal separator)
  const withDecimal = noDots.replace(",", ".");

  return parseFloat(withDecimal) || 0;
};

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
  const [expenses, setExpenses] = useState<any[]>([]);
  const [cashOnHand, setCashOnHand] = useState(0);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(
    null,
  );
  const [sideProjectModalOpen, setSideProjectModalOpen] = useState(false);
  const [sideProjectForm, setSideProjectForm] = useState({
    projectName: "",
    partnerName: "",
    amount: "",
    address: "",
  });
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [newExpenseForm, setNewExpenseForm] = useState({
    name: "",
    date: "",
    amount: "",
    status: "Unpaid",
    type: "Fixed",
  });
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterType, setFilterType] = useState("All");

  const supabase = createClient();

  useEffect(() => {
    const loadData = async () => {
      // 1. Fetch ALL Invoices from Supabase
      // This includes:
      // - Pending Itemized Invoices (status: "For Invoice", "Ready") -> linked to Projects
      // - Generated Batch Invoices (status: "Sent", "Unpaid", "Received") -> type: "Batch"
      // - Side Projects (status: "Unpaid", "Received") -> type: "Side Project"

      const { data: dbInvoices, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch invoices:", error);
      }

      let allInvoices: any[] = [];
      if (dbInvoices) {
        allInvoices = dbInvoices.map((inv) => ({
          id: inv.id,
          // Support both older individual items and new batch/side structures
          projectId: inv.project_id,
          project: inv.project_name || inv.description || "Utility/Other", // Fallback
          partner: inv.partner_name || inv.recipient_name || "Unknown",
          role: inv.recipient_role,
          amount: parseGermanFloat(inv.amount),
          date: inv.date
            ? new Date(inv.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "",
          status: inv.status,
          action: inv.invoice_type, // "Invoice", "Partner Invoice", "Batch", "Side Project"
          type: inv.invoice_type,
          items: inv.items, // JSONB items for Batch/Side
          isSideProject: inv.is_side_project,
          invoiceNumber: inv.invoice_number,
          rawAmount: inv.amount, // Keep original string/number for UI display if needed, or format later
        }));
      }

      // 2. Separate "For Invoice" (Pending Individual Items)
      const forInvoice = allInvoices.filter(
        (p) =>
          p.status === "For Invoice" &&
          p.type !== "Batch" &&
          p.type !== "Side Project",
      );
      setForInvoiceProjects(forInvoice);

      // 3. Separate "Ready" (Batched / Waiting for Approval)
      const ready = allInvoices.filter(
        (p) =>
          p.status === "Ready" &&
          p.type !== "Batch" &&
          p.type !== "Side Project",
      );
      setReadyToInvoiceProjects(ready);

      // 4. "Invoiced" (Sent/Unpaid Batch or Side Projects)
      // These are the "Generated Invoices"
      const sentOrUnpaid = allInvoices.filter(
        (p) =>
          (p.type === "Batch" ||
            p.type === "Side Project" ||
            p.status === "Sent" ||
            p.status === "Unpaid") &&
          p.status !== "Received" &&
          p.status !== "For Invoice" &&
          p.status !== "Ready",
      );
      setInvoicedProjects(sentOrUnpaid);

      // 5. "Received" (Paid Batch or Side Projects)
      const received = allInvoices.filter((p) => p.status === "Received");
      setReceivedProjects(received);

      // Calculate Total Received
      // Use parsed numeric amount
      const totalRec = received.reduce(
        (acc, curr) => acc + (curr.amount || 0),
        0,
      );

      // 6. Fetch Expenses from Supabase
      const { data: dbExpenses, error: expError } = await supabase
        .from("expenses")
        .select("*")
        .order("created_at", { ascending: false });

      let parsedExpenses: any[] = [];
      let totalExp = 0;

      if (dbExpenses) {
        parsedExpenses = dbExpenses.map((e) => {
          const val = parseGermanFloat(e.amount);

          return {
            ...e,
            date: e.date
              ? new Date(e.date).toLocaleDateString("en-US", {
                  year: "2-digit",
                  month: "short",
                  day: "numeric",
                })
              : "",
            numericAmount: val,
          };
        });
        totalExp = parsedExpenses.reduce(
          (acc, curr) => acc + curr.numericAmount,
          0,
        );
      }

      if (expError) console.error("Failed to fetch expenses:", expError);

      setExpenses(parsedExpenses);
      setCashOnHand(totalRec - totalExp);
    };

    loadData();
  }, []);

  const handleMoveToReady = (project: any) => {
    // Update local state
    setForInvoiceProjects((prev) => prev.filter((p) => p.id !== project.id));

    const updatedProject = { ...project, status: "Ready" };
    setReadyToInvoiceProjects((prev) => [...prev, updatedProject]);

    // Update Supabase (Move ALL related invoices for this project)
    const updateSupabase = async () => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "Ready" })
        .eq("project_id", project.projectId);

      if (error) {
        console.error("Failed to update status in Supabase", error);
        // Revert local state if needed? For now just log.
      }
    };
    updateSupabase();
  };

  const handleRevertToPending = (partnerName: string) => {
    // find projects to revert
    const projectsToRevert = readyToInvoiceProjects.filter(
      (p) => p.partner === partnerName,
    );

    // Update local state
    setForInvoiceProjects((prev) => [...prev, ...projectsToRevert]);
    setReadyToInvoiceProjects((prev) =>
      prev.filter((p) => p.partner !== partnerName),
    );

    // Update Supabase (Move ALL related invoices for this partner back to For Invoice)
    // AND match status=Ready
    const updateSupabase = async () => {
      // NOTE: We need to filter by Partner Name if we want to revert ALL "Ready" for that partner.
      // But we can't easily join on 'recipient_name' for Subcontractors unless we know the wrapper.
      // However, we can iterate 'projectsToRevert' and update by Project ID.
      // Since projectsToRevert contains the Main Invoices, their IDs will cover the project scope.

      const projectIds = projectsToRevert.map((p) => p.projectId);
      if (projectIds.length > 0) {
        const { error } = await supabase
          .from("invoices")
          .update({ status: "For Invoice" })
          .in("project_id", projectIds);

        if (error) console.error("Failed to revert status in Supabase", error);
      }
    };
    updateSupabase();
  };

  const handleBatchInvoice = async (partnerName: string) => {
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

    const newInvoiceInv = `INV-${1050 + Math.floor(Math.random() * 1000)}`;

    // 1. Create the Batch Invoice in Supabase
    const { data: insertedBatch, error: insertError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: newInvoiceInv,
        partner_name: partnerName,
        recipient_name: partnerName, // duplicate for redundancy
        amount: totalAmount,
        status: "Unpaid",
        date: new Date().toISOString(),
        invoice_type: "Batch",
        items: batchProjects, // Store the details
        project_name: `Batch Invoice: ${batchProjects.length} Projects`,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create batch invoice in Supabase", insertError);
      return;
    }

    // 2. Update status of individual items to "Sent" (so they leave the Ready list)
    const projectIds = batchProjects.map((p) => p.projectId);
    if (projectIds.length > 0) {
      const { error: updateError } = await supabase
        .from("invoices")
        .update({ status: "Sent" })
        .in("project_id", projectIds)
        .eq("invoice_type", "Invoice"); // Safety check

      if (updateError)
        console.error("Failed to update status in Supabase", updateError);
    }

    // 3. Update Local State
    setReadyToInvoiceProjects((prev) =>
      prev.filter((p) => p.partner !== partnerName),
    );

    // Add new batch invoice to the lists
    // We map it to the UI shape
    const newUiInvoice = {
      id: insertedBatch.id,
      projectId: null,
      project: insertedBatch.project_name,
      partner: insertedBatch.partner_name,
      role: null,
      amount: insertedBatch.amount,
      date: new Date(insertedBatch.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      status: "Unpaid",
      action: "Batch",
      type: "Batch",
      items: batchProjects,
      invoiceNumber: insertedBatch.invoice_number,
    };

    setInvoicedProjects((prev) => [newUiInvoice, ...prev]);

    // Set Current Invoice for Modal
    setCurrentInvoice({
      project: `Batch Invoice: ${batchProjects.length} Projects`,
      partner: partnerName,
      amount: totalAmount,
      invoiceNumber: newInvoiceInv,
      items: batchProjects,
    });
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

  const handleAddSideProject = async () => {
    if (!sideProjectForm.projectName || !sideProjectForm.amount) return;

    const amountVal = parseFloat(sideProjectForm.amount);
    const newInvoiceInv = `SIDE-${1000 + Math.floor(Math.random() * 1000)}`;

    // 1. Create Side Project Invoice in Supabase
    const { data: insertedSide, error } = await supabase
      .from("invoices")
      .insert({
        invoice_number: newInvoiceInv,
        partner_name: sideProjectForm.partnerName || "Side Project",
        recipient_name: sideProjectForm.partnerName,
        project_name: sideProjectForm.projectName,
        amount: amountVal,
        status: "Unpaid",
        date: new Date().toISOString(),
        invoice_type: "Side Project",
        is_side_project: true,
        description: sideProjectForm.address,
        items: [
          {
            project: sideProjectForm.projectName,
            address: sideProjectForm.address || "External Project",
            partner: sideProjectForm.partnerName || "External",
            amount: amountVal,
            hasMediator: false,
          },
        ],
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create side project in Supabase", error);
      return;
    }

    const newUiInvoice = {
      id: insertedSide.id,
      projectId: null,
      project: insertedSide.project_name,
      partner: insertedSide.partner_name,
      amount: insertedSide.amount,
      date: new Date(insertedSide.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      status: "Unpaid",
      action: "Side Project",
      type: "Side Project",
      items: insertedSide.items,
      isSideProject: true,
      invoiceNumber: insertedSide.invoice_number,
    };

    setInvoicedProjects((prev) => [newUiInvoice, ...prev]);

    // Reset form and close modal
    setSideProjectForm({
      projectName: "",
      partnerName: "",
      amount: "",
      address: "",
    });
    setSideProjectModalOpen(false);
  };

  const handleMarkAsReceived = async (invoice: any) => {
    const updatedInvoice = {
      ...invoice,
      status: "Received",
      color: "bg-green-500", // Green for received/paid
    };

    // Update Supabase
    const { error } = await supabase
      .from("invoices")
      .update({ status: "Received" })
      .eq("id", invoice.id);

    if (error) {
      console.error("Failed to update status in Supabase", error);
    }

    // Update State
    setInvoicedProjects((prev) => prev.filter((i) => i.id !== invoice.id));
    setReceivedProjects((prev) => [updatedInvoice, ...prev]);

    // Update Cash Balance Locally for instant feedback
    const amountVal = parseFloat(
      invoice.amount?.toString().replace(/[^0-9.-]+/g, "") || "0",
    );
    setCashOnHand((prev) => prev + amountVal);
  };

  const handleUpdateExpense = async (
    index: number,
    field: string,
    value: string,
  ) => {
    const expense = expenses[index];
    if (!expense) return;

    // Update Supabase
    const { error } = await supabase
      .from("expenses")
      .update({ [field]: value })
      .eq("id", expense.id);

    if (error) {
      console.error("Failed to update expense", error);
    }

    const newExpenses = [...expenses];
    newExpenses[index] = { ...newExpenses[index], [field]: value };
    setExpenses(newExpenses);
  };

  const handleAddExpense = async () => {
    if (!newExpenseForm.amount || !newExpenseForm.date || !newExpenseForm.name)
      return;

    const amountVal = parseFloat(newExpenseForm.amount);

    // Insert into Supabase
    const { data: insertedExpense, error } = await supabase
      .from("expenses")
      .insert({
        name: newExpenseForm.name,
        status: newExpenseForm.status,
        date: newExpenseForm.date, // ISO string or date
        type: newExpenseForm.type,
        amount: amountVal,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to add expense", error);
      return;
    }

    const newExpense = {
      ...insertedExpense,
      numericAmount: amountVal,
      // ensure display format matches UI expectation if needed, or rely on raw amount
      // The UI uses 'amount' which we fetched as raw number/string in loadData
      // Let's ensure consistency
      amount: `€ ${amountVal.toLocaleString()}`,
    };

    setExpenses((prev) => [newExpense, ...prev]);
    // update cash on hand
    setCashOnHand((prev) => prev - amountVal);

    setNewExpenseForm({
      name: "",
      date: "",
      amount: "",
      status: "Unpaid",
      type: "Fixed",
    });
    setAddExpenseOpen(false);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const statusMatch =
      filterStatus === "All" || expense.status === filterStatus;
    const typeMatch =
      filterType === "All" || (expense.type || "Fixed") === filterType;
    return statusMatch && typeMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Financial Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          onClick={() => setSideProjectModalOpen(true)}
        >
          <Plus className="mr-1 h-4 w-4" /> Side Project
        </Button>
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
            <div
              className={`text-2xl font-bold ${cashOnHand < 0 ? "text-red-600" : "text-gray-900 dark:text-gray-50"}`}
            >
              € {cashOnHand.toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              Real-time <ChevronDown className="h-3 w-3" />
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
              <div className="text-2xl font-bold text-blue-600">
                €{" "}
                {Math.round(
                  [
                    ...forInvoiceProjects,
                    ...readyToInvoiceProjects,
                    ...invoicedProjects,
                  ].reduce(
                    (acc, curr) =>
                      acc +
                      (parseFloat(
                        curr.amount?.toString().replace(/[^0-9.-]+/g, ""),
                      ) || 0),
                    0,
                  ),
                ).toLocaleString()}
              </div>
              <span className="text-xs text-muted-foreground">
                Next 30 days
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Sum of Pending & Invoiced
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
            <div className="text-2xl font-bold text-red-600">
              €{" "}
              {invoicedProjects
                .reduce((acc, curr) => {
                  const days = calculateDaysPending(curr.date);
                  if (days > 7 && curr.status !== "Received") {
                    return (
                      acc +
                      (parseFloat(
                        curr.amount?.toString().replace(/[^0-9.-]+/g, ""),
                      ) || 0)
                    );
                  }
                  return acc;
                }, 0)
                .toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              {">"} 7 Days Pending <ChevronDown className="h-3 w-3" />
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
              Invoices Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {
                    forInvoiceProjects.filter(
                      (p) => calculateDaysPending(p.date) > 14,
                    ).length
                  }
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Pending {">"} 14 Days
                </div>
              </div>
              <div className="h-8 w-px bg-orange-200/60 dark:bg-orange-800/30"></div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {
                    invoicedProjects.filter((i) => i.status !== "Received")
                      .length
                  }
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Sent / Unpaid
                </div>
              </div>
            </div>

            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
              Active Pipeline:{" "}
              {forInvoiceProjects.length +
                invoicedProjects.filter((i) => i.status !== "Received")
                  .length}{" "}
              files
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
            className="h-8 text-yellow-600 hover:text-yellow-700"
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
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium">{row.project}</div>
                            <div className="text-xs text-muted-foreground">
                              {row.address || "No address provided"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{row.partner}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>
                        <div
                          className={`flex items-center gap-2 text-xs font-medium text-muted-foreground`}
                        >
                          {daysPending} Days
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        € {row.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="h-7 text-primary-foreground bg-primary hover:bg-primary/90"
                          onClick={() => handleMoveToReady(row)}
                        >
                          Move to Ready
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
            className="h-8 text-yellow-600 hover:text-yellow-700"
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
                        variant="outline"
                        className="h-7 mr-2 text-xs border-dashed text-gray-500 hover:text-gray-900"
                        onClick={() => handleRevertToPending(group.partner)}
                      >
                        Undo
                      </Button>
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
            className="h-8 text-yellow-600 hover:text-yellow-700"
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
                  <React.Fragment key={row.id || `inv-${i}`}>
                    <TableRow
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50"
                      onClick={() =>
                        setExpandedInvoiceId(
                          expandedInvoiceId === row.id ? null : row.id,
                        )
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="h-9 w-9 rounded bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {row.items?.[0]?.project ||
                                `Batch: ${row.partner}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {row.items?.[0]?.address || "Multiple projects"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{row.date}</TableCell>
                      <TableCell className="text-xs font-medium">
                        {row.inv}
                      </TableCell>
                      <TableCell className="text-xs">
                        {row.partner}
                        {row.items && row.items.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({row.items.length})
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold text-sm ${row.overdue ? "text-red-600" : ""}`}
                      >
                        {row.amount?.toLocaleString("de-DE", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="h-7 bg-green-600 hover:bg-green-700 text-white"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsReceived(row);
                          }}
                        >
                          <ArrowDown className="h-3 w-3 mr-1" /> Receive
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expandedInvoiceId === row.id && (
                      <TableRow className="bg-gray-50/50 dark:bg-gray-900/30">
                        <TableCell colSpan={6} className="p-4">
                          <div className="space-y-3 pl-8">
                            <div className="rounded-md border overflow-hidden">
                              <Table>
                                <TableHeader className="bg-yellow-50/50 dark:bg-yellow-900/10">
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[30%]">
                                      Project
                                    </TableHead>
                                    <TableHead>Contractor</TableHead>
                                    <TableHead>Partner</TableHead>
                                    <TableHead className="text-right">
                                      Financial Debt
                                    </TableHead>
                                    <TableHead className="text-right">
                                      Share
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {row.items && row.items.length > 0 ? (
                                    row.items.map((item: any, idx: number) => (
                                      <TableRow
                                        key={idx}
                                        className="hover:bg-muted/50"
                                      >
                                        <TableCell>
                                          <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                              <Building2 className="h-5 w-5" />
                                            </div>
                                            <div>
                                              <div className="font-medium text-sm">
                                                {item.project}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {item.address ||
                                                  "Unknown Address"}
                                              </div>
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell>{item.partner}</TableCell>
                                        <TableCell>Prostruktion</TableCell>
                                        <TableCell className="text-right font-bold">
                                          € {item.amount?.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Badge
                                            variant="outline"
                                            className="bg-blue-50 text-blue-700 border-blue-200"
                                          >
                                            {item.hasMediator ? "10%" : "15%"}
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell
                                        colSpan={5}
                                        className="text-center text-muted-foreground py-4 text-xs italic"
                                      >
                                        No detailed project data available for
                                        this invoice.
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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
              className="h-8 text-yellow-600 hover:text-yellow-700"
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
                      {row.amount?.toLocaleString("de-DE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-3 border-t bg-gray-50 dark:bg-gray-900/20 rounded-b-lg">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {receivedProjects.length} Entries
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                  Total Received:
                </span>
                <span className="text-green-600">
                  €{" "}
                  {receivedProjects
                    .reduce(
                      (acc, curr) => acc + (parseGermanFloat(curr.amount) || 0),
                      0,
                    )
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card className="bg-white dark:bg-gray-950 border-none shadow-none ring-1 ring-gray-200 dark:ring-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-red-50/50 dark:bg-red-900/10 rounded-t-lg">
            <div className="flex items-center gap-4">
              <CardTitle className="text-base font-semibold">
                Expenses
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[100px] h-7 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[100px] h-7 text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    <SelectItem value="Fixed">Fixed</SelectItem>
                    <SelectItem value="Variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setAddExpenseOpen(true)}
            >
              <Plus className="mr-1 h-3 w-3" /> Add Expense
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>F&V</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount €</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((row: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">
                      {row.name || "Expense"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.type || "Fixed"}
                        onValueChange={(val) =>
                          handleUpdateExpense(i, "type", val)
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fixed">Fixed</SelectItem>
                          <SelectItem value="Variable">Variable</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs">{row.date}</TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      {row.amount}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={row.status}
                        onValueChange={(val) =>
                          handleUpdateExpense(i, "status", val)
                        }
                      >
                        <SelectTrigger
                          className={`w-[110px] h-8 text-xs font-medium border-0 ring-1 ring-inset ring-gray-200 ${
                            row.status === "Paid"
                              ? "bg-green-50 text-green-700 ring-green-200"
                              : "bg-orange-50 text-orange-700 ring-orange-200"
                          }`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Unpaid">Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between p-3 border-t bg-gray-50 dark:bg-gray-900/20 rounded-b-lg">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {filteredExpenses.length} Entries
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <span className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                  Total Expenses:
                </span>
                <span className="text-red-600">
                  €{" "}
                  {filteredExpenses
                    .reduce(
                      (acc, curr) => acc + (parseGermanFloat(curr.amount) || 0),
                      0,
                    )
                    .toLocaleString()}
                </span>
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
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    Included Projects:
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {currentInvoice.items && currentInvoice.items.length > 0 ? (
                      currentInvoice.items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-black/20 p-2 rounded border text-xs space-y-1"
                        >
                          <div className="flex justify-between font-medium">
                            <span>{item.project}</span>
                            <span>€ {item.amount?.toLocaleString()}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {item.partner} (Contractor)
                          </div>
                          <div className="text-muted-foreground italic">
                            {item.address || "Unknown Address"}
                          </div>
                          <div className="flex justify-end mt-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-200"
                            >
                              Share: {item.hasMediator ? "10%" : "15%"}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground">
                        List of projects unavailable.
                      </div>
                    )}
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

      {/* Side Project Modal */}
      <Dialog
        open={sideProjectModalOpen}
        onOpenChange={setSideProjectModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" /> Add Side Project
              Invoice
            </DialogTitle>
            <DialogDescription>
              Create an invoice for a project not tracked in the main app.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Name *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Website for Client X"
                value={sideProjectForm.projectName}
                onChange={(e) =>
                  setSideProjectForm({
                    ...sideProjectForm,
                    projectName: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Partner / Client Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., John Doe"
                value={sideProjectForm.partnerName}
                onChange={(e) =>
                  setSideProjectForm({
                    ...sideProjectForm,
                    partnerName: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address / Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 123 Main Street"
                value={sideProjectForm.address}
                onChange={(e) =>
                  setSideProjectForm({
                    ...sideProjectForm,
                    address: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (€) *</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5000"
                value={sideProjectForm.amount}
                onChange={(e) =>
                  setSideProjectForm({
                    ...sideProjectForm,
                    amount: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSideProjectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSideProject}
              disabled={!sideProjectForm.projectName || !sideProjectForm.amount}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Expense Modal */}
      <Dialog open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
            <DialogDescription>
              Enter details for the new expense record.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Office Rent"
                value={newExpenseForm.name}
                onChange={(e) =>
                  setNewExpenseForm({
                    ...newExpenseForm,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={newExpenseForm.date}
                onChange={(e) =>
                  setNewExpenseForm({
                    ...newExpenseForm,
                    date: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (€)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 500"
                value={newExpenseForm.amount}
                onChange={(e) =>
                  setNewExpenseForm({
                    ...newExpenseForm,
                    amount: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={newExpenseForm.status}
                  onValueChange={(val) =>
                    setNewExpenseForm({ ...newExpenseForm, status: val })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={newExpenseForm.type}
                  onValueChange={(val) =>
                    setNewExpenseForm({ ...newExpenseForm, type: val })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fixed">Fixed</SelectItem>
                    <SelectItem value="Variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddExpenseOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddExpense}
              disabled={
                !newExpenseForm.amount ||
                !newExpenseForm.date ||
                !newExpenseForm.name
              }
            >
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
