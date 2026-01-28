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
} from "lucide-react";
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
                Abnahme Date
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Status
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Amount (€)
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
                    <TableCell>{item.contractor}</TableCell>
                    <TableCell>{item.partner}</TableCell>
                    <TableCell>{item.mediator || "-"}</TableCell>
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
                    <TableCell className="font-medium">{item.amount}</TableCell>
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
                    <TableRow className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200">
                      <TableCell colSpan={10}>
                        <div className="flex items-center gap-8 py-2 px-4 text-sm">
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground block">
                              Abnahme Date
                            </span>
                            <span className="font-medium">
                              {item.abnahme || "-"}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground block">
                              Warranty End
                            </span>
                            <span className="font-medium">
                              {item.warrantyEnd || "-"}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground block">
                              Status
                            </span>
                            <Badge
                              className={`${item.statusColor} font-normal border-0 text-[10px] px-2 py-0.5 rounded capitalize whitespace-nowrap`}
                            >
                              {item.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-4 border-t pt-4">
                          <h4 className="font-semibold text-sm mb-3">
                            Assigned Workers
                          </h4>
                          {(item.workers || ["w1", "w2"]).length > 0 ? (
                            <div className="rounded-md border bg-white dark:bg-gray-950 overflow-hidden">
                              <Table>
                                <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
                                  <TableRow>
                                    <TableHead className="font-semibold text-xs py-2 h-9">
                                      Name
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs py-2 h-9">
                                      Role
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs py-2 h-9">
                                      A1
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs py-2 h-9">
                                      Cooling
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs text-center py-2 h-9">
                                      Complaints
                                    </TableHead>
                                    <TableHead className="font-semibold text-xs text-center py-2 h-9">
                                      Success Rate
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(item.workers || ["w1", "w2"]).map(
                                    (workerId: string) => {
                                      // Worker details logic removed as DUMMY_WORKERS are cleaned up.
                                      // For now, we'll just display the worker ID as a placeholder.
                                      // In a real application, you would fetch worker details from an API or a different data source.
                                      return (
                                        <TableRow
                                          key={workerId}
                                          className="hover:bg-muted/50"
                                        >
                                          <TableCell className="py-2">
                                            <div className="flex items-center gap-3">
                                              <Avatar className="h-8 w-8 border bg-gray-100">
                                                <AvatarImage
                                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${workerId}`}
                                                />
                                                <AvatarFallback>
                                                  {workerId.charAt(0)}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex flex-col">
                                                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                  Worker {workerId}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                  Role N/A
                                                </span>
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell className="py-2 text-xs">
                                            N/A
                                          </TableCell>
                                          <TableCell className="py-2">
                                            <div className="flex items-center h-5 rounded overflow-hidden border border-gray-200 w-fit">
                                              <span className="bg-yellow-400 text-yellow-950 text-[9px] font-bold px-1 h-full flex items-center justify-center">
                                                A1
                                              </span>
                                              <span className="bg-yellow-300/50 text-yellow-700 px-1 h-full flex items-center justify-center border-l border-yellow-200">
                                                <RotateCw className="h-3 w-3" />
                                              </span>
                                              <span
                                                className={`h-full flex items-center gap-1 px-1.5 text-[10px] font-medium bg-gray-100 text-gray-700`}
                                              >
                                                Unknown
                                              </span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="py-2">
                                            <Badge
                                              variant="outline"
                                              className={`border-0 gap-1 pl-1 pr-2 py-0 text-[10px] h-5 font-normal bg-gray-50 text-gray-700 ring-1 ring-gray-200`}
                                            >
                                              <CheckCircle2
                                                className={`h-3 w-3 fill-gray-200 text-gray-600`}
                                              />
                                              Unknown
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="py-2 text-center">
                                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                              <Users className="h-3 w-3" /> 0
                                            </div>
                                          </TableCell>
                                          <TableCell className="py-2 text-center">
                                            <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100">
                                              0%
                                            </span>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    },
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No workers assigned.
                            </p>
                          )}
                        </div>
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
