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
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState({
    active: 0,
    activeValue: 0,
    abnahme: 0,
    abnahmeValue: 0,
    invoicing: 0, // Now represents 'For Invoice'
    invoicingValue: 0,
    totalValue: 0,
    cashOnHand: 0,
    monthlyBurnRate: 0,
    awaitingPayment: 0,
    awaitingPaymentCount: 0,
    totalOverdue: 0,
    totalOverdueCount: 0,
    openComplaints: 0,
    scheduledComplaints: 0,
    rescheduledComplaints: 0,
    expiringDocs: [] as any[],
  });
  const [trendPeriod, setTrendPeriod] = useState("monthly");

  const [chartData, setChartData] = useState<
    Record<string, { labels: string[]; data: number[] }>
  >({
    weekly: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      data: [0, 0, 0, 0, 0, 0, 0],
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
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
    yearly: {
      labels: ["2021", "2022", "2023", "2024", "2025"],
      data: [0, 0, 0, 0, 0],
    },
  });

  const currentTrend = chartData[trendPeriod];

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
    // Calculate Cash on Hand (Financials Logic)
    // 1. Get Received Income
    const storedGeneratedInvoices = localStorage.getItem(
      "prostruktion_generated_invoices",
    );
    let totalReceived = 0;

    if (storedGeneratedInvoices) {
      const generated = JSON.parse(storedGeneratedInvoices);

      // Calculate Monthly Income for Chart
      const monthlyData = new Array(12).fill(0);

      generated.forEach((curr: any) => {
        if (curr && curr.status === "Received") {
          const val =
            parseFloat(
              (curr.amount || "0").toString().replace(/[^0-9.-]+/g, ""),
            ) || 0;

          totalReceived += val;

          // Add to monthly chart data
          const dateStr = curr.date; // e.g., "May 29, 24"
          if (dateStr) {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              const monthIndex = date.getMonth(); // 0-11
              monthlyData[monthIndex] += val;
            }
          }
        }
      });

      // Update Chart Data
      setChartData((prev) => ({
        ...prev,
        monthly: {
          ...prev.monthly,
          data: monthlyData,
        },
      }));
    }

    // 2. Get Expenses
    const storedExpenses = localStorage.getItem("prostruktion_expenses");
    let totalExpenses = 0;

    if (storedExpenses) {
      const parsedExpenses = JSON.parse(storedExpenses);
      if (Array.isArray(parsedExpenses) && parsedExpenses.length > 0) {
        totalExpenses = parsedExpenses.reduce(
          (acc: number, curr: any) =>
            acc +
            (parseFloat(
              (curr.amount || "0").toString().replace(/[^0-9.-]+/g, ""),
            ) || 0),
          0,
        );
      } else {
        // Fallback if empty array in storage
        totalExpenses = 0;
      }
    } else {
      // 0 if no storage
      totalExpenses = 0;
    }

    const cashOnHand = totalReceived - totalExpenses;

    // Calculate Monthly Burn Rate
    // Formula: Total of Fixed Expenses + (Total of Variable monthly expenses / Number of months)
    let numberOfMonths = 1;
    let totalFixed = 0;
    let totalVariable = 0;

    if (storedExpenses) {
      const parsedExpenses = JSON.parse(storedExpenses);
      if (Array.isArray(parsedExpenses) && parsedExpenses.length > 0) {
        // Calculate totals for Fixed and Variable
        parsedExpenses.forEach((e: any) => {
          const val =
            parseFloat(
              (e.amount || "0").toString().replace(/[^0-9.-]+/g, ""),
            ) || 0;
          if (e.type === "Variable") {
            totalVariable += val;
          } else {
            // Assume Fixed if not Variable (or explicitly Fixed)
            totalFixed += val;
          }
        });

        // Find min and max date
        const dates = parsedExpenses.map((e: any) =>
          new Date(e.date).getTime(),
        );
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);

        if (minDate && maxDate && maxDate >= minDate) {
          const minD = new Date(minDate);
          const maxD = new Date(maxDate);
          const months =
            (maxD.getFullYear() - minD.getFullYear()) * 12 +
            (maxD.getMonth() - minD.getMonth()) +
            1;
          numberOfMonths = Math.max(1, months);
        }
      } else {
        // Default 0
        totalFixed = 0;
        totalVariable = 0;
        numberOfMonths = 1;
      }
    } else {
      // Default 0
      totalFixed = 0;
      totalVariable = 0;
      numberOfMonths = 1;
    }

    const monthlyBurnRate = totalFixed + totalVariable / numberOfMonths;

    // Calculate Awaiting Payment (Financials Logic)
    // Sources:
    // 1. Storage 'prostruktion_invoices' -> filter 'For Invoice' AND 'Ready'
    // 2. Storage 'prostruktion_generated_invoices' -> filter 'Unpaid'
    let awaitingTotal = 0;
    let awaitingCount = 0;

    const storedInvoices = localStorage.getItem("prostruktion_invoices");
    if (storedInvoices) {
      const parsed = JSON.parse(storedInvoices);
      const pending = parsed.filter(
        (p: any) => p.status === "For Invoice" || p.status === "Ready",
      );
      awaitingCount += pending.length;
      awaitingTotal += pending.reduce(
        (acc: number, curr: any) =>
          acc +
          (parseFloat(
            (curr.amount || "0").toString().replace(/[^0-9.-]+/g, ""),
          ) || 0),
        0,
      );
    }

    if (storedGeneratedInvoices) {
      const generated = JSON.parse(storedGeneratedInvoices);
      const unpaid = generated.filter((i: any) => i.status === "Unpaid");
      awaitingCount += unpaid.length;
      awaitingTotal += unpaid.reduce(
        (acc: number, curr: any) =>
          acc +
          (parseFloat(
            (curr.amount || "0").toString().replace(/[^0-9.-]+/g, ""),
          ) || 0),
        0,
      );
    }

    // Calculate Total Overdue (Financials Logic)
    // Source: 'prostruktion_generated_invoices' -> status != "Received" and Days Pending > 7
    let overdueTotal = 0;
    let overdueCount = 0;

    const calculateDaysPending = (dateString: string) => {
      const createdDate = new Date(dateString);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    if (storedGeneratedInvoices) {
      const generated = JSON.parse(storedGeneratedInvoices);
      const overdueItems = generated.filter((curr: any) => {
        const days = calculateDaysPending(curr.date);
        return days > 7 && curr.status !== "Received";
      });

      overdueCount = overdueItems.length;
      overdueTotal = overdueItems.reduce(
        (acc: number, curr: any) =>
          acc +
          (parseFloat(
            (curr.amount || "0").toString().replace(/[^0-9.-]+/g, ""),
          ) || 0),
        0,
      );
    }

    // Calculate Complaints Stats
    let openC = 0;
    let scheduledC = 0;
    let rescheduledC = 0;
    const storedComplaints = localStorage.getItem("prostruktion_complaints");
    if (storedComplaints) {
      const parsedC = JSON.parse(storedComplaints);
      if (Array.isArray(parsedC)) {
        openC = parsedC.filter(
          (c: any) => c.status === "Open" || c.repairBy === "Open",
        ).length;
        scheduledC = parsedC.filter(
          (c: any) => c.status === "Scheduled",
        ).length;
        rescheduledC = parsedC.filter(
          (c: any) => c.status === "Rescheduled",
        ).length;
      }
    } else {
      // 0 if no storage
      openC = 0;
      scheduledC = 0;
      rescheduledC = 0;
    }

    // Calculate Expiring Docs
    let expiring: any[] = [];
    const storedSubcontractors = localStorage.getItem(
      "prostruktion_subcontractors",
    );
    if (storedSubcontractors) {
      const parsedSubs = JSON.parse(storedSubcontractors);
      if (Array.isArray(parsedSubs)) {
        expiring = parsedSubs
          .filter((s: any) => {
            // Check explicit status
            if (
              s.status === "Expiring" ||
              s.docsExpired === true ||
              (s.expiry && s.expiry.toString().includes("Expired"))
            ) {
              return true;
            }

            // Check if expiry is a date within 15 days
            if (s.expiry) {
              const expiryDate = new Date(s.expiry);
              if (!isNaN(expiryDate.getTime())) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffTime = expiryDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                // Show if expired (< 0) or expiring soon (<= 15)
                return diffDays <= 15;
              }
            }
            return false;
          })
          .map((s: any) => ({
            name: s.name,
            expiry: s.expiry,
          }));
      }
    }

    // Stats Logic
    const storedProjects = localStorage.getItem("prostruktion_projects_v1");

    // We will try to fetch projects from Supabase as well
    const fetchSupabaseProjects = async () => {
      let dbProjects: any[] | null = null;

      try {
        const supabase = createClient();
        const { data } = await supabase.from("projects").select("*");
        dbProjects = data;
      } catch (e) {
        console.warn("Could not fetch projects from Supabase:", e);
      }

      let activeCount = 0;
      let activeVal = 0;
      let abnahmeCount = 0;
      let abnahmeVal = 0;
      let parsedLocal: any[] = [];

      if (storedProjects) {
        parsedLocal = JSON.parse(storedProjects);
      }

      const projectSource =
        dbProjects && dbProjects.length > 0 ? dbProjects : parsedLocal;

      // Calculate Active
      const activeList = projectSource.filter((p: any) => {
        const s = (p.status || "").toLowerCase();
        return s === "active" || s === "in progress";
      });

      activeCount = activeList.length;
      activeVal = activeList.reduce((acc: number, curr: any) => {
        // Handle both numeric contract_value (DB) and string amount (Local)
        let val = 0;
        if (curr.contract_value !== undefined) {
          val = Number(curr.contract_value) || 0;
        } else {
          val =
            parseFloat(
              (curr.amount || "0").toString().replace(/[^0-9.-]+/g, ""),
            ) || 0;
        }
        return acc + val;
      }, 0);

      // Calculate Abnahme
      const abnahmeList = projectSource.filter((p: any) => {
        const s = (p.status || "").toLowerCase();
        return s === "abnahme";
      });

      abnahmeCount = abnahmeList.length;
      abnahmeVal = abnahmeList.reduce((acc: number, curr: any) => {
        let val = 0;
        if (curr.contract_value !== undefined) {
          val = Number(curr.contract_value) || 0;
        } else {
          val =
            parseFloat(
              (curr.amount || "0").toString().replace(/[^0-9.-]+/g, ""),
            ) || 0;
        }
        return acc + val;
      }, 0);

      // For Invoice: Load from 'prostruktion_invoices' storage where status is 'For Invoice'
      let forInvoice: any[] = [];
      const storedInvoicesForStats = localStorage.getItem(
        "prostruktion_invoices",
      );
      if (storedInvoicesForStats) {
        const parsedInv = JSON.parse(storedInvoicesForStats);
        forInvoice = parsedInv.filter((p: any) => p.status === "For Invoice");
      }

      const getInvoiceValue = (list: any[]) =>
        list.reduce((acc, curr) => {
          const val =
            parseFloat(
              (curr.amount || "0").toString().replace(/[^0-9.-]+/g, ""),
            ) || 0;
          return acc + val;
        }, 0);

      // Final Total Value (Sum of all active + abnahme + invoice logic?)
      // Or just total of everything in source?
      // Let's use activeVal + abnahmeVal + invoiceVal for now for the Total Value stat if needed,
      // or iterate full list.
      const totalVal = projectSource.reduce((acc: number, curr: any) => {
        let val = 0;
        if (curr.contract_value !== undefined) {
          val = Number(curr.contract_value) || 0;
        } else {
          val =
            parseFloat(
              (curr.amount || "0").toString().replace(/[^0-9.-]+/g, ""),
            ) || 0;
        }
        return acc + val;
      }, 0);

      setStats((prev) => ({
        ...prev,
        active: activeCount,
        activeValue: activeVal,
        abnahme: abnahmeCount,
        abnahmeValue: abnahmeVal,
        invoicing: forInvoice.length,
        invoicingValue: getInvoiceValue(forInvoice),
        totalValue: totalVal,
        cashOnHand: cashOnHand,
        monthlyBurnRate: monthlyBurnRate,
        awaitingPayment: awaitingTotal,
        awaitingPaymentCount: awaitingCount,
        totalOverdue: overdueTotal,
        totalOverdueCount: overdueCount,
        openComplaints: openC,
        scheduledComplaints: scheduledC,
        rescheduledComplaints: rescheduledC,
        expiringDocs: expiring,
      }));
    };

    fetchSupabaseProjects();

    // End Stats Logic
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
              Cash on Hand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${stats.cashOnHand < 0 ? "text-red-600" : "text-gray-900 dark:text-gray-50"}`}
            >
              € {stats.cashOnHand.toLocaleString()}
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
              <span className="text-2xl font-bold text-red-600">
                €{" "}
                {stats.monthlyBurnRate.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
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
              € {stats.awaitingPayment.toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats.awaitingPaymentCount} Invoices pending
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
              € {stats.totalOverdue.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <History className="h-3 w-3" />
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {stats.totalOverdueCount} Overdue invoices
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
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow whitespace-nowrap z-20 transition-opacity pointer-events-none">
                    € {h.toLocaleString()}
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
                  <div className="text-sm font-semibold text-primary">
                    € {stats.abnahmeValue.toLocaleString()}
                  </div>
                </div>
                <div className="px-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-yellow-600">
                      {stats.invoicing}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      For Invoice
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
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center text-muted-foreground py-8"
                    >
                      No performance data available
                    </TableCell>
                  </TableRow>
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
                <div className="grid grid-cols-2 gap-4 p-4">
                  <div className="flex flex-col gap-1 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                    <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {stats.openComplaints}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      Open Total
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.scheduledComplaints}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      Scheduled Total
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                    <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {stats.rescheduledComplaints}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      Rescheduled Total
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.active}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      In Progress (Projects)
                    </span>
                  </div>
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
                {stats.expiringDocs.length > 0 ? (
                  stats.expiringDocs.map((doc, i) => (
                    <div
                      key={i}
                      className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {doc.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Document Expiry
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                          {doc.expiry}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No documents expiring soon.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
