"use client";

import { useState, useEffect, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Trophy,
} from "lucide-react";
// import { PRICING_MATRIX, ADDITIONAL_SERVICES } from "@/lib/pricing-data"; // Unused
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";

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
    description: "", // Added description for email paste
    customerNumber: "",
    customerPhone: "",
    customerEmail: "",
    estimatedHours: "", // Added estimated max hours
    workers: [] as string[], // Selected worker IDs
  });

  // Calculator State REMOVED

  // User Lists for Dropdowns
  const [partners, setPartners] = useState<any[]>([]);
  const [mediators, setMediators] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [availableWorkers, setAvailableWorkers] = useState<any[]>([]); // Added availableWorkers state
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
        // Mock Partners to ensure they are available for demo

        // Combine DB partners with mock partners (deduplicating by name if needed)
        // Combine DB partners with mock partners (deduplicating by name if needed)
        // Cleanup: Removed hardcoded mock partners.
        let combinedPartners: any[] = [];
        if (partnersData) {
          combinedPartners = partnersData.map((p) => ({
            id: p.id,
            name: p.full_name || p.email,
          }));
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

  // Effect to fetch available workers when Subcontractor or Partner changes
  useEffect(() => {
    const fetchWorkers = async () => {
      const supabase = createClient();
      // We need to fetch based on names because newProject.sub/partner stores NAME (or we check IDs if available)
      // The current state stores Names in .sub/.partner and IDs in .subId/.partnerId
      // The contacts table "company_name" likely matches the Name.

      const subName = newProject.sub;
      const partnerName = newProject.partner;

      const targetCompanies = [subName, partnerName].filter(Boolean);

      if (targetCompanies.length === 0) {
        setAvailableWorkers([]);
        return;
      }

      try {
        const { data: workers, error } = await supabase
          .from("contacts")
          .select("*")
          .eq("role", "worker")
          .in("company_name", targetCompanies);

        if (error) {
          console.error("Error fetching workers:", error);
          setAvailableWorkers([]);
        } else {
          setAvailableWorkers(workers || []);
        }
      } catch (err) {
        console.error("Unexpected error fetching workers:", err);
      }
    };

    fetchWorkers();
  }, [newProject.sub, newProject.partner]);

  // Effect to calculate totals REMOVED - Manual Entry now

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
    const fetchProjects = async () => {
      const supabase = createClient();
      try {
        // Fetch projects with joined Profiles for Partner and Broker names
        // Note: Supabase join syntax requires correct foreign key setup.
        // Assuming 'partner_id' references 'profiles.id' and 'broker_id' references 'profiles.id'.
        // We use alias 'partner:partner_id' and 'broker:broker_id' if relations are set up.
        // If not, we might fail. But let's try standard relation select.

        // "partner:partner_id(full_name)" maps the relation to a 'partner' object
        const { data, error } = await supabase.from("projects").select(`
            *,
            partner_profile:partner_id(full_name, email, company_name),
            broker_profile:broker_id(full_name, email)
          `);

        if (data && !error) {
          // Map DB projects to UI shape
          const mappedProjects = data.map((p: any) => ({
            project: p.title,
            address: p.description
              ? p.description.split("\n")[0].replace("Address: ", "")
              : "",
            contractor: p.description
              ? p.description.match(/Contractor: (.*)/)?.[1] || ""
              : "",
            // Use the joined profile name, fallback to generic if missing but ID exists
            partner:
              p.partner_profile?.company_name ||
              p.partner_profile?.full_name ||
              (p.partner_id ? "Partner" : ""),
            mediator:
              p.broker_profile?.full_name || (p.broker_id ? "Mediator" : ""),
            sub: p.description
              ? p.description.match(/Subcontractor: (.*?) \(/)?.[1] || ""
              : "",
            estimatedHours: p.description
              ? p.description.match(/Estimated Max Hours: (.*)/)?.[1] || "N/A"
              : "N/A",
            start: new Date(p.created_at || Date.now()).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "short", day: "numeric" },
            ),
            amount: `€ ${p.contract_value?.toLocaleString() || "0"}`,
            status: p.status === "active" ? "Scheduled" : p.status,
            statusColor: "bg-purple-600", // Default
            abnahme: "No",
            invoiceHeader: "Create Invoice",
            invoiceStatus: "Ready",
            workers: [],
            id: p.id,
          }));

          setProjects((prev) => {
            return mappedProjects.length > 0 ? mappedProjects : prev;
          });
        }
      } catch (error) {
        console.error("Error fetching projects from Supabase:", error);
      }
    };

    fetchProjects();

    const storedProjects = localStorage.getItem("prostruktion_projects_v1");
    if (storedProjects) {
      try {
        setProjects(JSON.parse(storedProjects));
      } catch (e) {
        setProjects([]);
      }
    } else {
      setProjects([]);
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
    // Cleared for clean slate
    setProjects([]);
    localStorage.removeItem("prostruktion_projects_v1");
  };

  // Auto-calculate Quantity Bonus based on Monthly Projects for selected Contractor OR Partner
  // Auto-calculate Quantity Bonus based on Monthly Projects for selected entity
  // Performance Logic:
  // - Partner: Sum of all projects done by their subcontractors.
  // - Mediator: Sum of all projects done by their subcontractors (assigned to this mediator).
  // - Contractor: Individual project count.
  // Bonus applies only if monthly count >= 8 (e.g., 5 projects = No Bonus).
  // Quantity Bonus logic removed as per new requirements (calculated subsequently)

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
      amount: isNaN(parseFloat(newProject.amount)) ? newProject.amount : `€ ${parseFloat(newProject.amount).toLocaleString()}`,
      description: newProject.description, // Store manual description
      // Save calculation details for reference - REMOVED calcState
      calculationDetails: null,
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
Customer Number: ${newProject.customerNumber}
Customer Phone: ${newProject.customerPhone}
Customer Email: ${newProject.customerEmail}
Address: ${newProject.address}
Estimated Max Hours: ${newProject.estimatedHours}
Subcontractor: ${newProject.sub} (ID: ${newProject.subId || "N/A"})
Contractor: ${newProject.contractor}
      `.trim();

      await supabase.from("projects").insert({
        title: newProject.project,
        description: newProject.description || metadata, // Use description if provided, else metadata
        contract_value: parseFloat(newProject.amount) || 0,
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
      description: "",
      customerNumber: "",
      customerPhone: "",
      customerEmail: "",
      estimatedHours: "",
      workers: [],
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

      // Update start date to now (Launch date)
      projectToUpdate.start = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      setProjects(updatedProjects);
      localStorage.setItem(
        "prostruktion_projects_v1",
        JSON.stringify(updatedProjects),
      );
    }
  };

  const handleActualHoursChange = (project: any, value: string) => {
    const updatedProjects = [...projects];
    // Find project by reference in the main array
    const mainIndex = updatedProjects.findIndex(p => p === project);

    if (mainIndex !== -1) {
      updatedProjects[mainIndex].actualHours = value;
      setProjects(updatedProjects);
      localStorage.setItem("prostruktion_projects_v1", JSON.stringify(updatedProjects));
    }
  };

  const handleProjectFieldChange = (project: any, field: string, value: any) => {
    const updatedProjects = [...projects];
    const mainIndex = updatedProjects.findIndex(p => p === project);

    if (mainIndex !== -1) {
      updatedProjects[mainIndex][field] = value;
      setProjects(updatedProjects);
      localStorage.setItem("prostruktion_projects_v1", JSON.stringify(updatedProjects));
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
                <TableHead className="w-[20%] font-semibold text-gray-700 dark:text-gray-300">
                  Name
                </TableHead>
                <TableHead className="w-[20%] font-semibold text-gray-700 dark:text-gray-300">
                  Subcontractor
                </TableHead>
                <TableHead className="w-[12%] font-semibold text-gray-700 dark:text-gray-300">
                  Scheduled date
                </TableHead>
                <TableHead className="w-[10%] font-semibold text-gray-700 dark:text-gray-300">
                  Penalty
                </TableHead>
                <TableHead className="w-[12%] font-semibold text-gray-700 dark:text-gray-300">
                  Amount
                </TableHead>
                <TableHead className="w-[12%] font-semibold text-gray-700 dark:text-gray-300">
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
                    colSpan={8}
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
                          <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200">
                            <TableCell colSpan={10} className="p-0">
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
                                        <span className="font-medium">{project.customerNumber || "N/A"}</span>

                                        <span className="text-muted-foreground text-xs">Phone:</span>
                                        <span className="font-medium">{project.customerPhone || "N/A"}</span>

                                        <span className="text-muted-foreground text-xs">Email:</span>
                                        <span className="font-medium truncate" title={project.customerEmail}>{project.customerEmail || "N/A"}</span>

                                        <span className="text-muted-foreground text-xs">Location:</span>
                                        <span className="font-medium">{project.address}</span>
                                      </div>
                                      {project.description && (
                                        <div className="pt-2 mt-2 border-t border-dashed flex-1 flex flex-col min-h-0">
                                          <span className="text-xs text-muted-foreground block mb-2 shrink-0">Notes:</span>
                                          <p className="text-xs whitespace-pre-wrap overflow-y-auto text-gray-600 flex-1 pr-1 max-h-[250px]">
                                            {project.description}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Column 2: Assigned Workers (Existing) */}
                                <div className="space-y-4 h-full flex flex-col">
                                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <HardHat className="h-3 w-3" /> Assigned Workers
                                  </h4>

                                  <div className="bg-white dark:bg-gray-950 rounded-lg border p-3 text-sm space-y-2 shadow-sm mb-1">
                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                      <span className="text-muted-foreground text-xs">Contractor:</span>
                                      <span className="font-medium">{project.contractor || "N/A"}</span>

                                      <span className="text-muted-foreground text-xs">Partner:</span>
                                      <span className="font-medium">{project.partner || "N/A"}</span>

                                      <span className="text-muted-foreground text-xs">Mediator:</span>
                                      <span className="font-medium">{project.mediator || "N/A"}</span>
                                    </div>
                                  </div>

                                  {project.workers && project.workers.length > 0 ? (
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
                                          {project.workers.map((workerId: string) => (
                                            <TableRow key={workerId} className="h-8 hover:bg-transparent border-0">
                                              <TableCell className="py-1">
                                                <div className="flex items-center gap-2">
                                                  <Avatar className="h-5 w-5 border">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${workerId}`} />
                                                    <AvatarFallback className="text-[9px]">{workerId.charAt(0)}</AvatarFallback>
                                                  </Avatar>
                                                  <span className="text-xs font-medium truncate max-w-[100px]">Worker {workerId}</span>
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
                                      No workers assigned yet.
                                    </div>
                                  )}

                                  {/* Estimated & Actual Hours Footer */}
                                  <div className="bg-gray-50 dark:bg-gray-900/10 rounded-lg border p-3 flex flex-col gap-2 mt-auto">
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-medium text-gray-700 dark:text-gray-300">Estimated Max Hours:</span>
                                      <span className="font-mono font-semibold">{project.estimatedHours || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-medium text-gray-700 dark:text-gray-300">Actual Hours:</span>
                                      <span className="w-16 border-b border-gray-400 dark:border-gray-600"></span>
                                    </div>
                                  </div>
                                </div>

                                {/* Column 3: Bonus & Performance Stats */}
                                <div className="space-y-4 h-full flex flex-col">
                                  <div className="h-full flex flex-col">
                                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                      <Trophy className="h-3 w-3" /> Bonus & Performance
                                    </h4>

                                    <div className="bg-white dark:bg-gray-950 rounded-lg border p-3 flex flex-col h-full shadow-sm">
                                      <div className="flex-1 space-y-6">
                                        {/* 1. Qualitäts- und Termintreuebonus */}
                                        <div className="space-y-2">
                                          <h5 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                            1. Qualitäts- und Termintreuebonus
                                          </h5>
                                          <div className="bg-gray-50 dark:bg-gray-900/10 rounded p-2 flex items-center justify-between border">
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Bonus Amount</span>
                                            <span className="text-xs font-mono text-muted-foreground font-semibold">+ € 0</span>
                                          </div>
                                        </div>

                                        {/* 2. Mengenzuschlag & Total Calculation */}
                                        {(() => {
                                          const pDate = new Date(project.start);
                                          const pMonth = pDate.toLocaleString("default", { month: "short" });

                                          // Count logic
                                          const count = projects.filter(p => {
                                            const d = new Date(p.start);
                                            return d.getMonth() === pDate.getMonth() &&
                                              d.getFullYear() === pDate.getFullYear() &&
                                              (p.partner === project.partner || p.contractor === project.contractor)
                                          }).length;

                                          let tier = "None";
                                          let bonus = 0;
                                          if (count >= 36) { tier = "36+"; bonus = 200; }
                                          else if (count >= 12) { tier = "12-36"; bonus = 100; }
                                          else if (count >= 8) { tier = "08-12"; bonus = 50; }

                                          const qualityBonus = 0;
                                          const totalBonus = qualityBonus + bonus;

                                          return (
                                            <>
                                              <div className="space-y-2">
                                                <h5 className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                                                  2. Mengenzuschlag
                                                </h5>
                                                <div className="bg-blue-50 dark:bg-blue-900/10 rounded p-2 text-xs space-y-1">
                                                  <div className="flex justify-between font-semibold text-blue-800 dark:text-blue-300">
                                                    <span>Mengenzuschlag</span>
                                                    <span>Tier: {tier}</span>
                                                  </div>
                                                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                                                    <span>Projects ({pMonth}):</span>
                                                    <span>{count}</span>
                                                  </div>
                                                  <div className="flex justify-between font-bold text-blue-700 dark:text-blue-300 border-t border-blue-200 mt-1 pt-1">
                                                    <span>Bonus Amount:</span>
                                                    <span>€ {bonus}</span>
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="mt-auto pt-4 border-t border-dashed">
                                                <div className="flex justify-between items-center text-sm">
                                                  <span className="font-bold text-gray-900 dark:text-gray-100">Total Bonus</span>
                                                  <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                                                    € {totalBonus}
                                                  </span>
                                                </div>
                                              </div>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                        }
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
                  Name
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
                  const { penalty, daysLate, isOverdue, penaltyPercentage, netAmount } =
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
                        <TableCell className="font-medium">
                          €{" "}
                          {netAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
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
                        <TableRow className="bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200">
                          <TableCell colSpan={10} className="p-0">
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
                                      <span className="font-medium truncate" title={item.customerEmail}>{item.customerEmail || "N/A"}</span>

                                      <span className="text-muted-foreground text-xs">Location:</span>
                                      <span className="font-medium">{item.address}</span>
                                    </div>
                                    {item.description && (
                                      <div className="pt-2 mt-2 border-t border-dashed flex-1 flex flex-col min-h-0">
                                        <span className="text-xs text-muted-foreground block mb-2 shrink-0">Notes:</span>
                                        <p className="text-xs whitespace-pre-wrap overflow-y-auto text-gray-600 flex-1 pr-1 max-h-[250px]">
                                          {item.description}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Column 2: Assigned Workers (Existing) */}
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
                                                <span className="text-xs font-medium truncate max-w-[100px]">Worker {workerId}</span>
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
                                    No workers assigned yet.
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
                                    <div className="flex items-center gap-1">
                                      <Input
                                        className="h-6 w-20 text-xs text-right bg-white dark:bg-gray-950 px-1 py-0 h-7"
                                        placeholder="0"
                                        value={item.actualHours || ""}
                                        onChange={(e) => handleActualHoursChange(item, e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Column 3: Bonus & Performance Stats */}
                              <div className="space-y-4 h-full flex flex-col">
                                <div className="h-full flex flex-col">
                                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Trophy className="h-3 w-3" /> Bonus & Performance
                                  </h4>

                                  <div className="bg-white dark:bg-gray-950 rounded-lg border p-3 flex flex-col h-full shadow-sm">
                                    <div className="flex-1 space-y-6">
                                      {/* 1. Qualitäts- und Termintreuebonus */}
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <h5 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            1. Qualitäts- und Termintreuebonus
                                            <Checkbox
                                              checked={item.qualityBonusChecked || false}
                                              onCheckedChange={(checked) => handleProjectFieldChange(item, 'qualityBonusChecked', checked)}
                                              className="h-3.5 w-3.5"
                                            />
                                          </h5>
                                        </div>

                                        <div className={`bg-gray-50 dark:bg-gray-900/10 rounded p-2 border space-y-2 ${!item.qualityBonusChecked ? 'opacity-50' : ''}`}>
                                          {/* Status Badge */}
                                          <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Status:</span>
                                            <Badge
                                              variant={isOverdue ? "destructive" : "secondary"}
                                              className={`h-5 px-1.5 ${isOverdue ? "bg-red-100 text-red-700 hover:bg-red-200 border-0" : "bg-green-100 text-green-700 hover:bg-green-200 border-0"}`}
                                            >
                                              {isOverdue ? "Overdue" : "On Time"}
                                            </Badge>
                                          </div>

                                          {/* Indoor Units Input */}
                                          <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Indoor Units:</span>
                                            <Input
                                              type="number"
                                              className="h-6 w-16 text-right text-xs px-1"
                                              value={item.indoorUnits || ""}
                                              onChange={(e) => handleProjectFieldChange(item, 'indoorUnits', e.target.value)}
                                              placeholder="0"
                                              disabled={!item.qualityBonusChecked}
                                            />
                                          </div>

                                          {/* Calculated Amount */}
                                          <div className="flex justify-between items-center text-xs pt-2 border-t border-dashed">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Bonus Amount</span>
                                            <span className="font-mono font-semibold text-blue-600">
                                              + € {((parseInt(item.indoorUnits) || 0) * 50).toLocaleString()}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* 2. Mengenzuschlag & Total Calculation */}
                                      {(() => {
                                        const pDate = new Date(item.start);
                                        const pMonth = pDate.toLocaleString("default", { month: "short" });

                                        // Count logic - Based on Subcontractor's Performance (Monthly)
                                        const count = projects.filter(p => {
                                          const d = new Date(p.start);
                                          return d.getMonth() === pDate.getMonth() &&
                                            d.getFullYear() === pDate.getFullYear() &&
                                            (p.sub === item.sub) // Filter by Subcontractor
                                        }).length;

                                        let tier = "None";
                                        let quantityBonusAmount = 0;
                                        if (count >= 36) { tier = "36+"; quantityBonusAmount = 200; }
                                        else if (count >= 12) { tier = "12-36"; quantityBonusAmount = 100; }
                                        else if (count >= 8) { tier = "08-12"; quantityBonusAmount = 50; }

                                        // Totals
                                        const qualityAmount = item.qualityBonusChecked ? (parseInt(item.indoorUnits) || 0) * 50 : 0;
                                        const quantityAmountFinal = item.quantityBonusChecked ? quantityBonusAmount : 0;
                                        const totalBonus = qualityAmount + quantityAmountFinal;

                                        return (
                                          <>
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <h5 className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                                  2. Mengenzuschlag
                                                  <Checkbox
                                                    checked={item.quantityBonusChecked || false}
                                                    onCheckedChange={(checked) => handleProjectFieldChange(item, 'quantityBonusChecked', checked)}
                                                    className="h-3.5 w-3.5"
                                                  />
                                                </h5>
                                              </div>

                                              <div className={`bg-blue-50 dark:bg-blue-900/10 rounded p-2 text-xs space-y-1 ${!item.quantityBonusChecked ? 'opacity-50' : ''}`}>
                                                <div className="flex justify-between font-semibold text-blue-800 dark:text-blue-300">
                                                  <span>Mengenzuschlag</span>
                                                  <span>Tier: {tier}</span>
                                                </div>
                                                <div className="flex justify-between text-blue-600 dark:text-blue-400">
                                                  <span>Projects ({pMonth}):</span>
                                                  <span>{count}</span>
                                                </div>
                                                <div className="flex justify-between font-bold text-blue-700 dark:text-blue-300 border-t border-blue-200 mt-1 pt-1">
                                                  <span>Bonus Amount:</span>
                                                  <span>€ {quantityBonusAmount}</span>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="mt-auto pt-4 border-t border-dashed">
                                              <div className="flex justify-between items-center text-sm">
                                                <span className="font-bold text-gray-900 dark:text-gray-100">Total Bonus</span>
                                                <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                                                  € {totalBonus.toLocaleString()}
                                                </span>
                                              </div>
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
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
      </div >

      {/* Success Modal */}
      < Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen} >
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
      </Dialog >
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label htmlFor="customerNumber" className="text-xs font-medium">
                    Customer Number
                  </label>
                  <Input
                    id="customerNumber"
                    value={newProject.customerNumber}
                    onChange={(e) =>
                      setNewProject({ ...newProject, customerNumber: e.target.value })
                    }
                    placeholder="e.g. KD-12345"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="customerPhone" className="text-xs font-medium">
                    Customer Phone
                  </label>
                  <Input
                    id="customerPhone"
                    value={newProject.customerPhone}
                    onChange={(e) =>
                      setNewProject({ ...newProject, customerPhone: e.target.value })
                    }
                    placeholder="e.g. +49 123 456789"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="customerEmail" className="text-xs font-medium">
                    Customer Email
                  </label>
                  <Input
                    id="customerEmail"
                    value={newProject.customerEmail}
                    onChange={(e) =>
                      setNewProject({ ...newProject, customerEmail: e.target.value })
                    }
                    placeholder="e.g. client@example.com"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label htmlFor="address" className="text-xs font-medium">
                    Installation Location
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
                <div className="border rounded-md p-2 max-h-[300px] overflow-y-auto space-y-1 bg-gray-50/50">
                  {/* Header Row */}
                  <div className="flex items-center text-[10px] font-semibold text-muted-foreground px-2 py-1 border-b mb-2 bg-gray-100/50 rounded-t">
                    <div className="w-6"></div>
                    <div className="w-[140px]">Name</div>
                    <div className="w-[100px]">Role / Trade</div>
                    <div className="w-[80px] text-center">A1</div>
                    <div className="w-[100px] text-center">Certification</div>
                    <div className="w-[70px] text-center">Completed</div>
                    <div className="w-[70px] text-center">Complaints</div>
                    <div className="w-[60px] text-center">Success</div>
                  </div>

                  {availableWorkers.length > 0 ? (
                    availableWorkers.map((worker) => (
                      <div
                        key={worker.id}
                        className="flex items-center p-2 hover:bg-gray-100 rounded border-b last:border-0 bg-white"
                      >
                        <Checkbox
                          id={`worker-${worker.id}`}
                          className="mr-3"
                          checked={newProject.workers.includes(worker.name)}
                          onCheckedChange={(checked) => {
                            setNewProject((prev) => {
                              const newWorkers = checked
                                ? [...prev.workers, worker.name]
                                : prev.workers.filter((w) => w !== worker.name);
                              return { ...prev, workers: newWorkers };
                            });
                          }}
                        />

                        {/* Name & Avatar */}
                        <div className="w-[140px] flex items-center gap-2">
                          <Avatar className="h-7 w-7 border">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.name}`} />
                            <AvatarFallback>{worker.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="text-sm font-medium leading-none truncate" title={worker.name}>
                            {worker.name}
                          </div>
                        </div>

                        {/* Role / Trade */}
                        <div className="w-[100px] text-xs text-muted-foreground capitalize truncate" title={worker.trade || worker.role || "Worker"}>
                          {worker.trade || worker.role || "Worker"}
                        </div>

                        {/* A1 Status */}
                        <div className="w-[80px] text-center">
                          <Badge variant="secondary" className="text-[9px] bg-gray-50 text-gray-500 hover:bg-gray-100 font-normal border px-1">
                            {worker.a1Status || "No File"}
                          </Badge>
                        </div>

                        {/* Certification */}
                        <div className="w-[100px] text-center">
                          <Badge variant="secondary" className="text-[9px] bg-gray-50 text-gray-500 hover:bg-gray-100 font-normal border px-1">
                            {worker.certStatus || "No Certificate"}
                          </Badge>
                        </div>

                        {/* Stats */}
                        <div className="w-[70px] text-center text-xs flex items-center justify-center gap-1 text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" /> {worker.completedProjects || 0}
                        </div>
                        <div className="w-[70px] text-center text-xs flex items-center justify-center gap-1 text-muted-foreground">
                          <AlertCircle className="h-3 w-3" /> {worker.complaints || 0}
                        </div>
                        <div className="w-[60px] text-center text-xs text-green-600 font-medium">
                          {worker.successRate || 100}%
                        </div>

                      </div>
                    ))
                  ) : (
                    <div className="text-center text-sm text-muted-foreground p-8 flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground/50" />
                      <p>{newProject.sub || newProject.partner ? "No workers found for selected companies." : "Select Subcontractor or Partner to see workers."}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Manual Pricing Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Project Pricing & Details
            </h3>

            <div className="grid gap-6">
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Description / Email Paste
                </label>
                <Textarea
                  id="description"
                  placeholder="Paste the project assignment email here..."
                  className="min-h-[200px] font-mono text-xs"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="estimatedHours" className="text-sm font-medium">
                  Estimated Max Hours
                </label>
                <Input
                  id="estimatedHours"
                  placeholder="e.g. 40"
                  value={newProject.estimatedHours}
                  onChange={(e) => setNewProject({ ...newProject, estimatedHours: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">
                  Total Price (€)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">€</span>
                  <Input
                    id="amount"
                    placeholder="0.00"
                    className="pl-8"
                    value={newProject.amount}
                    onChange={(e) => setNewProject({ ...newProject, amount: e.target.value })}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Enter the total project value including all services.
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
    </div >
  );
}
