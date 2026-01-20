"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  FileText,
  Archive,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Building2,
  ArrowUpRight,
  Rocket,
  Calculator,
} from "lucide-react";
import { PRICING_MATRIX, ADDITIONAL_SERVICES } from "@/lib/pricing-data";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";

export default function AdminProjects() {
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);

  // Form State
  const [newProject, setNewProject] = useState({
    project: "",
    address: "",
    contractor: "",
    partner: "",
    mediator: "",
    sub: "",
    start: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    amount: "",
  });

  // Calculator State
  const [calcState, setCalcState] = useState({
    units: 0,
    services: [] as string[],
    calculation: {
      baseSum: 0,
      bonus1: 0,
      sumWithBonus1: 0,
      bonus2: 0,
      servicesSum: 0,
      total: 0,
    },
  });

  // User Lists for Dropdowns
  const [partners, setPartners] = useState<any[]>([]);
  const [mediators, setMediators] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);

  useEffect(() => {
    // Fetch from Supabase
    const fetchDropdownUsers = async () => {
      const supabase = createClient();

      // Fetch Partners
      const { data: partnersData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "partner");

      if (partnersData) {
        setPartners(
          partnersData.map((p) => ({
            id: p.id,
            name: p.full_name || p.email,
          })),
        );
      }

      // Fetch Mediators (Brokers)
      const { data: mediatorsData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "broker"); // Role in DB is technically 'broker'

      if (mediatorsData) {
        setMediators(
          mediatorsData.map((m) => ({
            id: m.id,
            name: m.full_name || m.email,
          })),
        );
      }
    };

    fetchDropdownUsers();
  }, []);

  // Effect to calculate totals when inputs change
  useEffect(() => {
    const unitIndex = Math.min(calcState.units, 16); // Cap at 16
    const costs = PRICING_MATRIX.baseCosts[unitIndex];

    // Sum of base costs
    const baseSum = Object.values(costs).reduce((a, b) => a + b, 0);

    // Bonus 1 (Quality & Deadline)
    const bonus1 = PRICING_MATRIX.bonus1[unitIndex] || 0;
    const sumWithBonus1 = baseSum + bonus1;

    // Bonus 2 (Quantity) - Simplified logic based on image ranges
    // For single project add, we assume 0 or base level unless we add selector.
    // Let's keep it 0 for now as requested for "create project" context (usually single)
    const bonus2 = 0;

    // Additional Services
    const servicesSum = calcState.services.reduce((sum, serviceId) => {
      const service = ADDITIONAL_SERVICES.find((s) => s.id === serviceId);
      return sum + (service ? service.price : 0);
    }, 0);

    const total = sumWithBonus1 + servicesSum;

    setCalcState((prev) => ({
      ...prev,
      calculation: {
        baseSum,
        bonus1,
        sumWithBonus1,
        bonus2,
        servicesSum,
        total,
      },
    }));

    // Update the main form amount
    setNewProject((prev) => ({ ...prev, amount: total.toString() }));
  }, [calcState.units, calcState.services]);

  useEffect(() => {
    const storedProjects = localStorage.getItem("prostruktion_projects_v1");
    if (storedProjects) {
      setProjects(JSON.parse(storedProjects));
    } else {
      // Initialize with empty array
      setProjects([]);
      localStorage.setItem("prostruktion_projects_v1", JSON.stringify([]));
    }
  }, []);

  const handleAddProject = () => {
    // Basic validation
    if (!newProject.project) return; // Amount is auto-calc

    const projectData = {
      ...newProject,
      status: "In Progress",
      statusColor: "bg-blue-600",
      abnahme: "No",
      invoiceHeader: "Create Invoice",
      invoiceStatus: "Ready",
      amount: `€ ${calcState.calculation.total.toLocaleString()}`,
      // Save calculation details for reference
      calculationDetails: calcState,
    };

    const updatedProjects = [projectData, ...projects];
    setProjects(updatedProjects);
    localStorage.setItem(
      "prostruktion_projects_v1",
      JSON.stringify(updatedProjects),
    );

    setAddProjectOpen(false);
    setNewProject({
      project: "",
      address: "",
      contractor: "",
      partner: "",
      mediator: "",
      sub: "",
      start: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      amount: "",
    });
    setCalcState({
      units: 0,
      services: [],
      calculation: {
        baseSum: 0,
        bonus1: 0,
        sumWithBonus1: 0,
        bonus2: 0,
        servicesSum: 0,
        total: 0,
      },
    });
  };

  const handleCreateInvoice = (project: any, index: number) => {
    // 1. Calculate splits
    // Remove "€ " and "," from string to get number
    const numericAmount = parseFloat(project.amount.replace(/[^0-9.-]+/g, ""));

    // Check if mediator exists (assuming "-" or empty string means no mediator)
    const hasMediator =
      project.mediator &&
      project.mediator !== "-" &&
      project.mediator.trim() !== "";

    const totalCommission = numericAmount * 0.3;

    let companyShare, partnerShare, mediatorShare;

    if (hasMediator) {
      companyShare = numericAmount * 0.1; // 10%
      partnerShare = numericAmount * 0.1; // 10%
      mediatorShare = numericAmount * 0.1; // 10%
    } else {
      companyShare = numericAmount * 0.15; // 15%
      partnerShare = numericAmount * 0.15; // 15%
      mediatorShare = 0;
    }

    // 2. Set current invoice data for modal
    const invoiceData = {
      ...project,
      numericAmount, // Pass clean number for display if needed
      totalCommission,
      companyShare,
      partnerShare,
      mediatorShare,
      hasMediator,
    };
    setCurrentInvoice(invoiceData);

    // 3. Mark locally as sent
    const newProjects = [...projects];
    newProjects[index].invoiceStatus = "Sent";
    setProjects(newProjects);
    localStorage.setItem(
      "prostruktion_projects_v1",
      JSON.stringify(newProjects),
    );

    // 4. Save to LocalStorage for Financial Dashboard
    // Map project fields to Financial Dashboard format
    const financialRecord = {
      id: Date.now(), // Unique ID
      project: project.project,
      partner: project.partner,
      mediator: hasMediator ? project.mediator : "-",
      emp: project.contractor, // Mapping Contractor to Employer
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }), // Today's date
      amount: companyShare, // Display the Invoice Amount (Share), not Total
      projectTotal: numericAmount, // Store total for calculations
      action: "Create Invoice",
      overdue: false,
      status: "For Invoice",
      days: "Now",
    };

    const existingInvoices = JSON.parse(
      localStorage.getItem("prostruktion_invoices") || "[]",
    );
    localStorage.setItem(
      "prostruktion_invoices",
      JSON.stringify([...existingInvoices, financialRecord]),
    );

    // 5. Save to LocalStorage for Archive
    // Map project fields to Archive format (mocking warranty dates for demo)
    const archiveRecord = {
      project: project.project,
      address: project.address,
      contractor: project.contractor,
      partner: project.partner,
      mediator: hasMediator ? project.mediator : "-",
      sub: project.sub,
      abnahme: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      warrantyEnd: new Date(
        new Date().setFullYear(new Date().getFullYear() + 5),
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }), // 5 years warranty mock
      status: "In Warranty",
      statusColor: "bg-green-100 text-green-700",
      action: "Create Complaint",
    };

    const existingArchive = JSON.parse(
      localStorage.getItem("prostruktion_archive") || "[]",
    );
    localStorage.setItem(
      "prostruktion_archive",
      JSON.stringify([...existingArchive, archiveRecord]),
    );

    // 6. Open success modal
    setSuccessModalOpen(true);
  };

  // Calculate Stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(
    (p) => p.status === "In Progress" || p.status === "Scheduled",
  ).length;
  const abnahmeProjects = projects.filter((p) => p.abnahme === "Yes").length;
  // const invoicingProjects removed
  const archivedProjects = projects.filter(
    (p) => p.status === "Archived",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-blue-600" /> Total
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalProjects}</div>
              <ArrowUpRight className="h-4 w-4 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Active
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{activeProjects}</div>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" /> Projects in Abnahme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{abnahmeProjects}</div>
              <ArrowUpRight className="h-4 w-4 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-50 dark:bg-gray-950/20 border-gray-100 dark:border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Archive className="h-4 w-4 text-gray-600" /> Archived Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{archivedProjects}</div>
              <Archive className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-muted/20 p-2 rounded-lg border">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            Filters:
          </span>
          <Select defaultValue="all-phases">
            <SelectTrigger className="w-[120px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Phases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-phases">All Phases</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="abnahme">Abnahme</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-contractors">
            <SelectTrigger className="w-[140px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Contractors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-contractors">All Contractors</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-partners">
            <SelectTrigger className="w-[120px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Partners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-partners">All Partners</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-mediators">
            <SelectTrigger className="w-[130px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Mediators" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-mediators">All Mediators</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-subs">
            <SelectTrigger className="w-[150px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Subcontractors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-subs">All Subcontractors</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-statuses">
            <SelectTrigger className="w-[120px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-statuses">All Statuses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Button
            className="h-8 bg-blue-600 hover:bg-blue-700"
            onClick={() => setAddProjectOpen(true)}
          >
            <Plus className="mr-2 h-3 w-3" /> Add Project
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{totalProjects} Projects found</span>
        {totalProjects > 10 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground"
              disabled
            >
              &lt;
            </Button>
            <span className="text-foreground font-medium">1</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground"
            >
              &gt;
            </Button>
          </div>
        )}
      </div>

      {/* Scheduled Projects Table */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">
          Scheduled Projects
        </h3>
        <div className="rounded-md border bg-white dark:bg-gray-950">
          <Table>
            <TableHeader className="bg-yellow-50 dark:bg-yellow-900/10">
              <TableRow>
                <TableHead className="font-semibold">
                  Project & Address
                </TableHead>
                <TableHead className="font-semibold">Contractor</TableHead>
                <TableHead className="font-semibold">Partner</TableHead>
                <TableHead className="font-semibold">Mediator</TableHead>
                <TableHead className="font-semibold">Subcontractor</TableHead>
                <TableHead className="font-semibold">Overdue</TableHead>
                <TableHead className="font-semibold text-right">
                  Penalty
                </TableHead>
                <TableHead className="font-semibold text-right">
                  Amount
                </TableHead>
                <TableHead className="font-semibold text-right">
                  Net Amount
                </TableHead>
                <TableHead className="font-semibold text-right">
                  Start Date
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.filter((p) => p.status === "Scheduled").length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No scheduled projects found.
                  </TableCell>
                </TableRow>
              ) : (
                projects
                  .filter((p) => p.status === "Scheduled")
                  .map((project, i) => {
                    // Mock Logic for Demo
                    const amountString = project.amount || "0";
                    const amount = parseFloat(
                      amountString.replace(/[^0-9.-]+/g, ""),
                    );
                    const isOverdue = i % 3 === 0; // Deterministic logic
                    const penalty = isOverdue ? 500 : 0;
                    const netAmount = amount - penalty;

                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-sm">
                                {project.project}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {project.address}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{project.contractor}</TableCell>
                        <TableCell>{project.partner}</TableCell>
                        <TableCell>{project.mediator}</TableCell>
                        <TableCell>{project.sub}</TableCell>
                        <TableCell>
                          <Badge
                            variant={isOverdue ? "destructive" : "secondary"}
                            className={
                              isOverdue
                                ? "bg-red-100 text-red-700 hover:bg-red-200 border-0"
                                : "bg-green-100 text-green-700 hover:bg-green-200 border-0"
                            }
                          >
                            {isOverdue ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          {penalty > 0
                            ? `- € ${penalty.toLocaleString()}`
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          € {amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          € {netAmount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {project.start}
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Main Table (Active Projects) */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">
          Active Projects
        </h3>
        <div className="rounded-md border bg-white dark:bg-gray-950">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
              <TableRow>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Project & Address
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Contractor
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Partner
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Mediator
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Subcontractor
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Start date
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Abnahme
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Amount (€)
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">
                  Invoice (€)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((item, i) => (
                <TableRow key={i} className="group hover:bg-muted/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">
                          {item.project}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.address}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.contractor}</TableCell>
                  <TableCell>{item.partner}</TableCell>
                  <TableCell>{item.mediator}</TableCell>
                  <TableCell>{item.sub}</TableCell>
                  <TableCell className="text-sm">{item.start}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${item.statusColor} hover:${item.statusColor} font-normal border-0`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded w-fit text-sm">
                      {item.abnahme}{" "}
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.amount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.invoiceStatus === "Sent" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 bg-green-50 text-green-700 border-green-200"
                          disabled
                        >
                          Sent <CheckCircle2 className="ml-1 h-3 w-3" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="h-7 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleCreateInvoice(item, i)}
                        >
                          Create Invoice
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
            <div className="text-sm text-muted-foreground">
              Showing {totalProjects} projects
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                disabled
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 text-sm font-medium bg-white dark:bg-gray-800 border shadow-sm"
              >
                1
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                disabled={totalProjects <= 10}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Button variant="outline" size="icon" className="h-6 w-6">
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <span>10 / page</span>
                <Button variant="outline" size="icon" className="h-6 w-6">
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
              <Button variant="outline" size="sm" className="h-8">
                Download CSV <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" /> Project Sent to Financial
              Dashboard
            </DialogTitle>
            <DialogDescription>
              The project has been marked as ready for invoicing and sent to the
              Financial Dashboard.
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
                  <span>€ {currentInvoice.numericAmount.toLocaleString()}</span>
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
                <span>Project data synchronized.</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSuccessModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={addProjectOpen} onOpenChange={setAddProjectOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Project</DialogTitle>
            <DialogDescription>
              Enter the project details and calculate pricing based on the
              German standards.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Project Details Section */}
            <div>
              <h3 className="font-semibold text-sm mb-3 pb-1 border-b">
                Project Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-medium">
                    Project Name
                  </label>
                  <Input
                    id="name"
                    value={newProject.project}
                    onChange={(e) =>
                      setNewProject({ ...newProject, project: e.target.value })
                    }
                    placeholder="e.g. Weber House"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="address" className="text-xs font-medium">
                    Address
                  </label>
                  <Input
                    id="address"
                    value={newProject.address}
                    onChange={(e) =>
                      setNewProject({ ...newProject, address: e.target.value })
                    }
                    placeholder="e.g. Berliner Str. 12"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="contractor" className="text-xs font-medium">
                    Contractor
                  </label>
                  <Input
                    id="contractor"
                    value={newProject.contractor}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        contractor: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="partner" className="text-xs font-medium">
                    Partner
                  </label>
                  <Select
                    value={newProject.partner}
                    onValueChange={(val) =>
                      setNewProject({ ...newProject, partner: val })
                    }
                  >
                    <SelectTrigger id="partner">
                      <SelectValue placeholder="Select Partner" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map((p) => (
                        <SelectItem key={p.id} value={p.name}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="mediator" className="text-xs font-medium">
                    Mediator (Optional)
                  </label>
                  <Select
                    value={newProject.mediator}
                    onValueChange={(val) =>
                      setNewProject({ ...newProject, mediator: val })
                    }
                  >
                    <SelectTrigger id="mediator">
                      <SelectValue placeholder="Select Mediator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">None</SelectItem>
                      {mediators.map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="sub" className="text-xs font-medium">
                    Subcontractor
                  </label>
                  <Input
                    id="sub"
                    value={newProject.sub}
                    onChange={(e) =>
                      setNewProject({ ...newProject, sub: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Pricing Calculator Section */}
            <div>
              <div className="flex items-center justify-between mb-3 pb-1 border-b">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4" /> Pricing Calculation
                </h3>
                <Badge
                  variant="outline"
                  className="text-base font-bold px-3 py-1 bg-blue-50 text-blue-700 border-blue-200"
                >
                  Total: € {calcState.calculation.total.toLocaleString()}
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Inputs */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium">
                      Anzahl Innengeräte (0-16)
                    </label>
                    <Select
                      value={calcState.units.toString()}
                      onValueChange={(val) =>
                        setCalcState((prev) => ({
                          ...prev,
                          units: parseInt(val),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Units" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {Array.from({ length: 17 }).map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i} {i === 1 ? "Unit" : "Units"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium block">
                      Zusatzleistungen (Additional Services)
                    </label>
                    <div className="border rounded-md p-2 h-[220px] overflow-y-auto space-y-1 bg-gray-50/50">
                      {ADDITIONAL_SERVICES.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-start space-x-2 p-1 hover:bg-gray-100 rounded"
                        >
                          <Checkbox
                            id={service.id}
                            checked={calcState.services.includes(service.id)}
                            onCheckedChange={(checked) => {
                              setCalcState((prev) => {
                                const newServices = checked
                                  ? [...prev.services, service.id]
                                  : prev.services.filter(
                                      (id) => id !== service.id,
                                    );
                                return { ...prev, services: newServices };
                              });
                            }}
                          />
                          <label
                            htmlFor={service.id}
                            className="text-xs font-medium leading-tight cursor-pointer pt-0.5"
                          >
                            {service.label}{" "}
                            <span className="text-muted-foreground ml-1 font-normal">
                              (€{service.price})
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="bg-slate-50 dark:bg-slate-900 border rounded-lg p-4 text-sm space-y-3 h-fit">
                  <h4 className="font-semibold text-xs uppercase text-muted-foreground tracking-wider mb-2">
                    Cost Breakdown
                  </h4>

                  <div className="flex justify-between">
                    <span>Base Sum (for {calcState.units} units):</span>
                    <span className="font-medium">
                      € {calcState.calculation.baseSum.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      + Quality Bonus{" "}
                      <span className="text-[10px] bg-green-100 px-1 rounded">
                        1. Bonus
                      </span>
                    </span>
                    <span>
                      € {calcState.calculation.bonus1.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-dashed pt-2 font-medium">
                    <span>Summe inkl. 1. Bonus:</span>
                    <span>
                      € {calcState.calculation.sumWithBonus1.toLocaleString()}
                    </span>
                  </div>

                  {calcState.services.length > 0 && (
                    <div className="flex justify-between pt-2 text-blue-600">
                      <span>
                        + Additional Services ({calcState.services.length}):
                      </span>
                      <span className="font-medium">
                        € {calcState.calculation.servicesSum.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between border-t-2 border-slate-200 pt-3 mt-2">
                    <span className="text-lg font-bold">Total Amount:</span>
                    <span className="text-lg font-bold text-blue-600">
                      € {calcState.calculation.total.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-[10px] text-muted-foreground pt-2 text-center">
                    * Prices include applicable taxes and standard rates.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProjectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddProject}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
