"use client";

import { useState, useEffect, Fragment } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  HardHat,
  Zap,
  ThermometerSun,
  Wrench,
  RotateCw,
  AlertCircle,
  Users,
} from "lucide-react";
import { PRICING_MATRIX, ADDITIONAL_SERVICES } from "@/lib/pricing-data";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";

const DUMMY_WORKERS = [
  {
    id: "w1",
    name: "John Doe",
    role: "Electrician",
    subcontractor: "Sub Y",
    avatarSeed: "John",
    a1Status: "Valid",
    coolingStatus: "Valid",
    complaints: 0,
    successRate: 100,
  },
  {
    id: "w2",
    name: "Jane Smith",
    role: "S/H/K",
    subcontractor: "Sub Y",
    avatarSeed: "Jane",
    a1Status: "Valid",
    coolingStatus: "Expiring Soon",
    complaints: 1,
    successRate: 98,
  },
  {
    id: "w3",
    name: "Bob Johnson",
    role: "Cooling Technician",
    subcontractor: "Sub Z",
    avatarSeed: "Bob",
    a1Status: "Valid",
    coolingStatus: "Valid",
    complaints: 0,
    successRate: 100,
  },
  {
    id: "w4",
    name: "Alice Brown",
    role: "S/H/K",
    subcontractor: "Sub Y",
    avatarSeed: "Alice",
    a1Status: "Expired",
    coolingStatus: "Valid",
    complaints: 2,
    successRate: 92,
  },
  {
    id: "w5",
    name: "Mike Davis",
    role: "Electrician",
    subcontractor: "Sub Z",
    avatarSeed: "Mike",
    a1Status: "Expired",
    coolingStatus: "Valid",
    complaints: 1,
    successRate: 96,
  },
  {
    id: "w6",
    name: "Tom Wilson",
    role: "S/H/K",
    subcontractor: "Sub Alpha",
    avatarSeed: "Tom",
    a1Status: "Expired",
    coolingStatus: "Valid",
    complaints: 0,
    successRate: 98,
  },
  {
    id: "w7",
    name: "Sarah Lee",
    role: "Cooling Technician",
    subcontractor: "Sub Alpha",
    avatarSeed: "Sarah",
    a1Status: "Valid",
    coolingStatus: "Valid",
    complaints: 0,
    successRate: 100,
  },
  {
    id: "w8",
    name: "David Miller",
    role: "Electrician",
    subcontractor: "Partner Beta",
    avatarSeed: "David",
    a1Status: "Valid",
    coolingStatus: "Valid",
    complaints: 0,
    successRate: 99,
  },
  {
    id: "w9",
    name: "Emily Clark",
    role: "S/H/K",
    subcontractor: "ConstructCo",
    avatarSeed: "Emily",
    a1Status: "Valid",
    coolingStatus: "Valid",
    complaints: 0,
    successRate: 100,
  },
  {
    id: "w10",
    name: "James White",
    role: "Cooling Technician",
    subcontractor: "ConstructCo",
    avatarSeed: "James",
    a1Status: "Expired",
    coolingStatus: "None",
    complaints: 1,
    successRate: 95,
  },
];

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
    contractorId: "",
    partner: "",
    partnerId: "",
    mediator: "",
    mediatorId: "",
    sub: "",
    subId: "",
    start: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    scheduledStart: "", // Added scheduled start date
    amount: "",
    workers: [] as string[], // Selected worker IDs
  });

  // Calculator State
  const [calcState, setCalcState] = useState({
    units: 0,
    services: [] as string[],
    quantityBonusTier: "none",
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
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [archivedCount, setArchivedCount] = useState(0);

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const [expandedScheduledRows, setExpandedScheduledRows] = useState<
    Set<number>
  >(new Set());
  const toggleScheduledRow = (index: number) => {
    const newExpanded = new Set(expandedScheduledRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedScheduledRows(newExpanded);
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Apply pagination
  const filteredProjects = projects; // Placeholder for future filtering
  const totalProjects = filteredProjects.length;
  const totalPages = Math.ceil(totalProjects / itemsPerPage);

  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    // Fetch from Supabase and localStorage
    const fetchDropdownUsers = async () => {
      try {
        const supabase = createClient();

        // Fetch Partners from Supabase
        let partnersData: any[] | null = null;
        let mediatorsData: any[] | null = null;

        try {
          const { data: p } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("role", "partner");
          partnersData = p;
        } catch (e) {
          console.warn("Could not fetch partners from Supabase:", e);
        }

        // Mock Partners to ensure they are available for demo
        const mockPartners = [
          { id: "mp1", name: "Partner A" },
          { id: "mp2", name: "Partner B" },
          { id: "mp3", name: "Partner Beta" },
          { id: "mp4", name: "Partner C" },
        ];

        // Combine DB partners with mock partners (deduplicating by name if needed)
        let combinedPartners = [...mockPartners];
        if (partnersData) {
          const dbPartners = partnersData.map((p) => ({
            id: p.id,
            name: p.full_name || p.email,
          }));
          // Merge, preferring DB if duplicates
          combinedPartners = [
            ...dbPartners,
            ...mockPartners.filter(
              (mp) => !dbPartners.find((dbp) => dbp.name === mp.name),
            ),
          ];
        }

        // Also load Partners from localStorage
        try {
          const storedPartners = localStorage.getItem("prostruktion_partners");
          if (storedPartners) {
            const parsed = JSON.parse(storedPartners);
            parsed.forEach((item: any) => {
              if (!combinedPartners.some((p) => p.name === item.name)) {
                combinedPartners.push({
                  id: `local-partner-${item.name}`,
                  name: item.name,
                });
              }
            });
          }
        } catch (e) {
          console.error("Error loading partners from localStorage:", e);
        }
        setPartners(combinedPartners);

        // Fetch Mediators (Brokers) from Supabase
        try {
          const { data: m } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("role", "broker");
          mediatorsData = m;
        } catch (e) {
          console.warn("Could not fetch mediators from Supabase:", e);
        }

        let combinedMediators: any[] = [];
        if (mediatorsData) {
          combinedMediators = mediatorsData.map((m) => ({
            id: m.id,
            name: m.full_name || m.email,
          }));
        }

        // Also load Mediators from localStorage
        try {
          const storedMediators = localStorage.getItem(
            "prostruktion_mediators",
          );
          if (storedMediators) {
            const parsed = JSON.parse(storedMediators);
            parsed.forEach((item: any) => {
              if (!combinedMediators.some((m) => m.name === item.name)) {
                combinedMediators.push({
                  id: `local-mediator-${item.name}`,
                  name: item.name,
                });
              }
            });
          }
        } catch (e) {
          console.error("Error loading mediators from localStorage:", e);
        }
        setMediators(combinedMediators);

        // Load Subcontractors from localStorage (no mock data)
        let combinedSubs: any[] = [];
        try {
          const storedSubs = localStorage.getItem(
            "prostruktion_subcontractors",
          );
          if (storedSubs) {
            const parsed = JSON.parse(storedSubs);
            parsed.forEach((item: any) => {
              combinedSubs.push({
                id: `local-sub-${item.name}`,
                name: item.name,
                mediator: item.mediator || "", // Include associated mediator
              });
            });
          }
        } catch (e) {
          console.error("Error loading subcontractors from localStorage:", e);
        }
        setSubcontractors(combinedSubs);

        // Load Contractors from localStorage
        let combinedContractors: any[] = [];
        try {
          const storedContractors = localStorage.getItem(
            "prostruktion_contractors",
          );
          if (storedContractors) {
            const parsed = JSON.parse(storedContractors);
            parsed.forEach((item: any) => {
              combinedContractors.push({
                id: `local-contractor-${item.name}`,
                name: item.name,
              });
            });
          }
        } catch (e) {
          console.error("Error loading contractors from localStorage:", e);
        }
        setContractors(combinedContractors);
      } catch (e) {
        console.error("Error in fetchDropdownUsers:", e);
        // Still set mock data so the UI works
        setPartners([
          { id: "mp1", name: "Partner A" },
          { id: "mp2", name: "Partner B" },
        ]);
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

    // Bonus 2 (Quantity)
    // @ts-ignore - Indexing with string
    const bonus2 = PRICING_MATRIX.bonus2[calcState.quantityBonusTier] || 0;

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

  // Calculate Penalty Helper
  const calculatePenalty = (amountStr: string, startDateStr: string) => {
    // 1. Parse Amount
    const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g, ""));
    if (isNaN(amount) || !startDateStr)
      return { penalty: 0, daysLate: 0, isOverdue: false, netAmount: amount };

    // 2. Parse Dates
    const start = new Date(startDateStr);
    const now = new Date();

    // Reset times to compare dates only
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    // 3. Calculate Days Late
    // diff in ms / ms per day
    const diffTime = now.getTime() - start.getTime();
    const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLate <= 0) {
      return { penalty: 0, daysLate: 0, isOverdue: false, netAmount: amount };
    }

    // 4. Calculate Penalty
    // 0.2% per day, max 5%
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

  useEffect(() => {
    // Force clear old data for this session to ensure new colors show up
    // In a real app we'd migrate data, but for this dev session:
    const storedProjects = localStorage.getItem("prostruktion_projects_v1");
    // We check if we need to migrate colors or just re-seed
    // Simple approach: just re-seed if it exists to force update colors
    seedDummyData();
    // Logic below is bypassed to force update
    /* 
    if (storedProjects) {
      const parsed = JSON.parse(storedProjects);
        if (parsed.length === 0) {
           seedDummyData();
        } else {
          setProjects(parsed);
        }
    } else {
      seedDummyData();
    }
    */

    // Fetch archived count
    // One-time clear of archive to fix warranty date calculation data
    if (!localStorage.getItem("archive_cleared_fix_v2")) {
      localStorage.removeItem("prostruktion_archive");
      localStorage.setItem("archive_cleared_fix_v2", "true");
    }

    const storedArchive = localStorage.getItem("prostruktion_archive");
    if (storedArchive) {
      try {
        const parsedArchive = JSON.parse(storedArchive);
        setArchivedCount(parsedArchive.length);
      } catch (e) {
        console.error("Failed to parse archive", e);
        setArchivedCount(0);
      }
    } else {
      setArchivedCount(0);
    }
  }, []);

  const seedDummyData = () => {
    // Helper to get date string relative to now
    const getRelativeDate = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    const dummyProjects = [
      {
        project: "Delayed Villa",
        address: "Historical Lane 1, Oldtown",
        contractor: "SlowBuilders Inc.",
        partner: "Partner A",
        mediator: "Mediator X",
        sub: "Sub Y",
        start: getRelativeDate(-10), // 10 days late
        amount: "€ 100,000",
        status: "Scheduled",
        statusColor: "bg-purple-600",
        abnahme: "No",
        invoiceHeader: "Create Invoice",
        invoiceStatus: "Pending",
        workers: ["w1", "w2"],
      },
      {
        project: "Future Office",
        address: "NextGen St 20, TechCity",
        contractor: "FastConstruct",
        partner: "Partner B",
        mediator: "-",
        sub: "Sub Z",
        start: getRelativeDate(5), // 5 days in future
        amount: "€ 200,000",
        status: "Scheduled",
        statusColor: "bg-purple-600",
        abnahme: "No",
        invoiceHeader: "Create Invoice",
        invoiceStatus: "Pending",
        workers: ["w3", "w5"],
      },
      {
        project: "City Center Reno",
        address: "Market Square 5, Downtown",
        contractor: "UrbanDev",
        partner: "Partner A",
        mediator: "Mediator Y",
        sub: "Sub Alpha",
        start: getRelativeDate(-15), // 15 days late
        amount: "€ 350,000",
        status: "Scheduled",
        statusColor: "bg-purple-600",
        abnahme: "No",
        invoiceHeader: "Create Invoice",
        invoiceStatus: "Pending",
        workers: ["w6", "w7"],
      },
      {
        project: "Suburban House",
        address: "Oak Drive 42, Suburbia",
        contractor: "HomeSweetHome",
        partner: "Partner Beta",
        mediator: "-",
        sub: "Partner Beta",
        start: getRelativeDate(2), // 2 days future
        amount: "€ 180,000",
        status: "Scheduled",
        statusColor: "bg-purple-600",
        abnahme: "No",
        invoiceHeader: "Create Invoice",
        invoiceStatus: "Pending",
        workers: ["w8"],
      },
      {
        project: "Industrial Park",
        address: "Factory Rd 99, Zone B",
        contractor: "MegaStruct",
        partner: "Partner C",
        mediator: "Mediator Z",
        sub: "ConstructCo",
        start: getRelativeDate(-30), // 30 days late!
        amount: "€ 1,200,000",
        status: "Scheduled",
        statusColor: "bg-purple-600",
        abnahme: "No",
        invoiceHeader: "Create Invoice",
        invoiceStatus: "Pending",
        workers: ["w9", "w10"],
      },
      {
        project: "Villa Sunshine",
        address: "Sunny Lane 12, Miami",
        contractor: "BuildRight LLC",
        partner: "Partner A",
        mediator: "Mediator X",
        sub: "Sub Y",
        start: "Jan 10, 2024",
        amount: "€ 150,000",
        status: "In Progress",
        statusColor: "bg-orange-500 text-white", // Added text-white
        abnahme: "No",
        invoiceHeader: "Create Invoice",
        invoiceStatus: "Ready",
        workers: ["w1", "w4"],
      },
      {
        project: "Lakeside Cottage",
        address: "Lake View 3, Austin",
        contractor: "HomeMakers",
        partner: "Partner C",
        mediator: "Mediator Z",
        sub: "Sub A",
        start: "Mar 01, 2024",
        amount: "€ 80,000",
        status: "In Abnahme",
        statusColor: "bg-yellow-500 text-black",
        abnahme: "Yes",
        invoiceHeader: "Create Invoice",
        invoiceStatus: "Sent",
        workers: ["w2", "w3"],
      },
      {
        project: "Uptown Loft",
        address: "High St 10, Chicago",
        contractor: "ModernBuilders",
        partner: "Partner D",
        mediator: "-",
        sub: "Sub B",
        start: "Apr 05, 2024",
        amount: "€ 120,000",
        status: "Finished",
        statusColor: "bg-green-600 text-white", // Added text-white
        abnahme: "Yes",
        invoiceHeader: "Invoice Sent",
        invoiceStatus: "Paid",
        workers: ["w5"],
      },
    ];
    setProjects(dummyProjects);
    localStorage.setItem(
      "prostruktion_projects_v1",
      JSON.stringify(dummyProjects),
    );
  };

  const handleAddProject = async () => {
    // Basic validation
    if (!newProject.project) return; // Amount is auto-calc

    const projectData = {
      ...newProject,
      status: "Scheduled",
      statusColor: "bg-purple-600 text-white", // Added text-white
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

    // Save to Supabase (Best Effort)
    try {
      const supabase = createClient();

      const metadata = `
Address: ${newProject.address}
Subcontractor: ${newProject.sub} (ID: ${newProject.subId || "N/A"})
Contractor: ${newProject.contractor}
      `.trim();

      await supabase.from("projects").insert({
        title: newProject.project,
        description: metadata,
        contract_value: calcState.calculation.total,
        partner_id: newProject.partnerId || null,
        broker_id: newProject.mediatorId || null,
        status: "active", // Default status for DB
      });
    } catch (e) {
      console.error("Failed to save project to Supabase:", e);
    }

    setAddProjectOpen(false);
    setNewProject({
      project: "",
      address: "",
      contractor: "",
      contractorId: "",
      partner: "",
      partnerId: "",
      mediator: "",
      mediatorId: "",
      sub: "",
      subId: "",
      start: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      scheduledStart: "", // Reset scheduled start
      amount: "",
      workers: [],
    });
    setCalcState({
      units: 0,
      services: [],
      quantityBonusTier: "none",
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

  const handleStartProject = (projectIndex: number) => {
    const updatedProjects = [...projects];
    // Find the actual index in the master array based on the scheduled one we clicked
    // But since we are rendering mapped versions, we need to find the correct project ID or reference.
    // However, to keep it simple with index-based approach (risky if sorted/filtered differently)
    // we should really filter and map.
    // Let's use the object reference finding logic.
    // For simplicity in this demo, since we are iterating the MAIN projects array in the render with filter,
    // we need to know the index in the specific filtered view OR find by unique ID.
    // The current render uses `map((project, i) =>` on the FILTERED array.
    // We cannot use `i` directly to update `projects` state.

    // Better approach: Find the project by properties (assuming unique combination) or add IDs.
    // Our dummy data doesn't have IDs. Let's assume unique project name for now.

    const projectToUpdate = projects.find(
      (p) =>
        p.project ===
        projects.filter((p: any) => p.status === "Scheduled")[projectIndex]
          .project,
    );

    if (projectToUpdate) {
      // Update status
      projectToUpdate.status = "In Progress";
      projectToUpdate.statusColor = "bg-orange-500 text-white";

      // Note: We keep the original start date as the "Scheduled Start"
      // We might want to set a new "Actual Start" date here?
      // For now, we just change status as requested.

      setProjects(updatedProjects);
      localStorage.setItem(
        "prostruktion_projects_v1",
        JSON.stringify(updatedProjects),
      );
    }
  };

  const handleStatusChange = (index: number, newStatus: string) => {
    const updatedProjects = [...projects];
    // Find project based on filtering logic
    const activeProjects = projects.filter((p) => p.status !== "Scheduled");
    const targetProject = activeProjects[index];

    // Find actual index in main array
    const realIndex = projects.findIndex((p) => p === targetProject);

    if (realIndex !== -1) {
      let color = "bg-primary text-primary-foreground";
      if (newStatus === "In Progress") color = "bg-orange-500 text-white";
      if (newStatus === "In Abnahme") color = "bg-yellow-500 text-black";
      if (newStatus === "Finished") color = "bg-green-600 text-white";

      updatedProjects[realIndex].status = newStatus;
      updatedProjects[realIndex].statusColor = color;

      // Update abnahme flag based on status for stats logic
      if (newStatus === "Abnahme" || newStatus === "In Abnahme") {
        updatedProjects[realIndex].abnahme = "Yes";
      } else {
        updatedProjects[realIndex].abnahme = "No";
      }

      setProjects(updatedProjects);
      localStorage.setItem(
        "prostruktion_projects_v1",
        JSON.stringify(updatedProjects),
      );
    }
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

    const now = new Date();
    const warrantyDate = new Date(now);
    warrantyDate.setFullYear(warrantyDate.getFullYear() + 5);
    warrantyDate.setMonth(warrantyDate.getMonth() + 1);

    const archiveRecord = {
      project: project.project,
      address: project.address,
      contractor: project.contractor,
      partner: project.partner,
      mediator: hasMediator ? project.mediator : "-",
      sub: project.sub,
      abnahme: now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      warrantyEnd: warrantyDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }), // 5 years + 1 month warranty
      status: "In Warranty",
      statusColor: "bg-orange-100 text-orange-700",
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
  // const totalProjects = projects.length; // Moved up
  const scheduledProjects = projects.filter(
    (p) => p.status === "Scheduled",
  ).length;
  const activeProjects = projects.filter(
    (p) => p.status === "In Progress",
  ).length;
  const abnahmeProjects = projects.filter(
    (p) => p.status === "In Abnahme",
  ).length;
  // const invoicingProjects removed
  // const invoicingProjects removed
  // Archived projects count comes from separate local storage logic now
  const archivedProjects = archivedCount;

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-blue-600" /> Scheduled
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{scheduledProjects}</div>
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-muted/20 p-2 rounded-lg border overflow-hidden">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            Filters:
          </span>
          <Select defaultValue="all-phases">
            <SelectTrigger className="w-auto min-w-[100px] max-w-[120px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Phases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-phases">All Phases</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="abnahme">Abnahme</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-contractors">
            <SelectTrigger className="w-auto min-w-[100px] max-w-[140px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Contractors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-contractors">All Contractors</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-partners">
            <SelectTrigger className="w-auto min-w-[100px] max-w-[120px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Partners" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-partners">All Partners</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-mediators">
            <SelectTrigger className="w-auto min-w-[100px] max-w-[130px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Mediators" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-mediators">All Mediators</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-subs">
            <SelectTrigger className="w-auto min-w-[100px] max-w-[150px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Subcontractors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-subs">All Subcontractors</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-statuses">
            <SelectTrigger className="w-auto min-w-[100px] max-w-[120px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-statuses">All Statuses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Button
            className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setAddProjectOpen(true)}
          >
            <Plus className="mr-2 h-3 w-3" /> Add Project
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {totalProjects > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          -{Math.min(currentPage * itemsPerPage, totalProjects)} of{" "}
          {totalProjects} Projects
        </span>

        <div className="flex items-center gap-4">
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs">Rows per page:</span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(val) => {
                setItemsPerPage(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-6 w-[70px] text-xs">
                <SelectValue placeholder={itemsPerPage} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              &lt;
            </Button>
            <span className="text-foreground font-medium px-2">
              {currentPage} / {Math.max(1, totalPages)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              &gt;
            </Button>
          </div>
        </div>
      </div>

      {/* Scheduled Projects Table */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold tracking-tight">
          Scheduled Projects
        </h3>
        <div className="rounded-md border bg-white dark:bg-gray-950 overflow-x-auto">
          <Table>
            <TableHeader className="bg-yellow-50 dark:bg-yellow-900/10">
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
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
                  Sub
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Scheduled date
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
                <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProjects.filter((p) => p.status === "Scheduled")
                .length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No scheduled projects found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProjects
                  .filter((p) => p.status === "Scheduled")
                  .map((project, i) => {
                    const {
                      penalty,
                      daysLate,
                      isOverdue,
                      netAmount,
                      penaltyPercentage,
                    } = calculatePenalty(project.amount, project.start);

                    const isExpanded = expandedScheduledRows.has(i);

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
                              onClick={() => toggleScheduledRow(i)}
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
                          <TableCell>{project.sub}</TableCell>
                          <TableCell className="text-sm">
                            {project.start}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              <Badge
                                variant={
                                  isOverdue ? "destructive" : "secondary"
                                }
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
                            {project.amount}
                          </TableCell>
                          <TableCell className="font-bold text-blue-600">
                            €{" "}
                            {netAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              className="h-7 bg-primary hover:bg-primary/90 text-primary-foreground"
                              onClick={() => handleStartProject(i)}
                            >
                              <Rocket className="mr-1 h-3 w-3" /> Start
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200">
                            <TableCell colSpan={10}>
                              <div className="p-4">
                                <div className="mb-4">
                                  <div className="text-xs text-muted-foreground">
                                    Mediator
                                  </div>
                                  <div className="text-sm font-medium">
                                    {project.mediator || "-"}
                                  </div>
                                </div>

                                <h4 className="font-semibold text-sm mb-2">
                                  Assigned Workers
                                </h4>
                                {project.workers &&
                                project.workers.length > 0 ? (
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
                                        {project.workers.map(
                                          (workerId: string) => {
                                            const worker = DUMMY_WORKERS.find(
                                              (w) => w.id === workerId,
                                            );
                                            if (!worker) return null;
                                            return (
                                              <TableRow
                                                key={workerId}
                                                className="hover:bg-muted/50"
                                              >
                                                <TableCell className="py-2">
                                                  <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border bg-gray-100">
                                                      <AvatarImage
                                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.avatarSeed || worker.name}`}
                                                      />
                                                      <AvatarFallback>
                                                        {worker.name.charAt(0)}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                        {worker.name}
                                                      </span>
                                                      <span className="text-[10px] text-muted-foreground">
                                                        {worker.role ===
                                                        "Electrician"
                                                          ? "Senior Electrician"
                                                          : worker.role}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </TableCell>
                                                <TableCell className="py-2 text-xs">
                                                  {worker.role}
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
                                                      className={`h-full flex items-center gap-1 px-1.5 text-[10px] font-medium ${
                                                        (worker.a1Status ||
                                                          "Valid") === "Valid"
                                                          ? "bg-green-100 text-green-700"
                                                          : "bg-red-100 text-red-700"
                                                      }`}
                                                    >
                                                      {worker.a1Status ||
                                                        "Valid"}
                                                    </span>
                                                  </div>
                                                </TableCell>
                                                <TableCell className="py-2">
                                                  {(worker.coolingStatus ||
                                                    "Valid") !== "None" && (
                                                    <Badge
                                                      variant="outline"
                                                      className={`border-0 gap-1 pl-1 pr-2 py-0 text-[10px] h-5 font-normal ${
                                                        (worker.coolingStatus ||
                                                          "Valid") === "Valid"
                                                          ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                                                          : worker.coolingStatus ===
                                                              "Expiring Soon"
                                                            ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                                            : "bg-red-50 text-red-700 ring-1 ring-red-200"
                                                      }`}
                                                    >
                                                      <CheckCircle2
                                                        className={`h-3 w-3 ${
                                                          (worker.coolingStatus ||
                                                            "Valid") === "Valid"
                                                            ? "fill-green-200 text-green-600"
                                                            : worker.coolingStatus ===
                                                                "Expiring Soon"
                                                              ? "fill-amber-200 text-amber-600"
                                                              : "fill-red-200 text-red-600"
                                                        }`}
                                                      />
                                                      {worker.coolingStatus ||
                                                        "Valid"}
                                                    </Badge>
                                                  )}
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                                    <Users className="h-3 w-3" />{" "}
                                                    {worker.complaints || 0}
                                                  </div>
                                                </TableCell>
                                                <TableCell className="py-2 text-center">
                                                  <div className="flex items-center justify-center gap-1 text-xs font-medium text-green-600">
                                                    <CheckCircle2 className="h-3 w-3" />{" "}
                                                    {worker.successRate || 100}%
                                                  </div>
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
        <div className="rounded-md border bg-white dark:bg-gray-950 overflow-x-auto">
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
                  Start date
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </TableHead>
                {/* Abnahme column removed */}
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                  Amount (€)
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-700 dark:text-gray-300">
                  Invoice (€)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProjects
                .filter((p) => p.status !== "Scheduled")
                .map((item, i) => {
                  // Calculate stats for accordion details
                  const { penalty, daysLate, isOverdue, penaltyPercentage } =
                    calculatePenalty(
                      item.amount,
                      item.scheduledStart || item.start,
                    );
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
                        <TableCell>{item.mediator}</TableCell>
                        <TableCell>{item.sub}</TableCell>
                        <TableCell className="text-sm">{item.start}</TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            onValueChange={(val) => handleStatusChange(i, val)}
                          >
                            <SelectTrigger
                              className={`w-[130px] h-8 border-0 ${item.statusColor}`}
                            >
                              <SelectValue>{item.status}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="In Progress">
                                In Progress
                              </SelectItem>
                              <SelectItem value="In Abnahme">
                                In Abnahme
                              </SelectItem>
                              <SelectItem value="Finished">Finished</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        {/* Abnahme cell removed */}
                        <TableCell className="font-medium">
                          {item.amount}
                        </TableCell>
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
                                className="h-7 bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={() => handleCreateInvoice(item, i)}
                                disabled={item.status !== "Finished"}
                              >
                                Create Invoice
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200">
                          <TableCell colSpan={11}>
                            <div className="flex items-center gap-8 py-2 px-4 text-sm">
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground block">
                                  Scheduled Start
                                </span>
                                <span className="font-medium">
                                  {item.scheduledStart || item.start}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground block">
                                  Overdue
                                </span>
                                <Badge
                                  variant={
                                    isOverdue ? "destructive" : "secondary"
                                  }
                                  className={
                                    isOverdue
                                      ? "bg-red-100 text-red-700"
                                      : "bg-green-100 text-green-700"
                                  }
                                >
                                  {isOverdue ? `${daysLate} Days` : "No"}
                                </Badge>
                              </div>
                              <div className="space-y-1">
                                <span className="text-xs text-muted-foreground block">
                                  Penalty
                                </span>
                                <span
                                  className={`font-medium ${isOverdue ? "text-red-600" : "text-green-600"}`}
                                >
                                  {isOverdue
                                    ? `- € ${penalty.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${penaltyPercentage}%)`
                                    : "None"}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 border-t pt-4">
                              <h4 className="font-semibold text-sm mb-3">
                                Assigned Workers
                              </h4>
                              {item.workers && item.workers.length > 0 ? (
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
                                      {item.workers.map((workerId: string) => {
                                        const worker = DUMMY_WORKERS.find(
                                          (w) => w.id === workerId,
                                        );
                                        if (!worker) return null;
                                        return (
                                          <TableRow
                                            key={workerId}
                                            className="hover:bg-muted/50"
                                          >
                                            <TableCell className="py-2">
                                              <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border bg-gray-100">
                                                  <AvatarImage
                                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.avatarSeed || worker.name}`}
                                                  />
                                                  <AvatarFallback>
                                                    {worker.name.charAt(0)}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                    {worker.name}
                                                  </span>
                                                  <span className="text-[10px] text-muted-foreground">
                                                    {worker.role ===
                                                    "Electrician"
                                                      ? "Senior Electrician"
                                                      : worker.role}
                                                  </span>
                                                </div>
                                              </div>
                                            </TableCell>
                                            <TableCell className="py-2 text-xs">
                                              {worker.role}
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
                                                  className={`h-full flex items-center gap-1 px-1.5 text-[10px] font-medium ${
                                                    (worker.a1Status ||
                                                      "Valid") === "Valid"
                                                      ? "bg-green-100 text-green-700"
                                                      : "bg-red-100 text-red-700"
                                                  }`}
                                                >
                                                  {worker.a1Status || "Valid"}
                                                </span>
                                              </div>
                                            </TableCell>
                                            <TableCell className="py-2">
                                              {(worker.coolingStatus ||
                                                "Valid") !== "None" && (
                                                <Badge
                                                  variant="outline"
                                                  className={`border-0 gap-1 pl-1 pr-2 py-0 text-[10px] h-5 font-normal ${
                                                    (worker.coolingStatus ||
                                                      "Valid") === "Valid"
                                                      ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                                                      : worker.coolingStatus ===
                                                          "Expiring Soon"
                                                        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                                        : "bg-red-50 text-red-700 ring-1 ring-red-200"
                                                  }`}
                                                >
                                                  <CheckCircle2
                                                    className={`h-3 w-3 ${
                                                      (worker.coolingStatus ||
                                                        "Valid") === "Valid"
                                                        ? "fill-green-200 text-green-600"
                                                        : worker.coolingStatus ===
                                                            "Expiring Soon"
                                                          ? "fill-amber-200 text-amber-600"
                                                          : "fill-red-200 text-red-600"
                                                    }`}
                                                  />
                                                  {worker.coolingStatus ||
                                                    "Valid"}
                                                </Badge>
                                              )}
                                            </TableCell>
                                            <TableCell className="py-2 text-center">
                                              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                                <Users className="h-3 w-3" />{" "}
                                                {worker.complaints || 0}
                                              </div>
                                            </TableCell>
                                            <TableCell className="py-2 text-center">
                                              <div className="flex items-center justify-center gap-1 text-xs font-medium text-green-600">
                                                <CheckCircle2 className="h-3 w-3" />{" "}
                                                {worker.successRate || 100}%
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
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
                  <Select
                    value={newProject.contractorId}
                    onValueChange={(val) => {
                      const selected = contractors.find((c) => c.id === val);
                      if (selected) {
                        setNewProject({
                          ...newProject,
                          contractor: selected.name,
                          contractorId: val,
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="contractor">
                      <SelectValue placeholder="Select Contractor" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractors.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="partner" className="text-xs font-medium">
                    Partner
                  </label>
                  <Select
                    value={newProject.partnerId}
                    onValueChange={(val) => {
                      const selected = partners.find((p) => p.id === val);
                      if (selected) {
                        setNewProject({
                          ...newProject,
                          partner: selected.name,
                          partnerId: val,
                        });
                      }
                    }}
                  >
                    <SelectTrigger id="partner">
                      <SelectValue placeholder="Select Partner" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
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
                    value={newProject.mediatorId}
                    onValueChange={(val) => {
                      if (val === "-") {
                        setNewProject({
                          ...newProject,
                          mediator: "",
                          mediatorId: "",
                        });
                      } else {
                        const selected = mediators.find((m) => m.id === val);
                        if (selected) {
                          setNewProject({
                            ...newProject,
                            mediator: selected.name,
                            mediatorId: val,
                          });
                        }
                      }
                    }}
                  >
                    <SelectTrigger id="mediator">
                      <SelectValue placeholder="Select Mediator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">None</SelectItem>
                      {mediators.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
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
                  <Select
                    value={newProject.subId}
                    onValueChange={(val) => {
                      if (val === "-") {
                        setNewProject({ ...newProject, sub: "", subId: "" });
                        return;
                      }
                      // Find the selected subcontractor
                      const selectedSub = subcontractors.find(
                        (s) => s.id === val,
                      );
                      if (!selectedSub) return;

                      const associatedMediatorName = selectedSub.mediator || "";
                      let associatedMediatorId = "";

                      // Find mediator ID if name exists
                      if (associatedMediatorName) {
                        const med = mediators.find(
                          (m) => m.name === associatedMediatorName,
                        );
                        if (med) associatedMediatorId = med.id;
                      }

                      // Update state
                      setNewProject({
                        ...newProject,
                        sub: selectedSub.name,
                        subId: val,
                        // Only auto-fill mediator if one is associated and mediator field is empty
                        mediator: associatedMediatorName || newProject.mediator,
                        mediatorId:
                          associatedMediatorId || newProject.mediatorId,
                      });
                    }}
                  >
                    <SelectTrigger id="sub">
                      <SelectValue placeholder="Select Sub" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-">None</SelectItem>
                      {subcontractors.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Scheduled Start Date */}
              <div className="space-y-2">
                <label htmlFor="scheduledStart" className="text-xs font-medium">
                  Scheduled Start Date
                </label>
                <Input
                  id="scheduledStart"
                  type="date"
                  value={newProject.scheduledStart}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      scheduledStart: e.target.value,
                      // Update display start date too if desired, or keep separate
                      start: new Date(e.target.value).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      ),
                    })
                  }
                />
              </div>

              {/* Workers Selection */}
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-medium">
                  Select Workers{" "}
                  {newProject.partner || newProject.sub
                    ? `(from ${[newProject.partner, newProject.sub].filter(Boolean).join(" / ")})`
                    : ""}
                </label>
                <div className="border rounded-md p-2 max-h-[150px] overflow-y-auto space-y-1 bg-gray-50/50">
                  {DUMMY_WORKERS.filter((worker) => {
                    // If neither partner nor sub selected, show all (or none? showing all for now)
                    if (!newProject.partner && !newProject.sub) return true;
                    // Show worker if they belong to selected Partner OR selected Sub
                    return (
                      (newProject.partner &&
                        worker.subcontractor === newProject.partner) ||
                      (newProject.sub &&
                        worker.subcontractor === newProject.sub)
                    );
                  }).map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded"
                    >
                      <Checkbox
                        id={`worker-${worker.id}`}
                        checked={(newProject.workers || []).includes(worker.id)}
                        onCheckedChange={(checked) => {
                          setNewProject((prev) => {
                            const currentWorkers = prev.workers || [];
                            const updatedWorkers = checked
                              ? [...currentWorkers, worker.id]
                              : currentWorkers.filter((id) => id !== worker.id);
                            return { ...prev, workers: updatedWorkers };
                          });
                        }}
                      />
                      <label
                        htmlFor={`worker-${worker.id}`}
                        className="text-xs cursor-pointer flex-1 flex items-center justify-between"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 ${worker.role === "Electrician" ? "text-yellow-600" : worker.role === "Cooling Technician" ? "text-blue-600" : "text-red-600"}`}
                          >
                            {worker.role === "Electrician" && (
                              <Zap className="h-4 w-4" />
                            )}
                            {worker.role === "Cooling Technician" && (
                              <ThermometerSun className="h-4 w-4" />
                            )}
                            {worker.role === "S/H/K" && (
                              <Wrench className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {worker.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {worker.role}
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
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
                  <label className="text-xs font-medium">
                    Mengenbonus (Quantity Bonus)
                  </label>
                  <Select
                    value={calcState.quantityBonusTier}
                    onValueChange={(val) =>
                      setCalcState((prev) => ({
                        ...prev,
                        quantityBonusTier: val,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Bonus Tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="08-12">Tier 08-12 (€150)</SelectItem>
                      <SelectItem value="12-36">Tier 12-36 (€330)</SelectItem>
                      <SelectItem value="36+">Tier 36+ (€600)</SelectItem>
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
                  <span>€ {calcState.calculation.bonus1.toLocaleString()}</span>
                </div>

                {calcState.calculation.bonus2 > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="flex items-center gap-1">
                      + Quantity Bonus{" "}
                      <span className="text-[10px] bg-green-100 px-1 rounded">
                        2. Bonus
                      </span>
                    </span>
                    <span>
                      € {calcState.calculation.bonus2.toLocaleString()}
                    </span>
                  </div>
                )}

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

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProjectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddProject}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
