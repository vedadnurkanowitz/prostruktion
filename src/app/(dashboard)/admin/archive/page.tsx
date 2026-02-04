"use client";

import { useState, useEffect } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Fragment } from "react";

import { useRouter } from "next/navigation";

export default function ArchivePage() {
  const router = useRouter();
  const [archivedProjects, setArchivedProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    inWarranty: 0,
    expiringMsg: 0,
    expired: 0,
  });

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      responsible: "sub", // Default to sub as they usually do the work
      deadline: "",
      costEstimate: "",
    });
    setComplaintOpen(true);
  };

  const submitComplaint = () => {
    if (!selectedProjectForComplaint) return;

    const project = selectedProjectForComplaint;
    const newComplaint = {
      id: Math.floor(10000 + Math.random() * 90000).toString(),
      project: project.project,
      address: project.address,
      abnahmeDate: project.abnahme || project.start,
      warrantyStatus: project.status,

      // Assigned from form
      category: complaintForm.category,
      priority: complaintForm.priority,
      description: complaintForm.description,
      location: complaintForm.location,
      dueDate: complaintForm.deadline,
      costEstimate: complaintForm.costEstimate,

      // Map responsible party logic
      contractor: project.contractor,
      partner: project.partner,
      subcontractor: project.sub,

      // Determine "Repair By" based on selection
      repairBy:
        complaintForm.responsible === "sub"
          ? "SUB"
          : complaintForm.responsible === "partner"
            ? "Partner"
            : "Contract",

      count: 1,
      status1: "red", // Indicator
      status2: "yellow", // Progress
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
    // Optional: Navigate to complaints to see it, or stay here. User workflow implies staying or confirming.
    // Let's navigate to complaints so they see the result.
    router.push("/admin/complaints");
  };

  useEffect(() => {
    // Load data from localStorage
    const storedArchive = localStorage.getItem("prostruktion_archive");
    let initialData = storedArchive ? JSON.parse(storedArchive) : [];

    // Seed dummy data if empty for testing warranty statuses
    const processedData = initialData;
    setArchivedProjects(processedData);
    setStats({
      total: processedData.length,
      inWarranty: processedData.filter((p: any) => p.status === "In Warranty")
        .length,
      expiringMsg: processedData.filter((p: any) => p.status === "Expiring")
        .length,
      expired: processedData.filter((p: any) => p.status === "Expired").length,
    });
  }, []);

  // Pagination Logic
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
            </span>{" "}
            {/* Label mismatch in image '62'? using Expired for logic*/}
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

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-muted/20 p-2 rounded-lg border">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            Filters:
          </span>
          <Select defaultValue="all-contractors">
            <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-gray-950 border-gray-200">
              <SelectValue placeholder="All Contractors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-contractors">All Contractors</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-partners">
            <SelectTrigger className="w-[120px] h-9 bg-white dark:bg-gray-950 border-gray-200">
              <SelectValue placeholder="All Partners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-partners">All Partners</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-subs">
            <SelectTrigger className="w-[150px] h-9 bg-white dark:bg-gray-950 border-gray-200">
              <SelectValue placeholder="All Subcontractors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-subs">All Subcontractors</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="any-status">
            <SelectTrigger className="w-[120px] h-9 bg-white dark:bg-gray-950 border-gray-200">
              <SelectValue placeholder="Any Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any-status">Any Status</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-dates">
            <SelectTrigger className="w-[110px] h-9 bg-white dark:bg-gray-950 border-gray-200">
              <SelectValue placeholder="All Dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-dates">All Dates</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full md:w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-8 h-9 bg-white dark:bg-gray-950 border-gray-200"
            />
          </div>
        </div>

        <div>
          <Button className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusIconWrapper /> Reset Filters
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground font-medium">
        {stats.total} Archived Projects (Total)
      </div>

      {/* Main Table */}
      <div className="rounded-md border bg-white dark:bg-gray-950">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Project & Address
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Project ID
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Subcontractor
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Abnahme Date
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
            {paginatedArchive.map((item, i) => {
              const isExpanded = expandedRows.has(i);
              return (
                <Fragment key={i}>
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
                    <TableCell className="font-mono text-sm">
                      {item.id || "N/A"}
                    </TableCell>
                    <TableCell>{item.sub}</TableCell>
                    <TableCell className="text-sm">
                      {item.abnahme || item.start}
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
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Column 1: Project & Customer Details */}
                          <div className="space-y-4 h-full flex flex-col">
                            <div className="flex flex-col h-full">
                              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                <FileText className="h-3 w-3" /> Customer Details
                              </h4>
                              <div className="bg-white dark:bg-gray-950 rounded-lg border p-3 text-sm space-y-2 shadow-sm flex-1 flex flex-col">
                                <div className="grid grid-cols-[100px_1fr] gap-2 shrink-0">
                                  <span className="text-muted-foreground text-xs">Customer No:</span>
                                  <span className="font-medium">{item.customerNumber || "N/A"}</span>

                                  <span className="text-muted-foreground text-xs">Phone:</span>
                                  <span className="font-medium">{item.customerPhone || "N/A"}</span>

                                  <span className="text-muted-foreground text-xs">Email:</span>
                                  <span className="font-medium truncate" title={item.customerEmail}>
                                    {item.customerEmail || "N/A"}
                                  </span>

                                  <span className="text-muted-foreground text-xs">Location:</span>
                                  <span className="font-medium">{item.address}</span>
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
                                <span className="text-muted-foreground text-xs">Contractor:</span>
                                <span className="font-medium">{item.contractor || "N/A"}</span>

                                <span className="text-muted-foreground text-xs">Partner:</span>
                                <span className="font-medium">{item.partner || "N/A"}</span>

                                <span className="text-muted-foreground text-xs">Mediator:</span>
                                <span className="font-medium">{item.mediator || "N/A"}</span>
                              </div>
                            </div>

                            {item.workers && item.workers.length > 0 ? (
                              <div className="rounded-md border bg-white dark:bg-gray-950 overflow-hidden shadow-sm h-full">
                                <Table>
                                  <TableHeader className="bg-gray-50/50">
                                    <TableRow className="h-8 hover:bg-transparent">
                                      <TableHead className="h-8 text-[10px] font-semibold">Name</TableHead>
                                      <TableHead className="h-8 text-[10px] font-semibold text-center">Cert</TableHead>
                                      <TableHead className="h-8 text-[10px] font-semibold text-center">A1</TableHead>
                                      <TableHead className="h-8 text-[10px] font-semibold text-center">Success</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {item.workers.map((workerId: string) => (
                                      <TableRow key={workerId} className="h-8 hover:bg-transparent border-0">
                                        <TableCell className="py-1">
                                          <div className="flex items-center gap-2">
                                            <Avatar className="h-5 w-5 border">
                                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${workerId}`} />
                                              <AvatarFallback className="text-[9px]">{workerId.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs font-medium truncate max-w-[100px]">
                                              Worker {workerId}
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="py-1 text-xs text-muted-foreground text-center">Yes</TableCell>
                                        <TableCell className="py-1 text-xs text-muted-foreground text-center">Yes</TableCell>
                                        <TableCell className="py-1 text-center text-xs text-green-600 font-medium">100%</TableCell>
                                      </TableRow>
                                    ))}
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
                                <span className="font-medium text-gray-700 dark:text-gray-300">Estimated Max Hours:</span>
                                <span className="font-mono font-semibold">{item.estimatedHours || "N/A"}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-gray-700 dark:text-gray-300">Actual Hours:</span>
                                <span className="font-mono font-semibold">{item.actualHours || "0"}</span>
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
                                    <span className="font-medium text-muted-foreground">Indoor Units</span>
                                    <Badge variant="secondary" className="text-sm font-bold px-2.5 py-0.5">
                                      {item.indoorUnits || 0}
                                    </Badge>
                                  </div>

                                  {/* Work Types */}
                                  <div className="space-y-2">
                                    <div className="font-semibold text-[10px] uppercase text-muted-foreground border-b pb-1">
                                      Base Installation
                                    </div>
                                    {item.selectedWorkTypes && item.selectedWorkTypes.length > 0 ? (
                                      <div className="grid gap-2">
                                        {item.selectedWorkTypes.map((type: string) => {
                                          const units = item.indoorUnits || 0;
                                          const unitCosts = PRICING_MATRIX.baseCosts[units] || {};
                                          const cost = (unitCosts as any)[type] || 0;

                                          return (
                                            <div key={type} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start w-full border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0">
                                              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium wrap-break-word leading-tight whitespace-pre-line">
                                                {WORK_TYPE_LABELS[type] || type}
                                              </span>
                                              <span className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                € {cost}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <p className="text-muted-foreground italic text-[11px] py-1">
                                        No specific work types selected.
                                      </p>
                                    )}
                                  </div>

                                  {/* Additional Services */}
                                  {item.selectedAdditionalServices && item.selectedAdditionalServices.length > 0 && (
                                    <div className="space-y-2 mt-4">
                                      <div className="font-semibold text-[10px] uppercase text-muted-foreground border-b pb-1 mb-2">
                                        Extras
                                      </div>
                                      <div className="grid gap-2">
                                        {item.selectedAdditionalServices.map((serviceId: string) => {
                                          const service = ADDITIONAL_SERVICES.find((s) => s.id === serviceId);
                                          return (
                                            <div key={serviceId} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start w-full border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0">
                                              <span className="text-xs text-gray-700 dark:text-gray-300 font-medium wrap-break-word leading-tight">
                                                {service?.label || serviceId}
                                              </span>
                                              <span className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                € {service?.price || 0}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="pt-4 mt-4 border-t">
                                  <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                    <span className="font-bold text-blue-900 dark:text-blue-100">Total Amount</span>
                                    <span className="font-mono font-bold text-lg text-blue-700 dark:text-blue-300">
                                      {item.amount || "0"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Additional Work Section (Archived - Read Only) */}
                        {item.additionalWorks && item.additionalWorks.length > 0 && (
                          <div className="px-4 pb-4">
                            <div className="pt-6 mt-6 border-t border-dashed">
                              <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                <PlusCircle className="h-3 w-3" /> Additional Work (Archived)
                              </h4>

                              <div className="bg-white dark:bg-gray-950 rounded-lg border p-4 shadow-sm space-y-4">
                                <div className="space-y-2">
                                  <div className="grid grid-cols-[1fr_120px_180px_100px] gap-4 text-xs font-medium text-muted-foreground pb-2 border-b px-2">
                                    <span>Description</span>
                                    <span className="text-right">Price</span>
                                    <span className="text-center">Receipt</span>
                                    <span></span>
                                  </div>
                                  {item.additionalWorks.map((work: any, wIndex: number) => (
                                    <div key={wIndex} className="grid grid-cols-[1fr_120px_180px_100px] gap-4 text-sm items-center px-2">
                                      <span className="font-medium truncate">{work.description}</span>
                                      <span className="font-mono text-right text-gray-600">
                                        € {work.price.toFixed(2)}
                                      </span>
                                      <div className="flex justify-center">
                                        {work.receiptName ? (
                                          <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200 truncate max-w-full">
                                            <FileText className="h-3 w-3 mr-1" /> {work.receiptName}
                                          </Badge>
                                        ) : (
                                          <span className="text-xs text-muted-foreground italic">No receipt</span>
                                        )}
                                      </div>
                                      <div></div>
                                    </div>
                                  ))}
                                  <div className="flex justify-between items-center pt-2 mt-2 border-t px-2">
                                    <span className="text-xs font-bold">Total Additional Cost</span>
                                    <span className="font-mono font-bold text-blue-600">
                                      €{" "}
                                      {item.additionalWorks
                                        .reduce((sum: number, w: any) => sum + (w.price || 0), 0)
                                        .toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            {archivedProjects.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}{" "}
            to {Math.min(currentPage * itemsPerPage, archivedProjects.length)}{" "}
            of {stats.total} entries
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-primary-foreground bg-primary hover:bg-primary/90 border-primary"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-1 h-3 w-3" /> Previous
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Simple sliding logic
              let p = i + 1;
              if (totalPages > 5 && currentPage > 3) p = currentPage - 2 + i;
              if (p > totalPages) return null;

              return (
                <Button
                  key={p}
                  variant={currentPage === p ? "ghost" : "ghost"}
                  size="sm"
                  className={`h-8 w-8 p-0 ${currentPage === p ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-primary-foreground bg-primary hover:bg-primary/90 border-primary"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Next Page <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
            <Button variant="outline" size="sm" className="h-8">
              Download CSV <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      {/* Complaint Dialog */}
      <Dialog open={complaintOpen} onOpenChange={setComplaintOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle>File a Complaint</DialogTitle>
            <DialogDescription>
              Create a formal defect report for{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedProjectForComplaint?.project}
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Defect Category</Label>
                <Select
                  value={complaintForm.category}
                  onValueChange={(val) =>
                    setComplaintForm({ ...complaintForm, category: val })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Defect</SelectItem>
                    <SelectItem value="structural">
                      Structural / Shell
                    </SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="plumbing">Plumbing / HVAC</SelectItem>
                    <SelectItem value="finishing">Finishing / Paint</SelectItem>
                    <SelectItem value="safety">Safety Hazard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Severity / Priority</Label>
                <Select
                  value={complaintForm.priority}
                  onValueChange={(val) =>
                    setComplaintForm({ ...complaintForm, priority: val })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Cosmetic)</SelectItem>
                    <SelectItem value="medium">Medium (Standard)</SelectItem>
                    <SelectItem value="high">
                      High (Functional Issue)
                    </SelectItem>
                    <SelectItem value="critical">
                      Critical (Immediate Action)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Defect Description</Label>
              <textarea
                id="description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe the defect in detail..."
                value={complaintForm.description}
                onChange={(e) =>
                  setComplaintForm({
                    ...complaintForm,
                    description: e.target.value,
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Exact Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. 2nd Floor, Room 204"
                  value={complaintForm.location}
                  onChange={(e) =>
                    setComplaintForm({
                      ...complaintForm,
                      location: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deadline">Rectification Deadline</Label>
                <Input
                  id="deadline"
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

            <div className="grid gap-2">
              <Label htmlFor="responsible">Responsible Party</Label>
              <Select
                value={complaintForm.responsible}
                onValueChange={(val) =>
                  setComplaintForm({ ...complaintForm, responsible: val })
                }
              >
                <SelectTrigger id="responsible">
                  <SelectValue placeholder="Select Party" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sub">
                    Subcontractor ({selectedProjectForComplaint?.sub})
                  </SelectItem>
                  <SelectItem value="partner">
                    Partner ({selectedProjectForComplaint?.partner})
                  </SelectItem>
                  <SelectItem value="contractor">
                    Main Contractor ({selectedProjectForComplaint?.contractor})
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Who is liable for fixing this defect?
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cost">Est. Cost Impact (€)</Label>
              <Input
                id="cost"
                type="number"
                placeholder="0.00"
                value={complaintForm.costEstimate}
                onChange={(e) =>
                  setComplaintForm({
                    ...complaintForm,
                    costEstimate: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setComplaintOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitComplaint}
              className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
              disabled={!complaintForm.description}
            >
              Submit Complaint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper for the Plus icon in Reset Filters button
function PlusIconWrapper() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mr-2 h-3 w-3"
    >
      <path
        d="M7.49991 0.875C3.84076 0.875 0.874908 3.84085 0.874908 7.5C0.874908 11.1591 3.84076 14.125 7.49991 14.125C11.1591 14.125 14.1249 11.1591 14.1249 7.5C14.1249 3.84085 11.1591 0.875 7.49991 0.875ZM1.99991 7.5C1.99991 4.46218 4.46209 1.99999 7.49991 1.99999C10.5377 1.99999 12.9999 4.46218 12.9999 7.5C12.9999 10.5378 10.5377 12.9999 7.49991 12.9999C4.46209 12.9999 1.99991 10.5378 1.99991 7.5ZM10.5 7.5C10.5 7.77614 10.2761 8 10 8H8V10C8 10.2761 7.77614 10.5 7.5 10.5C7.22386 10.5 7 10.2761 7 10V8H5C4.72386 8 4.5 7.77614 4.5 7.5C4.5 7.22386 4.72386 7 5 7H7V5C7 4.72386 7.22386 4.5 7.5 4.5C7.77614 4.5 8 4.72386 8 5V7H10C10.2761 7 10.5 7.22386 10.5 7.5Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      ></path>
    </svg>
  );
}
