"use client";

import { useState } from "react";
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
  const [createOpen, setCreateOpen] = useState(false);

  // Mock Data matching the reference image style
  const complaints = [
    {
      id: "45918",
      project: "EnerPlan Headquarters",
      address: "Höhenbergallee 19 / Mündea 14",
      abnahmeDate: "Sep 12, 2022",
      warrantyStatus: "In Warranty",
      contractor: "Solbeth AG",
      partner: "Nestler",
      subcontractor: "Nestler Immobilien",
      repairBy: "SUB",
      count: 0,
      status1: "green",
      status2: "yellow",
    },
    {
      id: "45912",
      project: "Neubau Wohnkomplex",
      address: "Branzerstraße 26 / Grinted",
      abnahmeDate: "Oct 23, 2023",
      warrantyStatus: "In Warranty",
      contractor: "GT Gruppe",
      partner: "GT Guppe",
      subcontractor: "Hüber Mont GmbH",
      repairBy: "Partner",
      count: 1,
      status1: "green",
      status2: "yellow",
    },
    {
      id: "45792",
      project: "Neubau Wohnkomplex",
      address: "Branzerstraße 26 / Grinted",
      abnahmeDate: "Oct 23, 2023",
      warrantyStatus: "In Warranty",
      contractor: "Beltex GmbH",
      partner: "Lahlmach Group",
      subcontractor: "Hüber Mont GmbH",
      repairBy: "Partner",
      count: 1,
      status1: "green",
      status2: "yellow",
    },
    {
      id: "45776",
      project: "Neubau Wohnkomplex",
      address: "Branzerstraße 26 / Grinted",
      abnahmeDate: "Aug 25, 2023",
      warrantyStatus: "In Warranty",
      contractor: "Beltex GmbH",
      partner: "Beltex GmbH",
      subcontractor: "Hüber Mont GmbH",
      repairBy: "Contract",
      count: 1,
      status1: "green",
      status2: "yellow",
    },
    {
      id: "45718",
      project: "Hartmann-Krause Logistikzentren",
      address: "Am Zander 10 / Vogelvaj",
      abnahmeDate: "May 11, 2023",
      warrantyStatus: "Out of Warranty",
      contractor: "GT Gruppe",
      partner: "Lahmach Group",
      subcontractor: "GT Gruppe",
      repairBy: "SUB",
      count: 0,
      status1: "red",
      status2: "yellow",
    },
    {
      id: "45636",
      project: "Sanierungsprojekt Weidkammer 21",
      address: "Lindenstraße 59 / Asaio",
      abnahmeDate: "Jul 12, 2023",
      warrantyStatus: "In Warranty",
      contractor: "Lahmpach Group",
      partner: "Lahhoach",
      subcontractor: "Hüber Mont GmbH",
      repairBy: "Partner",
      count: 1,
      status1: "green",
      status2: "yellow",
    },
    {
      id: "45636",
      project: "Neubau Wohnprojekt",
      address: "Lindenstraße 59 / Lindenstraße C1",
      abnahmeDate: "Jul 29, 2024",
      warrantyStatus: "Out of Warranty",
      contractor: "Hüber Mont GmbH",
      partner: "Contractor",
      subcontractor: "Hüber Mont GmbH",
      repairBy: "Contract", // "Contract" in image truncated probably Contractor
      count: 0,
      status1: "red",
      status2: "yellow",
    },
    {
      id: "45636",
      project: "Neubau Wohnprojekt",
      address: "Lindenstraße 59 / Lindenstraße 69",
      abnahmeDate: "Mar 28, 2024",
      warrantyStatus: "In Warranty",
      contractor: "Hotz & Bauer GmbH",
      partner: "Partner",
      subcontractor: "Buig & Bauer GmbH",
      repairBy: "Open",
      count: 1,
      status1: "green",
      status2: "green",
    },
    {
      id: "45617",
      project: "Neubau Wohnprojekt",
      address: "Lindenstraße 59 / Lindenstraße 69",
      abnahmeDate: "Mar 8, 2023",
      warrantyStatus: "In Warranty",
      contractor: "Hotz & Bauer GmbH",
      partner: "Contractor",
      subcontractor: "Contractor",
      repairBy: "SUB",
      count: 0,
      status1: "yellow",
      status2: "green",
    },
  ];

  const getWarrantyBadge = (status: string) => {
    if (status === "In Warranty") {
      return "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0";
    }
    return "bg-red-100 text-red-700 hover:bg-red-200 border-0";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Complaints
        </h2>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Complaint
        </Button>
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
              {complaints.map((item, i) => (
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
            <Button variant="ghost" size="icon" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-4 text-xs">
              View all
            </Button>
            <Button variant="ghost" size="icon">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Complaint</DialogTitle>
            <DialogDescription>
              Record a new complaint for a project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="project" className="text-sm font-medium">
                Project
              </label>
              <Input id="project" placeholder="Select Project" />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Input id="description" placeholder="Issue details..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setCreateOpen(false)}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
