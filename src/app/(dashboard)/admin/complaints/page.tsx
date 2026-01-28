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
  Plus,
  Search,
  MoreHorizontal,
  FileWarning,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function ComplaintsPage() {
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for complaints
  const [complaints, setComplaints] = useState<any[]>([]);
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);

  useEffect(() => {
    // Initial Mock Data
    // Initial Mock Data Removed
    const initialComplaints: any[] = [];

    const storedComplaints = JSON.parse(
      localStorage.getItem("prostruktion_complaints") || "[]",
    );
    // Combine stored first (newest)
    setComplaints([...storedComplaints, ...initialComplaints]);

    // Load available projects
    const storedProjects = localStorage.getItem("prostruktion_projects_v1");
    if (storedProjects) {
      try {
        setAvailableProjects(JSON.parse(storedProjects));
      } catch (e) {
        console.error("Error loading projects", e);
      }
    }
  }, []);

  const getWarrantyBadge = (status: string) => {
    if (status === "In Warranty") {
      return "bg-orange-100 text-orange-700 hover:bg-orange-200 border-0";
    }
    return "bg-green-100 text-green-700 hover:bg-green-200 border-0";
  };

  const getRepairBadge = (status: string) => {
    switch (status) {
      case "SUB":
        return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-0";
      case "Partner":
        return "bg-purple-100 text-purple-700 hover:bg-purple-200 border-0";
      case "Contract":
        return "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0";
      case "Open":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-0";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-200 border-0";
    }
  };

  const getStatusDot = (color: string) => {
    const map: any = {
      green: "bg-green-500",
      yellow: "bg-yellow-400",
      red: "bg-red-500",
    };
    return (
      <div className={`h-3 w-3 rounded-full ${map[color] || "bg-gray-300"}`} />
    );
  };

  // Pagination Logic
  const totalItems = complaints.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedComplaints = complaints.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Complaints
        </h2>
      </div>

      <Card className="bg-white dark:bg-gray-950 border-none shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-indigo-50/50 dark:bg-indigo-900/10">
              <TableRow>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Project
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Complaint ID
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Abnahme Date
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Warranty Status
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Contractor
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Partner
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Subcon-tractor
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Repair By
                </TableHead>
                <TableHead className="font-semibold text-center text-gray-700 dark:text-gray-300">
                  #
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedComplaints.map((item, i) => (
                <TableRow
                  key={i}
                  className="group hover:bg-muted/50 border-b border-gray-100 dark:border-gray-800"
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">
                        {item.project}
                      </span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {item.address}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-gray-600 dark:text-gray-400">
                    #{item.id}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {item.abnahmeDate}
                  </TableCell>
                  <TableCell>
                    <Badge className={getWarrantyBadge(item.warrantyStatus)}>
                      {item.warrantyStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{item.contractor}</TableCell>
                  <TableCell className="text-sm">{item.partner}</TableCell>
                  <TableCell className="text-sm">
                    {item.subcontractor}
                  </TableCell>
                  <TableCell>
                    <Badge className={getRepairBadge(item.repairBy)}>
                      {item.repairBy}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {item.count}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusDot(item.status1)}
                      {getStatusDot(item.status2)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between p-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
            <div className="text-sm text-muted-foreground">
              Showing{" "}
              {totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              entries
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p = i + 1;
                if (totalPages > 5 && currentPage > 3) p = currentPage - 2 + i;
                if (p > totalPages) return null;
                return (
                  <Button
                    key={p}
                    variant={currentPage === p ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 p-0 ${currentPage === p ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(val) => {
                  setItemsPerPage(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={itemsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">/ page</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
