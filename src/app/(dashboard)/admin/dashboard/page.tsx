"use client";

import { useEffect, useState } from "react";
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
  ChevronRight,
  Clock,
  Euro,
  Flame,
  AlertTriangle,
  FileText,
  Coins,
  History,
  Building2,
} from "lucide-react";

export default function AdminDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    activeValue: 0,
    abnahme: 0,
    invoicing: 0,
    invoicingValue: 0,
    totalValue: 0,
  });

  useEffect(() => {
    // Load projects from LocalStorage to make dashboard dynamic based on user data
    const storedProjects = localStorage.getItem("prostruktion_projects");
    if (storedProjects) {
      const parsed = JSON.parse(storedProjects);
      setProjects(parsed);

      // Calculate Stats
      const active = parsed.filter(
        (p: any) => p.status === "In Progress" || p.status === "Active",
      );
      const abnahme = parsed.filter((p: any) => p.status === "Abnahme");
      const invoicing = parsed.filter(
        (p: any) => p.status === "Invoicing" || p.status === "Ready",
      );

      const getValue = (list: any[]) =>
        list.reduce((acc, curr) => {
          const val = parseFloat(curr.amount.replace(/[^0-9.-]+/g, "")) || 0;
          return acc + val;
        }, 0);

      setStats({
        active: active.length,
        activeValue: getValue(active),
        abnahme: abnahme.length,
        invoicing: invoicing.length,
        invoicingValue: getValue(invoicing),
        totalValue: getValue(parsed),
      });
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Summary Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Cash on Hand */}
        <Card className="bg-white dark:bg-gray-950">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Euro className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Project Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              € {stats.totalValue.toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Across all phases
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Monthly Burn Rate */}
        <Card className="bg-white dark:bg-gray-950">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
              <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Est. Monthly Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-red-600">€ 0</span>
              <span className="text-muted-foreground text-sm">/ month</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Runway */}
        <Card className="bg-white dark:bg-gray-950">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary dark:bg-secondary/50">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Project Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-secondary dark:text-gray-50">
                {projects.length}
              </span>
              <span className="text-muted-foreground text-sm">
                Total Projects
              </span>
            </div>
            <div className="mt-2">
              <Badge
                variant="default" // Using default but styling it green
                className="bg-green-100 text-green-700 hover:bg-green-200 border-0 rounded-sm px-2 font-normal"
              >
                Stable
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Projects in Payment */}
        <Card className="bg-white dark:bg-gray-950">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Invoicing Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-500">
              € {stats.invoicingValue.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <History className="h-3 w-3" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {stats.invoicing} Ready for Invoice
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Active Projects */}
        <div className="space-y-6">
          {/* Active Projects Stats */}
          <Card className="bg-white dark:bg-gray-950">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-muted-foreground">
                Project Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 divide-x">
                <div className="px-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-secondary">
                      {stats.active}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      In Progress
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-secondary">
                    € {stats.activeValue.toLocaleString()}
                  </div>
                </div>
                <div className="px-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-primary">
                      {stats.abnahme}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Abnahme
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Current
                  </div>
                </div>
                <div className="px-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-yellow-600">
                      {stats.invoicing}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Invoicing
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    € {stats.invoicingValue.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Projects List Table */}
          <Card className="bg-white dark:bg-gray-950 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-muted-foreground">
                  Recent Projects
                </CardTitle>
                <div className="text-2xl font-bold mt-1">
                  {projects.length}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    Total Projects
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-8">
                View All <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {projects.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No projects found. Add a project to see data here.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                    <TableRow>
                      <TableHead className="w-[40%]">Project</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.slice(0, 5).map((project: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="py-3">
                          <div className="font-medium text-sm flex items-center gap-2">
                            <div className="h-6 w-6 bg-secondary rounded flex items-center justify-center text-primary">
                              <Building2 className="h-3 w-3" />
                            </div>
                            <div>
                              <div>{project.project}</div>
                              <div className="text-xs text-muted-foreground">
                                {project.address}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-sm text-muted-foreground">
                          {project.start}
                        </TableCell>
                        <TableCell className="py-3 text-right font-medium">
                          {project.amount}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Complaints & Docs */}
        <div className="space-y-6">
          {/* Reklamacije (Complaints) */}
          <Card className="bg-white dark:bg-gray-950 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Reklamacije (Complaints)
              </CardTitle>
              <Button variant="outline" size="sm" className="h-8">
                View All <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y">
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No recent complaints.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Expiring Soon */}
          <Card className="bg-white dark:bg-gray-950 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                Documents Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y">
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No documents expiring soon.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
