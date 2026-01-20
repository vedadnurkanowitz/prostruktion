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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [trendPeriod, setTrendPeriod] = useState("monthly");

  const trendData: Record<string, { labels: string[]; data: number[] }> = {
    weekly: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      data: [15, 25, 20, 35, 30, 45, 40],
    },
    monthly: {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      data: [35, 45, 30, 60, 55, 70, 50, 65, 80, 55, 45, 60],
    },
    yearly: {
      labels: ["2021", "2022", "2023", "2024", "2025"],
      data: [40, 55, 45, 70, 65],
    },
  };

  const currentTrend = trendData[trendPeriod];

  // Helper to generate SVG path
  const getPoints = (data: number[]) => {
    const max = Math.max(...data, 100); // Ensure some headroom
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (val / max) * 100 * 0.8; // Use 80% of height max
      return `${x},${y}`;
    });
    return points;
  };

  const points = getPoints(currentTrend.data);
  const pathD = `M${points.join(" L")}`;
  const areaD = `${pathD} L100,100 L0,100 Z`;

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
        {/* Card 1: Money on hand */}
        <Card className="bg-white dark:bg-gray-950">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Euro className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Money on hand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              € 0
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Available liquidity
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Monthly burn rate */}
        <Card className="bg-white dark:bg-gray-950">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
              <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly burn rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-red-600">€ 0</span>
              <span className="text-muted-foreground text-sm">/ month</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Awaiting payment */}
        <Card className="bg-white dark:bg-gray-950">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Awaiting payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              € 0
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              0 Invoices pending
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Total overdue */}
        <Card className="bg-white dark:bg-gray-950">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              € 0
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <History className="h-3 w-3" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                0 Overdue invoices
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash Trend Statistics */}
      <Card className="bg-white dark:bg-gray-950">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-muted-foreground">
              Cash Trend Statistics
            </CardTitle>
            <Tabs
              value={trendPeriod}
              onValueChange={setTrendPeriod}
              className="w-[400px]"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="yearly">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative h-[250px] w-full pt-4 pb-2">
            {/* SVG Chart */}
            <svg
              className="absolute inset-0 h-full w-full overflow-visible text-primary"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="currentColor"
                    stopOpacity="0.2"
                  />
                  <stop
                    offset="100%"
                    stopColor="currentColor"
                    stopOpacity="0"
                  />
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#line-gradient)" />
              <path
                d={pathD}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Interactive Overlay & Tooltips */}
            {currentTrend.data.map((h, i) => {
              const max = Math.max(...currentTrend.data, 100);
              const heightPercent = (h / max) * 100 * 0.8; // Match SVG logic
              return (
                <div
                  key={i}
                  className="absolute h-full w-10 -ml-5 hover:bg-gray-100/5 dark:hover:bg-white/5 group bg-transparent z-10 cursor-pointer transition-colors"
                  style={{
                    left: `${(i / (currentTrend.data.length - 1)) * 100}%`,
                  }}
                >
                  {/* Dot */}
                  <div
                    className="absolute w-3 h-3 bg-primary rounded-full ring-4 ring-white dark:ring-gray-950 transition-all scale-0 group-hover:scale-100"
                    style={{
                      top: `${100 - heightPercent}%`,
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap z-20 transition-opacity pointer-events-none">
                    € {(h * 1250).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between px-2 text-xs text-muted-foreground mt-2">
            {currentTrend.labels.map((label, i) => (
              <span key={i}>{label}</span>
            ))}
          </div>
        </CardContent>
      </Card>

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
                      Active
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

          {/* Subcontractor Success Rate */}
          <Card className="bg-white dark:bg-gray-950 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-semibold text-muted-foreground">
                  Subcontractor Success Rate
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  Top performing partners
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-8">
                View All <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
                  <TableRow>
                    <TableHead className="w-[40%]">Subcontractor</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead className="text-right">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "Elektro-Hofmann GmbH", rate: 98, rating: "A+" },
                    { name: "Schmidt Bauunternehmung", rate: 92, rating: "A" },
                    { name: "Müller Sanitärtechnik", rate: 88, rating: "B+" },
                    { name: "Fischer Bedachungen", rate: 85, rating: "B" },
                    { name: "Weber Trockenbau", rate: 78, rating: "C+" },
                  ].map((sub, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-3">
                        <div className="font-medium text-sm flex items-center gap-2">
                          <div className="h-6 w-6 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <span className="text-xs font-bold">
                              {sub.name.charAt(0)}
                            </span>
                          </div>
                          <div>{sub.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${sub.rate}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {sub.rate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        <Badge
                          variant="secondary"
                          className={`${
                            sub.rating.startsWith("A")
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : sub.rating.startsWith("B")
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {sub.rating}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Complaints & Docs */}
        <div className="space-y-6">
          {/* Reklamacije (Complaints) */}
          <Card className="bg-white dark:bg-gray-950 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Open Complaints
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
