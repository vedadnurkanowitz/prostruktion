"use client";

import { useState, useEffect, Fragment } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Archive,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  ChevronDown,
  RotateCw,
  Users,
  Zap,
  ThermometerSun,
  Wrench,
  Building2,
  FileText,
  HardHat,
  Trophy,
  PlusCircle,
} from "lucide-react";
import { PRICING_MATRIX, ADDITIONAL_SERVICES } from "@/lib/pricing-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectEvidence } from "@/components/admin/project-evidence";

// Helper to parse German currency strings (e.g. "4.820,00" -> 4820.00)
const parseGermanFloat = (str: string | number | undefined | null) => {
  if (typeof str === "number") return str;
  if (!str) return 0;
  const val = str.toString();
  const clean = val.replace(/[^0-9.,-]/g, "");
  const noDots = clean.replace(/\./g, "");
  const withDecimal = noDots.replace(",", ".");
  return parseFloat(withDecimal) || 0;
};

// Calculate Penalty Helper
const calculatePenalty = (amountStr: string, startDateStr: string) => {
  const amount = parseGermanFloat(amountStr);
  if (isNaN(amount) || !startDateStr)
    return {
      penalty: 0,
      daysLate: 0,
      isOverdue: false,
      netAmount: amount,
      penaltyPercentage: "0",
    };

  const start = new Date(startDateStr);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = now.getTime() - start.getTime();
  const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysLate <= 0) {
    return {
      penalty: 0,
      daysLate: 0,
      isOverdue: false,
      netAmount: amount,
      penaltyPercentage: "0",
    };
  }

  const dailyRate = 0.002;
  const maxRate = 0.05;
  let penaltyRate = daysLate * dailyRate;
  if (penaltyRate > maxRate) penaltyRate = maxRate;

  const penalty = amount * penaltyRate;
  const netAmount = amount - penalty;

  return {
    penalty,
    daysLate,
    isOverdue: true,
    netAmount,
    penaltyPercentage: (penaltyRate * 100).toFixed(1),
  };
};

