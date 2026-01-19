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
import { Input } from "@/components/ui/input";
import {
  Archive,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";

export default function ArchivePage() {
  const [archivedProjects, setArchivedProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    inWarranty: 0,
    expiringMsg: 0,
    expired: 0,
  });

  useEffect(() => {
    // Load data from localStorage
    // We expect two sources: 'prostruktion_archive' (specific archive)
    // AND 'prostruktion_invoices' (financial entries which user said "Every project that is invoiced... also goes into archive")
    // Note: The user said "Every project that is invoiced in projects tab also goes into archive for reference."
    // So we should look at 'prostruktion_archive' primarily, which we will populate from the Projects page.

    // For now, let's load what we will implemented in Projects page as 'prostruktion_archive'
    // Also including some mock data for display matching the image

    const storedArchive = localStorage.getItem("prostruktion_archive");
    let initialData = storedArchive ? JSON.parse(storedArchive) : [];

    // Mock initial data removed - User requested clean slate
    setArchivedProjects(initialData);
    setStats({
      total: initialData.length,
      inWarranty: initialData.filter((p: any) => p.status === "In Warranty")
        .length,
      expiringMsg: initialData.filter((p: any) => p.status === "Expiring")
        .length,
      expired: initialData.filter(
        (p: any) => p.status !== "In Warranty" && p.status !== "Expiring",
      ).length,
    });
  }, []);

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
        <Card className="bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-muted-foreground">
              In Warranty
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-700">
                {stats.inWarranty}
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-400 opacity-50" />
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
              <span className="text-[10px] text-muted-foreground">(6-12m)</span>
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
        <Card className="bg-orange-50/50 border-orange-100 dark:bg-orange-900/10 dark:border-orange-900">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="bg-orange-200 rounded-full p-0.5">
              <AlertTriangle className="h-3 w-3 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Expired
            </span>{" "}
            {/* Label mismatch in image '62'? using Expired for logic*/}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-orange-700">
                {stats.expired}
              </div>
              <div className="h-3 w-4 border-2 border-orange-300 rounded-sm"></div>
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
          <Button className="h-9 bg-blue-600 hover:bg-blue-700">
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
          <TableHeader className="bg-gray-50/80 dark:bg-gray-900/50">
            <TableRow>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Project
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
                Warranty End Date
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Warranty
              </TableHead>
              <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {archivedProjects.map((item, i) => (
              <TableRow
                key={i}
                className="group hover:bg-muted/50 border-gray-100"
              >
                <TableCell className="font-medium align-top py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground text-sm">
                      {item.project}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.address}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="align-top py-4 text-sm">
                  {item.contractor}
                </TableCell>
                <TableCell className="align-top py-4 text-sm">
                  {item.partner}
                </TableCell>
                <TableCell className="align-top py-4 text-sm">
                  {item.mediator || "-"}
                </TableCell>
                <TableCell className="align-top py-4 text-sm">
                  {item.sub}
                </TableCell>
                <TableCell className="align-top py-4 text-sm text-muted-foreground">
                  {item.abnahme}
                </TableCell>
                <TableCell className="align-top py-4 text-sm text-muted-foreground">
                  {item.warrantyEnd}
                </TableCell>
                <TableCell className="align-top py-4">
                  <Badge
                    className={`${item.statusColor} font-normal border-0 text-[10px] px-2 py-0.5 rounded capitalize whitespace-nowrap`}
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right align-top py-4">
                  <div className="flex justify-end">
                    {item.action === "Create Complaint" ? (
                      <Button
                        size="sm"
                        className="h-7 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2"
                      >
                        {item.action}
                      </Button>
                    ) : item.action === "Expired" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2 border-gray-200"
                      >
                        {item.action}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2 border border-gray-200"
                      >
                        {item.action}
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
            Showing 1 to {archivedProjects.length} of {stats.total} entries
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-blue-600 bg-blue-50 border-blue-100"
            >
              <ChevronLeft className="mr-1 h-3 w-3" /> Previous
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 bg-blue-600 text-white"
              >
                1
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                2
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                3
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-blue-600 bg-blue-50 border-blue-100"
            >
              Next Page <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-muted-foreground"
            >
              10 / page <ChevronRight className="ml-1 h-3 w-3 rotate-90" />
            </Button>
            <Button variant="outline" size="sm" className="h-8">
              Download CSV <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
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