export default function ArchivePage() {
  const router = useRouter();
  const [archivedProjects, setArchivedProjects] = useState<any[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    inWarranty: 0,
    expiringMsg: 0,
    expired: 0,
  });

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Helper for labels
  const WORK_TYPE_LABELS: Record<string, string> = {
    montage: "Montage Innengeräte, Hydraulik-Modul,\nAußengerät (1)",
    hydraulik: "Hydraulische Montage (2)",
    kaelteInbetriebnahme: "Kältetechnische Inbetriebnahme (3)",
    elektroAnschluss: "Elektroanschluss Unterverteilung (4)",
    elektroInbetriebnahme: "Elektrotechnische Inbetriebnahme (5)",
    bohrungen: "Bohrungen (6)",
    kleinteile: "Kleinteilpauschale (7)",
    kaeltemittel: "Kältemittel R32 (8)",
    besichtigung: "Vor-Ort-Besichtigung",
  };

  // Complaint Dialog State
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [selectedProjectForComplaint, setSelectedProjectForComplaint] =
    useState<any>(null);

  // Form State
  const [complaintForm, setComplaintForm] = useState({
    description: "",
    category: "general",
    priority: "medium",
    location: "",
    responsible: "sub",
    deadline: "",
    costEstimate: "",
  });

  const supabase = createClient();

  useEffect(() => {
    fetchArchivedProjects();
  }, []);

  const fetchArchivedProjects = async () => {
    setLoading(true);
    try {
      // 1. Fetch Projects
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select(
          `
        *,
        project_work_types(work_type_key, price),
        project_additional_services(service_id, price),
        project_workers(worker_id)
      `,
        )
        .eq("status", "Archived")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!projectsData) return;

      // 2. Fetch Contacts/Profiles for Names
      const { data: contactsData } = await supabase
        .from("contacts")
        .select("*");
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*");
      const { data: customersData } = await supabase
        .from("customers")
        .select("id, customer_number, email, phone");

      // Fetch workers details for all workers in these projects
      const allWorkerIds = Array.from(
        new Set(
          projectsData
            .flatMap((p) => p.project_workers?.map((pw: any) => pw.worker_id))
            .filter(Boolean),
        ),
      );

      let workersMap: Record<string, any> = {};
      if (allWorkerIds.length > 0) {
        const { data: workersList } = await supabase
          .from("workers")
          .select(
            "id, name, cert_status, a1_status, success_rate, cert_files, a1_files",
          )
          .in("id", allWorkerIds);

        if (workersList) {
          workersMap = workersList.reduce(
            (acc: any, w: any) => {
              acc[w.id] = {
                name: w.name,
                certStatus: w.cert_status,
                a1Status: w.a1_status,
                successRate: w.success_rate,
                certFiles: w.cert_files || [],
                a1Files: w.a1_files || [],
              };
              return acc;
            },
            {} as Record<string, any>,
          );
        }
      }

      // Helper to find name
      const findContactName = (id: string) => {
        if (!id) return "";
        // Try profiles first
        const p = profilesData?.find((profile) => profile.id === id);
        if (p) return p.full_name || p.company_name || "Unknown";
        // Try contacts
        const c = contactsData?.find((contact) => contact.id === id);
        if (c) return c.name || c.company || "Unknown";
        return id; // Fallback
      };

      const customersMap = (customersData || []).reduce((acc: any, c: any) => {
        acc[c.id] = c;
        return acc;
      }, {});

      // 3. Map Data
      const mapped = projectsData.map((p) => {
        // Parse dates
        const abnahmeDate = p.abnahme
          ? new Date(p.abnahme)
          : p.start
            ? new Date(p.start)
            : null;

        const customer = customersMap[p.customer_id];
        let displayStatus = "In Warranty";
        let statusColor =
          "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";

        if (abnahmeDate) {
          const now = new Date();
          const warrantyYears = 5;
          const expiryDate = new Date(abnahmeDate);
          expiryDate.setFullYear(expiryDate.getFullYear() + warrantyYears);
          // Calculate difference in months
          const monthsToExpiry =
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);

          if (now > expiryDate) {
            displayStatus = "Expired";
            statusColor =
              "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
          } else if (monthsToExpiry <= 6) {
            displayStatus = "Expiring";
            statusColor =
              "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/20";
          } else {
            displayStatus = "In Warranty";
            statusColor =
              "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
          }
        }

        return {
          ...p,
          status: displayStatus,
          statusColor,
          project: p.name || p.project || `Project ${p.id.substring(0, 8)}`,
          address: p.address || "",
          sub: findContactName(p.subcontractor_id) || p.sub || "Unassigned",
          contractor: findContactName(p.contractor_id) || p.contractor || "",
          partner: findContactName(p.partner_id) || p.partner || "",
          mediator: findContactName(p.mediator_id) || p.mediator || "",

          additionalWorks: p.additional_works || p.additionalWorks || [],

          // Extract work types from the joined relation table (same as Projects tab)
          selectedWorkTypes: (p.project_work_types || [])
            .filter((wt: any) => WORK_TYPE_LABELS[wt.work_type_key])
            .map((wt: any) => wt.work_type_key),
          customWorkTypes: (p.project_work_types || [])
            .filter((wt: any) => !WORK_TYPE_LABELS[wt.work_type_key])
            .map((wt: any) => ({
              label: wt.work_type_key,
              price: wt.price || 0,
            })),
          workTypePrices: (p.project_work_types || []).reduce(
            (acc: any, wt: any) => {
              if (WORK_TYPE_LABELS[wt.work_type_key]) {
                acc[wt.work_type_key] = wt.price || 0;
              }
              return acc;
            },
            {} as Record<string, number>,
          ),

          // Extract additional services from the joined relation table
          selectedAdditionalServices: (p.project_additional_services || []).map(
            (s: any) => s.service_id,
          ),
          additionalServicePrices: (p.project_additional_services || []).reduce(
            (acc: any, s: any) => {
              if (s.price !== undefined && s.price !== null) {
                acc[s.service_id] = s.price;
              }
              return acc;
            },
            {} as Record<string, number>,
          ),

          indoorUnits: p.indoor_units || 0,
          amount: p.contract_value || p.amount || 0,

          // Enhanced mappings for details
          projectWorkTypesRaw: p.project_work_types,
          projectAdditionalServicesRaw: p.project_additional_services,
          // If project_workers relation exists, use it, else fallback to p.workers array if legacy
          workers:
            p.project_workers?.map((pw: any) => pw.worker_id) ||
            p.workers ||
            [],

          // Map details
          customerNumber: customer?.customer_number || p.customer_number || "",
          customerPhone: customer?.phone || p.customer_phone || "",
          customerEmail: customer?.email || p.customer_email || "",
          description: p.description || "",
        };
      });

      // Pass map to state or use a ref/context if needed, but here we can attach detailed worker info to project object for simpler rendering
      // modifying mapped project to include the looked-up worker objects
      const finalMapped = mapped.map((p) => ({
        ...p,
        workerDetails: p.workers.map((id: string) => ({
          id,
          ...workersMap[id],
        })),
        // Pre-calculate costs for UI
        workTypeCosts: (p.projectWorkTypesRaw || []).reduce(
          (acc: any, wt: any) => {
            acc[wt.work_type_key] = wt.price;
            return acc;
          },
          {},
        ),
        additionalServiceCosts: (p.projectAdditionalServicesRaw || []).reduce(
          (acc: any, s: any) => {
            acc[s.service_id] = s.price;
            return acc;
          },
          {},
        ),
      }));

      setArchivedProjects(finalMapped);

      // 4. Update Stats
      setStats({
        total: mapped.length,
        inWarranty: mapped.filter((p) => p.status === "In Warranty").length,
        expiringMsg: mapped.filter((p) => p.status === "Expiring").length,
        expired: mapped.filter((p) => p.status === "Expired").length,
      });
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const handleCreateComplaint = (project: any) => {
    setSelectedProjectForComplaint(project);
    setComplaintForm({
      description: "",
      category: "general",
      priority: "medium",
      location: "",
      responsible: "sub",
      deadline: "",
      costEstimate: "",
    });
    setComplaintOpen(true);
  };

  const submitComplaint = () => {
    // Keep localStorage logic for now as requested by user workflow (no backend complaint table yet)
    if (!selectedProjectForComplaint) return;
    const project = selectedProjectForComplaint;
    const newComplaint = {
      id: Math.floor(10000 + Math.random() * 90000).toString(),
      project: project.project,
      address: project.address,
      abnahmeDate: project.abnahme || project.start,
      warrantyStatus: project.status,
      category: complaintForm.category,
      priority: complaintForm.priority,
      description: complaintForm.description,
      location: complaintForm.location,
      dueDate: complaintForm.deadline,
      costEstimate: complaintForm.costEstimate,
      contractor: project.contractor,
      partner: project.partner,
      subcontractor: project.sub,
      repairBy:
        complaintForm.responsible === "sub"
          ? "SUB"
          : complaintForm.responsible === "partner"
            ? "Partner"
            : "Contract",
      count: 1,
      status1: "red",
      status2: "yellow",
      createdAt: new Date().toISOString(),
    };

    const existingComplaints = JSON.parse(
      localStorage.getItem("prostruktion_complaints") || "[]",
    );
    localStorage.setItem(
      "prostruktion_complaints",
      JSON.stringify([newComplaint, ...existingComplaints]),
    );

    setComplaintOpen(false);
    router.push("/admin/complaints");
  };

  const totalPages = Math.ceil(archivedProjects.length / itemsPerPage);
  const paginatedArchive = archivedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Archive</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Total Archived */}
        <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Archive className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-muted-foreground">
              Archived Projects
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-700">
                {stats.total}
              </div>
              <div className="h-1 w-4 bg-blue-300 rounded"></div>
            </div>
          </CardContent>
        </Card>

        {/* In Warranty */}
        <Card className="bg-orange-50/50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <CheckCircle2 className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-muted-foreground">
              In Warranty
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-700">
                {stats.inWarranty}
              </div>
              <CheckCircle2 className="h-4 w-4 text-orange-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Warranty Expiring */}
        <Card className="bg-purple-50/50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <AlertTriangle className="h-4 w-4 text-purple-600" />
            <div className="flex flex-col leading-none">
              <span className="text-sm font-medium text-muted-foreground">
                Warranty Expiring
              </span>
              <span className="text-[10px] text-muted-foreground">
                (6 months)
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-purple-700">
                {stats.expiringMsg}
              </div>
              <Clock className="h-4 w-4 text-purple-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        {/* Expired */}
        <Card className="bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="bg-green-200 rounded-full p-0.5">
              <AlertTriangle className="h-3 w-3 text-green-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Expired
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-700">
                {stats.expired}
              </div>
              <div className="h-3 w-4 border-2 border-green-300 rounded-sm"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <div className="rounded-md border bg-white dark:bg-gray-950">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[20%] font-semibold text-gray-700 dark:text-gray-300">
                Name
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Subcontractor
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Abnahme Date
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Penalty
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Amount
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Net
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Status
              </TableHead>
              <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <RotateCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    Loading archive...
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedArchive.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-10 text-muted-foreground"
                >
                  No archived projects found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedArchive.map((item, i) => {
                const isExpanded = expandedRows.has(i);
                const {
                  penalty,
                  daysLate,
                  isOverdue,
                  netAmount,
                  penaltyPercentage,
                } = calculatePenalty(
                  item.amount,
                  item.scheduled_start || item.scheduledStart || item.start,
                );

                return (
                  <Fragment key={item.id || i}>
                    <TableRow
                      className={`group hover:bg-muted/50 ${isExpanded ? "bg-muted/30" : ""}`}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleRow(i)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
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
                      <TableCell>{item.sub}</TableCell>
                      <TableCell className="text-sm">
                        {item.abnahme
                          ? new Date(item.abnahme).toLocaleDateString()
                          : item.start || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge
                            variant={isOverdue ? "destructive" : "secondary"}
                            className={
                              isOverdue
                                ? "bg-red-100 text-red-700 hover:bg-red-200 border-0"
                                : "bg-green-100 text-green-700 hover:bg-green-200 border-0"
                            }
                          >
                            {isOverdue ? `${daysLate} Days` : "No"}
                          </Badge>
                          {penalty > 0 && (
                            <span className="text-xs text-red-500 font-medium ml-1">
                              -{penaltyPercentage}%
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {typeof item.amount === "number"
                          ? `€ ${item.amount.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                          : item.amount}
                      </TableCell>
                      <TableCell className="font-bold text-blue-600">
                        €{" "}
                        {netAmount.toLocaleString("de-DE", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${item.statusColor} font-normal border-0 text-[10px] px-2 py-0.5 rounded capitalize whitespace-nowrap`}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateComplaint(item);
                          }}
                        >
                          <AlertTriangle className="mr-2 h-3 w-3" />
                          Complaint
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200">
                        <TableCell colSpan={9} className="p-0">
                          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Column 1: Project & Customer Details */}
                            <div className="space-y-4 h-full flex flex-col">
                              <div className="flex flex-col h-full">
                                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <FileText className="h-3 w-3" /> Customer
                                  Details
                                </h4>
                                <div className="bg-white dark:bg-gray-950 rounded-lg border p-3 text-sm space-y-2 shadow-sm flex-1 flex flex-col">
                                  <div className="grid grid-cols-[100px_1fr] gap-2 shrink-0">
                                    <span className="text-muted-foreground text-xs">
                                      Customer No:
                                    </span>
                                    <span className="font-medium">
                                      {item.customerNumber || "N/A"}
                                    </span>

                                    <span className="text-muted-foreground text-xs">
                                      Phone:
                                    </span>
                                    <span className="font-medium">
                                      {item.customerPhone || "N/A"}
                                    </span>

                                    <span className="text-muted-foreground text-xs">
                                      Email:
                                    </span>
                                    <span
                                      className="font-medium truncate"
                                      title={item.customerEmail}
                                    >
                                      {item.customerEmail || "N/A"}
                                    </span>

                                    <span className="text-muted-foreground text-xs">
                                      Location:
                                    </span>
                                    <span className="font-medium">
                                      {item.address}
                                    </span>
                                  </div>
                                  {item.description && (
                                    <div className="pt-2 mt-2 border-t border-dashed flex-1 flex flex-col min-h-0">
                                      <span className="text-xs text-muted-foreground block mb-2 shrink-0">
                                        Notes:
                                      </span>
                                      <p className="text-xs whitespace-pre-wrap overflow-y-auto text-gray-600 flex-1 pr-1 max-h-[250px]">
                                        {item.description}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Column 2: Assigned Workers */}
                            <div className="space-y-4 h-full flex flex-col">
                              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                <HardHat className="h-3 w-3" /> Assigned Workers
                              </h4>

                              <div className="bg-white dark:bg-gray-950 rounded-lg border p-3 text-sm space-y-2 shadow-sm mb-1">
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                  <span className="text-muted-foreground text-xs">
                                    Contractor:
                                  </span>
                                  <span className="font-medium">
                                    {item.contractor || "N/A"}
                                  </span>

                                  <span className="text-muted-foreground text-xs">
                                    Partner:
                                  </span>
                                  <span className="font-medium">
                                    {item.partner || "N/A"}
                                  </span>

                                  <span className="text-muted-foreground text-xs">
                                    Mediator:
                                  </span>
                                  <span className="font-medium">
                                    {item.mediator || "N/A"}
                                  </span>
                                </div>
                              </div>

                              {item.workers && item.workers.length > 0 ? (
                                <div className="rounded-md border bg-white dark:bg-gray-950 overflow-hidden shadow-sm h-full">
                                  <Table>
                                    <TableHeader className="bg-gray-50/50">
                                      <TableRow className="h-8 hover:bg-transparent">
                                        <TableHead className="h-8 text-[10px] font-semibold">
                                          Name
                                        </TableHead>
                                        <TableHead className="h-8 text-[10px] font-semibold text-center">
                                          Cert
                                        </TableHead>
                                        <TableHead className="h-8 text-[10px] font-semibold text-center">
                                          A1
                                        </TableHead>
                                        <TableHead className="h-8 text-[10px] font-semibold text-center">
                                          Success
                                        </TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {item.workerDetails?.map(
                                        (worker: any) => {
                                          const certValid =
                                            (worker.certFiles || []).length > 0;
                                          const a1Valid =
                                            (worker.a1Files || []).length > 0;

                                          return (
                                            <TableRow
                                              key={worker.id}
                                              className="h-8 hover:bg-transparent border-0"
                                            >
                                              <TableCell className="py-1">
                                                <div className="flex items-center gap-2">
                                                  <Avatar className="h-5 w-5 border">
                                                    <AvatarImage
                                                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.id}`}
                                                    />
                                                    <AvatarFallback className="text-[9px]">
                                                      {worker.id.charAt(0)}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                  <span className="text-xs font-medium truncate max-w-[100px]">
                                                    {worker.name ||
                                                      `Worker ${worker.id.substring(0, 6)}`}
                                                  </span>
                                                </div>
                                              </TableCell>
                                              <TableCell className="py-1 text-xs text-center">
                                                <span
                                                  className={
                                                    certValid
                                                      ? "text-green-600 font-medium"
                                                      : "text-muted-foreground"
                                                  }
                                                >
                                                  {certValid ? "Yes" : "No"}
                                                </span>
                                              </TableCell>
                                              <TableCell className="py-1 text-xs text-center">
                                                <span
                                                  className={
                                                    a1Valid
                                                      ? "text-green-600 font-medium"
                                                      : "text-muted-foreground"
                                                  }
                                                >
                                                  {a1Valid ? "Yes" : "No"}
                                                </span>
                                              </TableCell>
                                              <TableCell className="py-1 text-center text-xs text-green-600 font-medium">
                                                {worker.successRate !==
                                                undefined
                                                  ? `${worker.successRate}%`
                                                  : "100%"}
                                              </TableCell>
                                            </TableRow>
                                          );
                                        },
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground italic border rounded p-3 bg-white dark:bg-gray-950 text-center h-full flex items-center justify-center">
                                  No workers assigned.
                                </div>
                              )}

                              {/* Estimated & Actual Hours Footer */}
                              <div className="bg-gray-50 dark:bg-gray-900/10 rounded-lg border p-3 flex flex-col gap-2 mt-auto">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    Estimated Max Hours:
                                  </span>
                                  <span className="font-mono font-semibold">
                                    {item.estimated_hours ||
                                      item.estimatedHours ||
                                      "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    Actual Hours:
                                  </span>
                                  <span className="font-mono font-semibold">
                                    {item.actual_hours ||
                                      item.actualHours ||
                                      "—"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Column 3: Scope of Work */}
                            <div className="space-y-4 h-full flex flex-col">
                              <div className="h-full flex flex-col">
                                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <Trophy className="h-3 w-3" /> Scope of Work
                                </h4>

                                <div className="bg-white dark:bg-gray-950 rounded-lg border p-4 flex flex-col h-full shadow-sm">
                                  <div className="flex-1 space-y-5 text-xs">
                                    {/* Unit Count Header */}
                                    <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md border border-muted/50">
                                      <span className="font-medium text-muted-foreground">
                                        Indoor Units
                                      </span>
                                      <Badge
                                        variant="secondary"
                                        className="text-sm font-bold px-2.5 py-0.5"
                                      >
                                        {item.indoorUnits || 0}
                                      </Badge>
                                    </div>

                                    {/* Work Types */}
                                    <div className="space-y-2">
                                      <div className="font-semibold text-[10px] uppercase text-muted-foreground border-b pb-1">
                                        Base Installation
                                      </div>
                                      {item.selectedWorkTypes &&
                                      item.selectedWorkTypes.length > 0 ? (
                                        <div className="grid gap-2">
                                          {item.selectedWorkTypes.map(
                                            (type: string) => {
                                              const units =
                                                item.indoorUnits || 0;
                                              const unitCosts =
                                                PRICING_MATRIX.baseCosts[
                                                  units
                                                ] || {};
                                              // Use stored price from relation table, else calc from matrix
                                              const cost =
                                                item.workTypePrices?.[type] !==
                                                undefined
                                                  ? item.workTypePrices[type]
                                                  : item.workTypeCosts?.[
                                                        type
                                                      ] !== undefined
                                                    ? item.workTypeCosts[type]
                                                    : (unitCosts as any)[
                                                        type
                                                      ] || 0;

                                              return (
                                                <div
                                                  key={type}
                                                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start w-full border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0"
                                                >
                                                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium wrap-break-word leading-tight whitespace-pre-line">
                                                    {WORK_TYPE_LABELS[type] ||
                                                      type}
                                                  </span>
                                                  <span className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                    € {cost}
                                                  </span>
                                                </div>
                                              );
                                            },
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-muted-foreground italic text-[11px] py-1">
                                          No specific work types selected.
                                        </p>
                                      )}
                                    </div>

                                    {/* Custom Work Types */}
                                    {item.customWorkTypes &&
                                      item.customWorkTypes.length > 0 && (
                                        <div className="space-y-2 mt-4">
                                          <div className="font-semibold text-[10px] uppercase text-muted-foreground border-b pb-1 mb-2">
                                            Custom Items
                                          </div>
                                          <div className="grid gap-2">
                                            {item.customWorkTypes.map(
                                              (cw: any, cwIdx: number) => (
                                                <div
                                                  key={cwIdx}
                                                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start w-full border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0"
                                                >
                                                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium wrap-break-word leading-tight">
                                                    {cw.label}
                                                  </span>
                                                  <span className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                    € {cw.price}
                                                  </span>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      )}

                                    {/* Additional Services */}
                                    {item.selectedAdditionalServices &&
                                      item.selectedAdditionalServices.length >
                                        0 && (
                                        <div className="space-y-2 mt-4">
                                          <div className="font-semibold text-[10px] uppercase text-muted-foreground border-b pb-1 mb-2">
                                            Extras
                                          </div>
                                          <div className="grid gap-2">
                                            {item.selectedAdditionalServices.map(
                                              (serviceId: string) => {
                                                const service =
                                                  ADDITIONAL_SERVICES.find(
                                                    (s) => s.id === serviceId,
                                                  );
                                                return (
                                                  <div
                                                    key={serviceId}
                                                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start w-full border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0"
                                                  >
                                                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium wrap-break-word leading-tight">
                                                      {service?.label ||
                                                        serviceId}
                                                    </span>
                                                    <span className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                      €{" "}
                                                      {item
                                                        .additionalServicePrices?.[
                                                        serviceId
                                                      ] !== undefined
                                                        ? item
                                                            .additionalServicePrices[
                                                            serviceId
                                                          ]
                                                        : item
                                                              .additionalServiceCosts?.[
                                                              serviceId
                                                            ] !== undefined
                                                          ? item
                                                              .additionalServiceCosts[
                                                              serviceId
                                                            ]
                                                          : service?.price || 0}
                                                    </span>
                                                  </div>
                                                );
                                              },
                                            )}
                                          </div>
                                        </div>
                                      )}
                                  </div>

                                  <div className="pt-4 mt-4 border-t">
                                    <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                      <span className="font-bold text-blue-900 dark:text-blue-100">
                                        Total Amount
                                      </span>
                                      <span className="font-mono font-bold text-lg text-blue-700 dark:text-blue-300">
                                        €{" "}
                                        {typeof item.amount === "number"
                                          ? item.amount.toLocaleString(
                                              "de-DE",
                                              {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 2,
                                              },
                                            )
                                          : item.amount}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Additional Work Section (Archived - Read Only) */}
                          {item.additionalWorks &&
                            item.additionalWorks.length > 0 && (
                              <div className="px-4 pb-4">
                                <div className="pt-6 mt-6 border-t border-dashed">
                                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <PlusCircle className="h-3 w-3" />{" "}
                                    Additional Work (Archived)
                                  </h4>

                                  <div className="bg-white dark:bg-gray-950 rounded-lg border p-4 shadow-sm space-y-4">
                                    <div className="space-y-2">
                                      <div className="grid grid-cols-[1fr_120px_180px_100px] gap-4 text-xs font-medium text-muted-foreground pb-2 border-b px-2">
                                        <span>Description</span>
                                        <span className="text-right">
                                          Price
                                        </span>
                                        <span className="text-center">
                                          Receipt
                                        </span>
                                        <span></span>
                                      </div>
                                      {item.additionalWorks.map(
                                        (work: any, wIndex: number) => (
                                          <div
                                            key={wIndex}
                                            className="grid grid-cols-[1fr_120px_180px_100px] gap-4 text-sm items-center px-2"
                                          >
                                            <span className="font-medium truncate">
                                              {work.description}
                                            </span>
                                            <span className="font-mono text-right text-gray-600">
                                              € {(work.price || 0).toFixed(2)}
                                            </span>
                                            <div className="flex justify-center">
                                              {work.receiptName ? (
                                                <Badge
                                                  variant="outline"
                                                  className="text-[10px] bg-green-50 text-green-700 border-green-200 truncate max-w-full"
                                                >
                                                  <FileText className="h-3 w-3 mr-1" />{" "}
                                                  {work.receiptName}
                                                </Badge>
                                              ) : (
                                                <span className="text-xs text-muted-foreground italic">
                                                  No receipt
                                                </span>
                                              )}
                                            </div>
                                            <div></div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                          {/* Evidence / Screenshots Section */}
                          <div className="px-4 pb-4 overflow-hidden">
                            <div className="pt-6 mt-6 border-t border-dashed">
                              <ProjectEvidence projectId={item.id} />
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            {Math.min(
              archivedProjects.length,
              (currentPage - 1) * itemsPerPage + 1,
            )}{" "}
            to {Math.min(archivedProjects.length, currentPage * itemsPerPage)}{" "}
            of {stats.total} entries
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-1 h-3 w-3" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next Page <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(val) => {
                setItemsPerPage(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <SelectValue placeholder={itemsPerPage + " / page"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 / page</SelectItem>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Dialog open={complaintOpen} onOpenChange={setComplaintOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>File a Complaint</DialogTitle>
            <DialogDescription>
              Create a formal defect report for{" "}
              {selectedProjectForComplaint?.project}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={complaintForm.category}
                  onValueChange={(val) =>
                    setComplaintForm({ ...complaintForm, category: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="material">Material</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={complaintForm.priority}
                  onValueChange={(val) =>
                    setComplaintForm({ ...complaintForm, priority: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={complaintForm.description}
                onChange={(e) =>
                  setComplaintForm({
                    ...complaintForm,
                    description: e.target.value,
                  })
                }
                placeholder="Describe the issue..."
              />
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={complaintForm.location}
                onChange={(e) =>
                  setComplaintForm({
                    ...complaintForm,
                    location: e.target.value,
                  })
                }
                placeholder="e.g. Living room unit"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsible Party</Label>
                <Select
                  value={complaintForm.responsible}
                  onValueChange={(val) =>
                    setComplaintForm({ ...complaintForm, responsible: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sub">Subcontractor</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input
                  type="date"
                  value={complaintForm.deadline}
                  onChange={(e) =>
                    setComplaintForm({
                      ...complaintForm,
                      deadline: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setComplaintOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitComplaint}>File Complaint</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
