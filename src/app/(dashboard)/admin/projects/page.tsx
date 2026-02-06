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
  PlusCircle,
  Gift,
} from "lucide-react";
import { PRICING_MATRIX, ADDITIONAL_SERVICES } from "@/lib/pricing-data";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
// import { sendInvoiceEmail } from "@/app/actions-email"; // Removed

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper to parse German currency strings (e.g. "4.820,00" -> 4820.00)
// Also handles "4.820" -> 4820 (treats dot as thousands separator)
const parseGermanFloat = (str: string | number | undefined | null) => {
  if (typeof str === "number") return str;
  if (!str) return 0;

  const val = str.toString();

  // 1. Remove all non-numeric characters except '.' and ',' and '-'
  // This removes € symbols, spaces, etc.
  const clean = val.replace(/[^0-9.,-]/g, "");

  // 2. Remove dots (thousands separators)
  const noDots = clean.replace(/\./g, "");

  // 3. Replace comma with dot (decimal separator)
  const withDecimal = noDots.replace(",", ".");

  return parseFloat(withDecimal) || 0;
};

export default function AdminProjects() {
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);

  // Invoice Editing State
  const [activeInvoiceTab, setActiveInvoiceTab] = useState("partner");
  const [invoiceEditState, setInvoiceEditState] = useState({
    projectValue: 0,
    qualityBonus: { enabled: true, amount: 0, label: "" },
    quantityBonus: { enabled: true, amount: 0, label: "" },
    subQualityBonus: { enabled: false, amount: 0, label: "" },
    subQuantityBonus: { enabled: false, amount: 0, label: "" },
    partnerSharePercent: 15,
    mediatorSharePercent: 10,
    subcontractorFee: 0,
    quantityCount: 0,
    subQuantityCount: 0,
    reviewed: {
      partner: false,
      mediator: false,
      subcontractor: false,
      prostruktion: false,
    },
  });

  // Helper to count monthly projects for a partner or subcontractor
  const getMonthlyCount = (name: string, role: "partner" | "sub") => {
    if (!name) return 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return projects.filter((p) => {
      const pDate = new Date(p.start);
      const matchesName =
        role === "partner"
          ? p.partner === name || p.partnerId === name
          : p.sub === name || p.subId === name;

      return (
        matchesName &&
        pDate.getMonth() === currentMonth &&
        pDate.getFullYear() === currentYear &&
        p.status !== "Scheduled"
      );
    }).length;
  };

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
    amount: "2660", // Default calculated for 0 units and default work types
    description: "", // Added description for email paste
    customerNumber: "",
    customerPhone: "",
    customerEmail: "",
    estimatedHours: "", // Added estimated max hours
    workers: [] as string[], // Selected worker IDs
    indoorUnits: 0,
    selectedWorkTypes: [
      "montage",
      "hydraulik",
      "kaelteInbetriebnahme",
      "elektroAnschluss",
      "elektroInbetriebnahme",
      "bohrungen",
      "kleinteile",
      "kaeltemittel",
    ],
    selectedAdditionalServices: [] as string[],
  });

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

  // Additional Work State
  const [additionalWorkInputs, setAdditionalWorkInputs] = useState<{
    [key: number]: { description: string; price: string };
  }>({});

  const handleAdditionalWorkInputChange = (
    index: number,
    field: "description" | "price",
    value: string,
  ) => {
    setAdditionalWorkInputs((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [field]: value,
      },
    }));
  };

  const handleAddAdditionalWorkItem = (index: number, project: any) => {
    const input = additionalWorkInputs[index];
    if (!input || !input.description || !input.price) return;

    const newWorkItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: input.description,
      price: parseFloat(input.price),
      receiptName: null as string | null, // Placeholder for file name
    };

    // Check for file input
    const fileInput = document.getElementById(
      `receipt-upload-${index}`,
    ) as HTMLInputElement;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      newWorkItem.receiptName = fileInput.files[0].name;
      // Note: Actual file upload/storage logic would go here.
    }

    const updatedProjects = [...projects];
    // Find the actual project index in the main list if filtered, but here 'projects' is the source
    // note: 'i' in the map loop corresponds to 'paginatedProjects' index usually, but here likely matches if no filter.
    // Ideally we should find by ID, but existing logic uses 'i' from map.
    // The map loop in render uses: `paginatedProjects...map((item, i) => ...)`
    // And `handleStatusChange` uses `i`.
    // However, `setProjects` updates the main `projects` array.
    // We should use `handleProjectFieldChange` logic finding by object reference if possible, but simpler here:

    const mainIndex = updatedProjects.findIndex((p) => p === project);
    if (mainIndex !== -1) {
      if (!updatedProjects[mainIndex].additionalWorks) {
        updatedProjects[mainIndex].additionalWorks = [];
      }
      updatedProjects[mainIndex].additionalWorks.push(newWorkItem);

      setProjects(updatedProjects);
      localStorage.setItem(
        "prostruktion_projects_v1",
        JSON.stringify(updatedProjects),
      );
    }

    // Clear input
    setAdditionalWorkInputs((prev) => ({
      ...prev,
      [index]: { description: "", price: "" },
    }));
    if (fileInput) fileInput.value = "";
  };

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetProjectForm = () => {
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
      scheduledStart: "",
      workers: [],
      indoorUnits: 0,
      selectedWorkTypes: [
        "montage",
        "hydraulik",
        "kaelteInbetriebnahme",
        "elektroAnschluss",
        "elektroInbetriebnahme",
        "bohrungen",
        "kleinteile",
        "kaeltemittel",
      ],
      selectedAdditionalServices: [],
      amount: "2660",
      description: "",
      customerNumber: "",
      customerPhone: "",
      customerEmail: "",
      estimatedHours: "",
    });
    setIsEditing(false);
    setEditingId(null);
  };

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

        // 1. Fetch all relevant PROFILES
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email, role");

        if (profilesError)
          console.warn("Error fetching profiles:", profilesError);

        // 2. Fetch all relevant CONTACTS
        // Note: Assuming 'contacts' table is used for external entities
        const { data: contacts, error: contactsError } = await supabase
          .from("contacts")
          .select("id, name, company_name, role, mediator_id, metrics");

        if (contactsError)
          console.warn("Error fetching contacts:", contactsError);

        // Helper to merge sources
        const mergeSources = (
          roleKeys: string[],
          localKey: string,
          isMediator = false,
        ) => {
          const merged = new Map();

          // Add from Profiles
          if (profiles) {
            profiles
              .filter((p) => roleKeys.includes(p.role))
              .forEach((p) => {
                const name = p.full_name || p.email;
                if (name) {
                  merged.set(name, { id: p.id, name });
                }
              });
          }

          // Add from Contacts
          if (contacts) {
            contacts
              .filter((c) => roleKeys.includes(c.role))
              .forEach((c) => {
                const name = c.company_name || c.name;
                if (name) {
                  // If subcontractor, try to attach mediator info if available (mapped later if needed)
                  // We preserve existing entry if exists (profile takes precedence? or contacts? let contacts overwrite profile if duplicate names for external mostly)
                  // But let's prioritize existing (Profiles) so we don't duplicate if ID matches.
                  // Actually using Name as key to dedupe.
                  merged.set(name, {
                    id: c.id,
                    name,
                    // If it's a subcontractor, pass mediator_id or lookup name if we can (simplified later)
                    mediatorId:
                      c.mediator_id || (c.metrics as any)?.manual_mediator_id,
                  });
                }
              });
          }

          // Add from LocalStorage - REMOVED

          return Array.from(merged.values());
        };

        // --- PARTNERS ---
        // Profiles: 'partner'
        // Contacts: 'partner'
        const combinedPartners = mergeSources(
          ["partner"],
          "prostruktion_partners",
        );
        setPartners(combinedPartners);

        // --- MEDIATORS ---
        // Profiles: 'broker', 'mediator'
        // Contacts: 'broker', 'mediator'
        const combinedMediators = mergeSources(
          ["broker", "mediator"],
          "prostruktion_mediators",
        );
        setMediators(combinedMediators);

        // --- SUBCONTRACTORS ---
        // Profiles: 'subcontractor'
        // Contacts: 'subcontractor' (commonly external)
        const rawSubs = mergeSources(
          ["subcontractor"],
          "prostruktion_subcontractors",
        );

        // Enhance Subs with Mediator Name if mediatorId exists (cross-reference loaded mediators)
        const enhancedSubs = rawSubs.map((sub) => {
          if (sub.mediator) return sub; // already has name from local
          if (sub.mediatorId) {
            const med = combinedMediators.find((m) => m.id === sub.mediatorId);
            if (med) return { ...sub, mediator: med.name };
          }
          return sub;
        });
        setSubcontractors(enhancedSubs);

        // --- CONTRACTORS ---
        // Profiles: 'contractor'
        // Contacts: 'contractor'
        const combinedContractors = mergeSources(
          ["contractor"],
          "prostruktion_contractors",
        );
        setContractors(combinedContractors);
      } catch (e) {
        console.error("Error in fetchDropdownUsers:", e);
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
          .from("workers")
          .select("*")
          .in("company_name", targetCompanies)
          .eq("status", "Active");

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
    const amount = parseGermanFloat(amountStr);
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
        // Fetch projects with related data (using simple select, no FK joins)
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select(
            `
            *,
            project_work_types(work_type_key, price),
            project_additional_services(service_id, price),
            project_workers(worker_id)
          `,
          )
          .order("created_at", { ascending: false });

        if (projectsData && !projectsError) {
          // Manual Joins: Fetch related data since FKs might be missing in DB

          // 1. Gather IDs
          const customerIds = Array.from(
            new Set(projectsData.map((p) => p.customer_id).filter(Boolean)),
          );
          const contactIds = Array.from(
            new Set(
              projectsData
                .flatMap((p) => [p.contractor_id, p.subcontractor_id])
                .filter(Boolean),
            ),
          );
          const profileIds = Array.from(
            new Set(
              projectsData
                .flatMap((p) => [p.partner_id, p.broker_id])
                .filter(Boolean),
            ),
          );

          // Fetch Customers
          let customersMap: Record<string, any> = {};
          if (customerIds.length > 0) {
            const { data: customers } = await supabase
              .from("customers")
              .select("id, customer_number, name, email, phone, address")
              .in("id", customerIds);
            if (customers) {
              customersMap = customers.reduce(
                (acc, c) => {
                  acc[c.id] = c;
                  return acc;
                },
                {} as Record<string, any>,
              );
            }
          }

          // Fetch Contacts (Contractors/Subcontractors/Partners/Brokers)
          let contactsMap: Record<string, any> = {};
          if (contactIds.length > 0) {
            const { data: contacts } = await supabase
              .from("contacts")
              .select("id, name, company_name")
              .in("id", contactIds);
            if (contacts) {
              contactsMap = contacts.reduce(
                (acc, c) => {
                  acc[c.id] = c;
                  return acc;
                },
                {} as Record<string, any>,
              );
            }
          }

          // Fetch Partners and Brokers from profiles (if they are authenticable users)

          let profilesMap: Record<string, any> = {};
          if (profileIds.length > 0) {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, full_name, email, company_name")
              .in("id", profileIds);
            if (profiles) {
              profilesMap = profiles.reduce(
                (acc, p) => {
                  acc[p.id] = p;
                  return acc;
                },
                {} as Record<string, any>,
              );
            }
          }

          // Map DB projects to UI shape
          const mappedProjects = projectsData.map((p: any) => {
            const customer = customersMap[p.customer_id];
            const contractor = contactsMap[p.contractor_id];
            const subcontractor = contactsMap[p.subcontractor_id];
            const partner = profilesMap[p.partner_id];
            const mediator = profilesMap[p.broker_id];

            // Extract work types and services
            const selectedWorkTypes =
              p.project_work_types?.map((wt: any) => wt.work_type_key) || [];
            const selectedAdditionalServices =
              p.project_additional_services?.map((s: any) => s.service_id) ||
              [];

            // Determine status color
            let statusColor = "bg-purple-600 text-white";
            if (p.status === "In Progress" || p.status === "active")
              statusColor = "bg-orange-500 text-white";
            if (p.status === "In Abnahme")
              statusColor = "bg-yellow-500 text-black";
            if (p.status === "Finished")
              statusColor = "bg-green-600 text-white";

            // Resolve Partner and Mediator (Profile first, then Contact)
            const partnerProfile = profilesMap[p.partner_id];
            const partnerContact = contactsMap[p.partner_id];
            const partnerName =
              partnerProfile?.company_name ||
              partnerProfile?.full_name ||
              partnerContact?.company_name ||
              partnerContact?.name ||
              "";

            const mediatorProfile = profilesMap[p.broker_id];
            const mediatorContact = contactsMap[p.broker_id];
            const mediatorName =
              mediatorProfile?.full_name ||
              mediatorContact?.name ||
              mediatorContact?.company_name ||
              "";

            return {
              id: p.id,
              project: p.title,
              address: p.address || "",
              description: p.description || "",
              contractor: contractor?.company_name || contractor?.name || "",
              partner: partnerName,
              partnerId: p.partner_id,
              mediator: mediatorName,
              mediatorId: p.broker_id,
              sub: subcontractor?.company_name || subcontractor?.name || "",
              subId: p.subcontractor_id,
              customerNumber: customer?.customer_number || "",
              customerEmail: customer?.email || "",
              customerPhone: customer?.phone || "",
              estimatedHours: p.estimated_hours || "",
              indoorUnits: p.indoor_units || 0,
              selectedWorkTypes,
              selectedAdditionalServices,
              start: p.actual_start
                ? new Date(p.actual_start).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : new Date(p.created_at || Date.now()).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "short", day: "numeric" },
                  ),
              scheduledStart: p.scheduled_start || "",
              amount: `€ ${p.contract_value?.toLocaleString("de-DE") || "0"}`,
              status: p.status || "Scheduled",
              statusColor,
              abnahme: p.status === "In Abnahme" ? "Yes" : "No",
              invoiceHeader: "Create Invoice",
              invoiceStatus: "Ready",
              workers: p.project_workers?.map((pw: any) => pw.worker_id) || [],
            };
          });

          setProjects(mappedProjects);
          localStorage.setItem(
            "prostruktion_projects_v1",
            JSON.stringify(mappedProjects),
          );
          return;
        } else if (projectsError) {
          console.error("Supabase fetch error:", projectsError);
        }
      } catch (error) {
        console.error("Error fetching projects from Supabase:", error);
      }

      // Fallback to localStorage if Supabase fetch fails or returns empty
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
    };

    fetchProjects();

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
    if (!newProject.project) return;

    const supabase = createClient();
    let supabaseProjectId: string | null = editingId;

    try {
      // 1. Create or find customer (Now we have a customer_id column)
      let customerId: string | null = null;
      if (newProject.customerNumber || newProject.customerEmail) {
        // Check if customer exists
        const { data: existingCustomer } = await supabase
          .from("customers")
          .select("id")
          .eq("customer_number", newProject.customerNumber)
          .maybeSingle();

        if (existingCustomer) {
          customerId = existingCustomer.id;
        } else {
          // Create new customer
          const { data: newCustomer, error: customerError } = await supabase
            .from("customers")
            .insert({
              customer_number: newProject.customerNumber || null,
              name: newProject.project, // Use project name as customer name fallback
              email: newProject.customerEmail || null,
              phone: newProject.customerPhone || null,
              address: newProject.address || null,
            })
            .select("id")
            .single();

          if (!customerError && newCustomer) {
            customerId = newCustomer.id;
          }
        }
      }

      // 2. Insert or Update project
      const projectDataToSave = {
        title: newProject.project,
        address: newProject.address || null,
        description: newProject.description || null,
        contract_value: parseGermanFloat(newProject.amount) || 0,
        scheduled_start: newProject.scheduledStart || null,
        estimated_hours: newProject.estimatedHours
          ? parseFloat(newProject.estimatedHours)
          : null,
        indoor_units: newProject.indoorUnits || 0,
        customer_id: customerId,
        partner_id: newProject.partnerId || null,
        broker_id: newProject.mediatorId || null,
        contractor_id: newProject.contractorId || null,
        subcontractor_id: newProject.subId || null,
        // Status managed separately usually, but if new:
        ...(isEditing ? {} : { status: "Scheduled" }),
      };

      if (isEditing && editingId) {
        // UPDATE
        const { error: updateError } = await supabase
          .from("projects")
          .update(projectDataToSave)
          .eq("id", editingId);

        if (updateError) throw updateError;
        supabaseProjectId = editingId;

        // Clear existing related data to overwrite
        await supabase
          .from("project_work_types")
          .delete()
          .eq("project_id", editingId);
        await supabase
          .from("project_additional_services")
          .delete()
          .eq("project_id", editingId);
        await supabase
          .from("project_workers")
          .delete()
          .eq("project_id", editingId);
      } else {
        // INSERT
        const { data: insertedProject, error: projectError } = await supabase
          .from("projects")
          .insert({ ...projectDataToSave, status: "Scheduled" })
          .select("id")
          .single();

        if (projectError) throw projectError;
        if (insertedProject) supabaseProjectId = insertedProject.id;
      }

      if (supabaseProjectId) {
        // 3. Insert work types (Assuming tables exist, kept as is)
        if (newProject.selectedWorkTypes.length > 0) {
          const workTypeInserts = newProject.selectedWorkTypes.map((type) => {
            const units = newProject.indoorUnits || 0;
            const price =
              PRICING_MATRIX.baseCosts[units]?.[
                type as keyof (typeof PRICING_MATRIX.baseCosts)[0]
              ] || 0;
            return {
              project_id: supabaseProjectId,
              work_type_key: type,
              price: price,
            };
          });

          // Check if table exists is hard, just try/catch the insert
          try {
            await supabase.from("project_work_types").insert(workTypeInserts);
          } catch (err) {
            console.warn("Could not save work types", err);
          }
        }

        // 4. Insert additional services
        if (newProject.selectedAdditionalServices.length > 0) {
          const serviceInserts = newProject.selectedAdditionalServices.map(
            (serviceId) => {
              const service = ADDITIONAL_SERVICES.find(
                (s) => s.id === serviceId,
              );
              return {
                project_id: supabaseProjectId,
                service_id: serviceId,
                price: service?.price || 0,
              };
            },
          );
          try {
            await supabase
              .from("project_additional_services")
              .insert(serviceInserts);
          } catch (err) {
            console.warn("Could not save services", err);
          }
        }

        // 5. Insert workers
        if (newProject.workers.length > 0) {
          const workerInserts = newProject.workers.map((workerId) => ({
            project_id: supabaseProjectId,
            worker_id: workerId,
          }));
          try {
            await supabase.from("project_workers").insert(workerInserts);
          } catch (err) {
            console.warn("Could not save workers", err);
          }
        }
      }

      // Update local state for UI
      const projectData = {
        ...newProject,
        id: supabaseProjectId, // Store Supabase ID
        status: isEditing ? undefined : "Scheduled", // Don't override status if editing
        statusColor: isEditing ? undefined : "bg-purple-600 text-white",
        abnahme: "No", // simplified
        invoiceHeader: "Create Invoice",
        invoiceStatus: "Ready",
        amount: isNaN(parseGermanFloat(newProject.amount))
          ? newProject.amount
          : `€ ${parseGermanFloat(newProject.amount).toLocaleString("de-DE")}`,
        description: newProject.description,
        calculationDetails: null,
      };

      if (isEditing) {
        const updatedProjects = projects.map((p) =>
          p.id === editingId
            ? {
                ...p,
                ...projectData,
                status: p.status,
                statusColor: p.statusColor,
              }
            : p,
        );
        setProjects(updatedProjects);
        localStorage.setItem(
          "prostruktion_projects_v1",
          JSON.stringify(updatedProjects),
        );
      } else {
        const updatedProjects = [projectData, ...projects];
        setProjects(updatedProjects);
        localStorage.setItem(
          "prostruktion_projects_v1",
          JSON.stringify(updatedProjects),
        );
      }

      setAddProjectOpen(false);
      resetProjectForm();
    } catch (e: any) {
      console.error("Failed to save project to Supabase:", e);
      alert("Failed to save project: " + (e.message || "Unknown error"));
    }
  };

  const handleEditClick = (project: any) => {
    setIsEditing(true);
    setEditingId(project.id);

    // Parse amount to be editable string
    const rawAmount = parseGermanFloat(project.amount).toString();

    setNewProject({
      project: project.project,
      address: project.address,
      contractor: project.contractor,
      contractorId:
        project.contractorId ||
        contractors.find((c) => c.name === project.contractor)?.id ||
        "",
      partner: project.partner,
      partnerId:
        project.partnerId ||
        partners.find((p) => p.name === project.partner)?.id ||
        "",
      mediator: project.mediator,
      mediatorId:
        project.mediatorId ||
        mediators.find((m) => m.name === project.mediator)?.id ||
        "",
      sub: project.sub,
      subId:
        project.subId ||
        subcontractors.find((s) => s.name === project.sub)?.id ||
        "",
      start: project.start,
      scheduledStart: project.scheduledStart || "",
      amount: rawAmount,
      description: project.description,
      customerNumber: project.customerNumber,
      customerPhone: project.customerPhone,
      customerEmail: project.customerEmail,
      estimatedHours: project.estimatedHours,
      indoorUnits: project.indoorUnits,
      selectedWorkTypes: project.selectedWorkTypes || [],
      selectedAdditionalServices: project.selectedAdditionalServices || [],
      workers: project.workers || [],
    });
    setAddProjectOpen(true);
  };

  const handleStartProject = async (projectIndex: number) => {
    const supabase = createClient();
    const updatedProjects = [...projects];

    // Find the project in the filtered scheduled list
    const scheduledProjects = projects.filter(
      (p: any) => p.status === "Scheduled",
    );
    const projectToUpdate = scheduledProjects[projectIndex];

    if (projectToUpdate) {
      const newStartDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      // Update in Supabase first
      const { error } = await supabase
        .from("projects")
        .update({
          status: "In Progress",
          actual_start: new Date().toISOString(),
        })
        .eq("id", projectToUpdate.id);

      if (error) {
        console.error("Error updating project status in Supabase:", error);
        alert("Failed to start project. Please try again.");
        return;
      }

      // Update local state
      const indexInMainArray = projects.findIndex(
        (p) => p.id === projectToUpdate.id,
      );
      if (indexInMainArray !== -1) {
        updatedProjects[indexInMainArray] = {
          ...updatedProjects[indexInMainArray],
          status: "In Progress",
          statusColor: "bg-orange-500 text-white",
          start: newStartDate,
        };
        setProjects(updatedProjects);
        localStorage.setItem(
          "prostruktion_projects_v1",
          JSON.stringify(updatedProjects),
        );
      }
    }
  };

  const handleActualHoursChange = (project: any, value: string) => {
    const updatedProjects = [...projects];
    // Find project by reference in the main array
    const mainIndex = updatedProjects.findIndex((p) => p === project);

    if (mainIndex !== -1) {
      updatedProjects[mainIndex].actualHours = value;
      setProjects(updatedProjects);
      localStorage.setItem(
        "prostruktion_projects_v1",
        JSON.stringify(updatedProjects),
      );
    }
  };

  const handleProjectFieldChange = (
    project: any,
    field: string,
    value: any,
  ) => {
    const updatedProjects = [...projects];
    const mainIndex = updatedProjects.findIndex((p) => p === project);

    if (mainIndex !== -1) {
      updatedProjects[mainIndex][field] = value;
      setProjects(updatedProjects);
      localStorage.setItem(
        "prostruktion_projects_v1",
        JSON.stringify(updatedProjects),
      );
    }
  };

  const handleStatusChange = async (index: number, newStatus: string) => {
    const supabase = createClient();
    const updatedProjects = [...projects];
    // Find project based on filtering logic

    const activeProjects = projects.filter((p) => p.status !== "Scheduled");
    const targetProject = activeProjects[index];

    // Find actual index in main array
    const realIndex = projects.findIndex((p) => p === targetProject);

    if (realIndex !== -1 && targetProject.id) {
      // Update in Supabase first
      const { error } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", targetProject.id);

      if (error) {
        console.error("Error updating project status in Supabase:", error);
        alert("Failed to update status. Please try again.");
        return;
      }

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
    // 1. Calculate Base Values
    const numericAmount = parseGermanFloat(
      project.amount || project.contract_value || 0,
    );

    // 2. Calculate Quality Bonus
    // Based on indoor units. default to 0 units if undefined.
    // Cap at 16 since matrix only goes to 16.
    let units = parseInt(project.indoorUnits) || 0;
    if (units < 0) units = 0;
    if (units > 16) units = 16;

    const qualityBonusAmount =
      (PRICING_MATRIX.bonus1 && PRICING_MATRIX.bonus1[units]) || 0;

    console.log("DEBUG Quality Bonus:", {
      originalUnits: project.indoorUnits,
      cappedUnits: units,
      qualityBonusAmount,
    });

    // 3. Calculate Quantity Bonus
    // Count projects for this partner in current month
    const partnerName = project.partner;
    const monthlyCount = getMonthlyCount(partnerName, "partner") + 1; // +1 includes this current project

    let quantityBonusAmount = 0;
    // bonus2 keys are "08-12", "12-36", "36+"
    if (monthlyCount >= 8 && monthlyCount <= 12) quantityBonusAmount = 150;
    else if (monthlyCount > 12 && monthlyCount <= 36) quantityBonusAmount = 330;
    else if (monthlyCount > 36) quantityBonusAmount = 600;

    // 4. Calculate Subcontractor Quantity Bonus
    const subName = project.sub;
    const subMonthlyCount = getMonthlyCount(subName, "sub") + 1;
    let subQuantityBonusAmount = 0;
    if (subMonthlyCount >= 8 && subMonthlyCount <= 12)
      subQuantityBonusAmount = 150;
    else if (subMonthlyCount > 12 && subMonthlyCount <= 36)
      subQuantityBonusAmount = 330;
    else if (subMonthlyCount > 36) subQuantityBonusAmount = 600;

    // 4. Determine Shares
    const hasMediator =
      project.mediator &&
      project.mediator !== "-" &&
      project.mediator.trim() !== "";

    // Set Invoice Edit State
    setInvoiceEditState({
      projectValue: numericAmount,
      qualityBonus: {
        enabled: true,
        amount: qualityBonusAmount,
        label: `${units} Indoor Units`,
      },
      quantityBonus: {
        enabled: monthlyCount >= 8,
        amount: quantityBonusAmount,
        label: `Tier: ${monthlyCount} Projects (Month)`,
      },
      subQualityBonus: {
        enabled: false,
        amount: qualityBonusAmount,
        label: `${units} Indoor Units`,
      },
      subQuantityBonus: {
        enabled: subMonthlyCount >= 8,
        amount: subQuantityBonusAmount,
        label: `Sub Tier: ${subMonthlyCount} Projects`,
      },
      partnerSharePercent: hasMediator ? 10 : 15,
      mediatorSharePercent: 10,
      subcontractorFee: 0,
      quantityCount: monthlyCount,
      subQuantityCount: subMonthlyCount,
      reviewed: {
        partner: false,
        mediator: false, // Default false
        subcontractor: false,
        prostruktion: false,
      },
    });

    const totalCommission = numericAmount * 0.3;
    let companyShare, partnerShare, mediatorShare;

    if (hasMediator) {
      companyShare = numericAmount * 0.1;
      partnerShare = numericAmount * 0.1;
      mediatorShare = numericAmount * 0.1;
    } else {
      companyShare = numericAmount * 0.15;
      partnerShare = numericAmount * 0.15;
      mediatorShare = 0;
    }

    // Set current invoice for context
    setCurrentInvoice({
      ...project,
      numericAmount,
      totalCommission,
      companyShare,
      partnerShare,
      mediatorShare,
      hasMediator,
      projectData: project,
    });

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
                            {netAmount.toLocaleString("de-DE", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => handleEditClick(project)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={() => handleStartProject(i)}
                              >
                                <Rocket className="mr-1 h-3 w-3" /> Start
                              </Button>
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
                                      <FileText className="h-3 w-3" /> Customer
                                      Details
                                    </h4>
                                    <div className="bg-white dark:bg-gray-950 rounded-lg border p-3 text-sm space-y-2 shadow-sm flex-1 flex flex-col">
                                      <div className="grid grid-cols-[100px_1fr] gap-2 shrink-0">
                                        <span className="text-muted-foreground text-xs">
                                          Customer No:
                                        </span>
                                        <span className="font-medium">
                                          {project.customerNumber || "N/A"}
                                        </span>

                                        <span className="text-muted-foreground text-xs">
                                          Phone:
                                        </span>
                                        <span className="font-medium">
                                          {project.customerPhone || "N/A"}
                                        </span>

                                        <span className="text-muted-foreground text-xs">
                                          Email:
                                        </span>
                                        <span
                                          className="font-medium truncate"
                                          title={project.customerEmail}
                                        >
                                          {project.customerEmail || "N/A"}
                                        </span>

                                        <span className="text-muted-foreground text-xs">
                                          Location:
                                        </span>
                                        <span className="font-medium">
                                          {project.address}
                                        </span>
                                      </div>
                                      {project.description && (
                                        <div className="pt-2 mt-2 border-t border-dashed flex-1 flex flex-col min-h-0">
                                          <span className="text-xs text-muted-foreground block mb-2 shrink-0">
                                            Notes:
                                          </span>
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
                                    <HardHat className="h-3 w-3" /> Assigned
                                    Workers
                                  </h4>

                                  <div className="bg-white dark:bg-gray-950 rounded-lg border p-3 text-sm space-y-2 shadow-sm mb-1">
                                    <div className="grid grid-cols-[100px_1fr] gap-2">
                                      <span className="text-muted-foreground text-xs">
                                        Contractor:
                                      </span>
                                      <span className="font-medium">
                                        {project.contractor || "N/A"}
                                      </span>

                                      <span className="text-muted-foreground text-xs">
                                        Partner:
                                      </span>
                                      <span className="font-medium">
                                        {project.partner || "N/A"}
                                      </span>

                                      <span className="text-muted-foreground text-xs">
                                        Mediator:
                                      </span>
                                      <span className="font-medium">
                                        {project.mediator || "N/A"}
                                      </span>
                                    </div>
                                  </div>

                                  {project.workers &&
                                  project.workers.length > 0 ? (
                                    <div className="rounded-md border bg-white dark:bg-gray-950 overflow-hidden shadow-sm h-full">
                                      <Table>
                                        <TableHeader className="bg-gray-50/50">
                                          <TableRow className="h-8 hover:bg-transparent">
                                            <TableHead className="h-8 text-[10px] font-semibold">
                                              Name
                                            </TableHead>
                                            <TableHead className="h-8 text-[10px] font-semibold text-center">
                                              Cert
                                            </TableHead>
                                            <TableHead className="h-8 text-[10px] font-semibold text-center">
                                              A1
                                            </TableHead>
                                            <TableHead className="h-8 text-[10px] font-semibold text-center">
                                              Success
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {project.workers.map(
                                            (workerId: string) => (
                                              <TableRow
                                                key={workerId}
                                                className="h-8 hover:bg-transparent border-0"
                                              >
                                                <TableCell className="py-1">
                                                  <div className="flex items-center gap-2">
                                                    <Avatar className="h-5 w-5 border">
                                                      <AvatarImage
                                                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${workerId}`}
                                                      />
                                                      <AvatarFallback className="text-[9px]">
                                                        {workerId.charAt(0)}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-medium truncate max-w-[100px]">
                                                      Worker {workerId}
                                                    </span>
                                                  </div>
                                                </TableCell>
                                                <TableCell className="py-1 text-xs text-muted-foreground text-center">
                                                  Yes
                                                </TableCell>
                                                <TableCell className="py-1 text-xs text-muted-foreground text-center">
                                                  Yes
                                                </TableCell>
                                                <TableCell className="py-1 text-center text-xs text-green-600 font-medium">
                                                  100%
                                                </TableCell>
                                              </TableRow>
                                            ),
                                          )}
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
                                      <span className="font-medium text-gray-700 dark:text-gray-300">
                                        Estimated Max Hours:
                                      </span>
                                      <span className="font-mono font-semibold">
                                        {project.estimatedHours || "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="font-medium text-gray-700 dark:text-gray-300">
                                        Actual Hours:
                                      </span>
                                      <span className="w-16 border-b border-gray-400 dark:border-gray-600"></span>
                                    </div>
                                  </div>
                                </div>

                                {/* Column 3: Bonus & Performance Stats */}
                                <div className="space-y-4 h-full flex flex-col">
                                  <div className="h-full flex flex-col">
                                    <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                      <Trophy className="h-3 w-3" /> Scope of
                                      Work
                                    </h4>

                                    <div className="bg-white dark:bg-gray-950 rounded-lg border p-4 flex flex-col h-full shadow-sm">
                                      <div className="flex-1 space-y-5 text-xs">
                                        {/* Unit Count Header */}
                                        <div className="flex justify-between items-center bg-muted/30 p-2 rounded-md border border-muted/50">
                                          <span className="font-medium text-muted-foreground">
                                            Indoor Units
                                          </span>
                                          <Badge
                                            variant="secondary"
                                            className="text-sm font-bold px-2.5 py-0.5"
                                          >
                                            {project.indoorUnits || 0}
                                          </Badge>
                                        </div>

                                        {/* Work Types */}
                                        <div className="space-y-2">
                                          <div className="font-semibold text-[10px] uppercase text-muted-foreground border-b pb-1">
                                            Base Installation
                                          </div>
                                          {project.selectedWorkTypes &&
                                          project.selectedWorkTypes.length >
                                            0 ? (
                                            <div className="grid gap-2">
                                              {project.selectedWorkTypes.map(
                                                (type: string) => {
                                                  // Calculate cost for this type based on units
                                                  const units =
                                                    project.indoorUnits || 0;
                                                  const unitCosts =
                                                    PRICING_MATRIX.baseCosts[
                                                      units
                                                    ] || {};
                                                  const cost =
                                                    (unitCosts as any)[type] ||
                                                    0;

                                                  return (
                                                    <div
                                                      key={type}
                                                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start w-full border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0"
                                                    >
                                                      <span className="text-xs text-gray-700 dark:text-gray-300 font-medium wrap-break-word leading-tight whitespace-pre-line">
                                                        {WORK_TYPE_LABELS[
                                                          type
                                                        ] || type}
                                                      </span>
                                                      <span className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                        € {cost}
                                                      </span>
                                                    </div>
                                                  );
                                                },
                                              )}
                                            </div>
                                          ) : (
                                            <p className="text-muted-foreground italic text-[11px] py-1">
                                              No specific work types selected.
                                            </p>
                                          )}
                                        </div>

                                        {/* Additional Services */}
                                        {project.selectedAdditionalServices &&
                                          project.selectedAdditionalServices
                                            .length > 0 && (
                                            <div className="space-y-2 mt-4">
                                              <div className="font-semibold text-[10px] uppercase text-muted-foreground border-b pb-1 mb-2">
                                                Extras
                                              </div>
                                              <div className="grid gap-2">
                                                {project.selectedAdditionalServices.map(
                                                  (serviceId: string) => {
                                                    const service =
                                                      ADDITIONAL_SERVICES.find(
                                                        (s) =>
                                                          s.id === serviceId,
                                                      );
                                                    return (
                                                      <div
                                                        key={serviceId}
                                                        className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start w-full border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0"
                                                      >
                                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium wrap-break-word leading-tight">
                                                          {service?.label ||
                                                            serviceId}
                                                        </span>
                                                        <span className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                          €{" "}
                                                          {service?.price || 0}
                                                        </span>
                                                      </div>
                                                    );
                                                  },
                                                )}
                                              </div>
                                            </div>
                                          )}
                                      </div>

                                      <div className="pt-4 mt-4 border-t">
                                        <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                          <span className="font-bold text-blue-900 dark:text-blue-100">
                                            Total Amount
                                          </span>
                                          <span className="font-mono font-bold text-lg text-blue-700 dark:text-blue-300">
                                            {project.amount}
                                          </span>
                                        </div>
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
                  const {
                    penalty,
                    daysLate,
                    isOverdue,
                    penaltyPercentage,
                    netAmount,
                  } = calculatePenalty(
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
                          {netAmount.toLocaleString("de-DE", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
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
                                    <FileText className="h-3 w-3" /> Customer
                                    Details
                                  </h4>
                                  <div className="bg-white dark:bg-gray-950 rounded-lg border p-3 text-sm space-y-2 shadow-sm flex-1 flex flex-col">
                                    <div className="grid grid-cols-[100px_1fr] gap-2 shrink-0">
                                      <span className="text-muted-foreground text-xs">
                                        Customer No:
                                      </span>
                                      <span className="font-medium">
                                        {item.customerNumber || "N/A"}
                                      </span>

                                      <span className="text-muted-foreground text-xs">
                                        Phone:
                                      </span>
                                      <span className="font-medium">
                                        {item.customerPhone || "N/A"}
                                      </span>

                                      <span className="text-muted-foreground text-xs">
                                        Email:
                                      </span>
                                      <span
                                        className="font-medium truncate"
                                        title={item.customerEmail}
                                      >
                                        {item.customerEmail || "N/A"}
                                      </span>

                                      <span className="text-muted-foreground text-xs">
                                        Location:
                                      </span>
                                      <span className="font-medium">
                                        {item.address}
                                      </span>
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

                              {/* Column 2: Assigned Workers (Existing) */}
                              <div className="space-y-4 h-full flex flex-col">
                                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                                  <HardHat className="h-3 w-3" /> Assigned
                                  Workers
                                </h4>

                                <div className="bg-white dark:bg-gray-950 rounded-lg border p-3 text-sm space-y-2 shadow-sm mb-1">
                                  <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <span className="text-muted-foreground text-xs">
                                      Contractor:
                                    </span>
                                    <span className="font-medium">
                                      {item.contractor || "N/A"}
                                    </span>

                                    <span className="text-muted-foreground text-xs">
                                      Partner:
                                    </span>
                                    <span className="font-medium">
                                      {item.partner || "N/A"}
                                    </span>

                                    <span className="text-muted-foreground text-xs">
                                      Mediator:
                                    </span>
                                    <span className="font-medium">
                                      {item.mediator || "N/A"}
                                    </span>
                                  </div>
                                </div>

                                {item.workers && item.workers.length > 0 ? (
                                  <div className="rounded-md border bg-white dark:bg-gray-950 overflow-hidden shadow-sm h-full">
                                    <Table>
                                      <TableHeader className="bg-gray-50/50">
                                        <TableRow className="h-8 hover:bg-transparent">
                                          <TableHead className="h-8 text-[10px] font-semibold">
                                            Name
                                          </TableHead>
                                          <TableHead className="h-8 text-[10px] font-semibold text-center">
                                            Cert
                                          </TableHead>
                                          <TableHead className="h-8 text-[10px] font-semibold text-center">
                                            A1
                                          </TableHead>
                                          <TableHead className="h-8 text-[10px] font-semibold text-center">
                                            Success
                                          </TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {item.workers.map(
                                          (workerId: string) => (
                                            <TableRow
                                              key={workerId}
                                              className="h-8 hover:bg-transparent border-0"
                                            >
                                              <TableCell className="py-1">
                                                <div className="flex items-center gap-2">
                                                  <Avatar className="h-5 w-5 border">
                                                    <AvatarImage
                                                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${workerId}`}
                                                    />
                                                    <AvatarFallback className="text-[9px]">
                                                      {workerId.charAt(0)}
                                                    </AvatarFallback>
                                                  </Avatar>
                                                  <span className="text-xs font-medium truncate max-w-[100px]">
                                                    Worker {workerId}
                                                  </span>
                                                </div>
                                              </TableCell>
                                              <TableCell className="py-1 text-xs text-muted-foreground text-center">
                                                Yes
                                              </TableCell>
                                              <TableCell className="py-1 text-xs text-muted-foreground text-center">
                                                Yes
                                              </TableCell>
                                              <TableCell className="py-1 text-center text-xs text-green-600 font-medium">
                                                100%
                                              </TableCell>
                                            </TableRow>
                                          ),
                                        )}
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
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      Estimated Max Hours:
                                    </span>
                                    <span className="font-mono font-semibold">
                                      {item.estimatedHours || "N/A"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      Actual Hours:
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Input
                                        className="h-6 w-20 text-xs text-right bg-white dark:bg-gray-950 px-1 py-0 h-7"
                                        placeholder="0"
                                        value={item.actualHours || ""}
                                        onChange={(e) =>
                                          handleActualHoursChange(
                                            item,
                                            e.target.value,
                                          )
                                        }
                                      />
                                    </div>
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
                                        <span className="font-medium text-muted-foreground">
                                          Indoor Units
                                        </span>
                                        <Badge
                                          variant="secondary"
                                          className="text-sm font-bold px-2.5 py-0.5"
                                        >
                                          {item.indoorUnits || 0}
                                        </Badge>
                                      </div>

                                      {/* Work Types */}
                                      <div className="space-y-2">
                                        <div className="font-semibold text-[10px] uppercase text-muted-foreground border-b pb-1">
                                          Base Installation
                                        </div>
                                        {item.selectedWorkTypes &&
                                        item.selectedWorkTypes.length > 0 ? (
                                          <div className="grid gap-2">
                                            {item.selectedWorkTypes.map(
                                              (type: string) => {
                                                // Calculate cost for this type based on units
                                                const units =
                                                  item.indoorUnits || 0;
                                                const unitCosts =
                                                  PRICING_MATRIX.baseCosts[
                                                    units
                                                  ] || {};
                                                const cost =
                                                  (unitCosts as any)[type] || 0;

                                                return (
                                                  <div
                                                    key={type}
                                                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start w-full border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0"
                                                  >
                                                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium wrap-break-word leading-tight whitespace-pre-line">
                                                      {WORK_TYPE_LABELS[type] ||
                                                        type}
                                                    </span>
                                                    <span className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                      € {cost}
                                                    </span>
                                                  </div>
                                                );
                                              },
                                            )}
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground italic text-[11px] py-1">
                                            No specific work types selected.
                                          </p>
                                        )}
                                      </div>

                                      {/* Additional Services */}
                                      {item.selectedAdditionalServices &&
                                        item.selectedAdditionalServices.length >
                                          0 && (
                                          <div className="space-y-2 mt-4">
                                            <div className="font-semibold text-[10px] uppercase text-muted-foreground border-b pb-1 mb-2">
                                              Extras
                                            </div>
                                            <div className="grid gap-2">
                                              {item.selectedAdditionalServices.map(
                                                (serviceId: string) => {
                                                  const service =
                                                    ADDITIONAL_SERVICES.find(
                                                      (s) => s.id === serviceId,
                                                    );
                                                  return (
                                                    <div
                                                      key={serviceId}
                                                      className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 items-start w-full border-b border-gray-100 dark:border-gray-800 last:border-0 pb-2 last:pb-0"
                                                    >
                                                      <span className="text-xs text-gray-700 dark:text-gray-300 font-medium wrap-break-word leading-tight">
                                                        {service?.label ||
                                                          serviceId}
                                                      </span>
                                                      <span className="text-xs font-mono font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                                        € {service?.price || 0}
                                                      </span>
                                                    </div>
                                                  );
                                                },
                                              )}
                                            </div>
                                          </div>
                                        )}
                                    </div>

                                    <div className="pt-4 mt-4 border-t">
                                      <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/20">
                                        <span className="font-bold text-blue-900 dark:text-blue-100">
                                          Total Amount
                                        </span>
                                        <span className="font-mono font-bold text-lg text-blue-700 dark:text-blue-300">
                                          €{" "}
                                          {netAmount.toLocaleString("de-DE", {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 2,
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Additional Work Section (Full Width) */}
                            <div className="px-4 pb-4">
                              <div className="pt-6 mt-6 border-t border-dashed">
                                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                  <PlusCircle className="h-3 w-3" /> In-Progress
                                  Additional Work
                                </h4>

                                <div className="bg-white dark:bg-gray-950 rounded-lg border p-4 shadow-sm space-y-4">
                                  {/* List of Additional Works */}
                                  {item.additionalWorks &&
                                    item.additionalWorks.length > 0 && (
                                      <div className="space-y-2 mb-4">
                                        <div className="grid grid-cols-[1fr_120px_180px_100px] gap-4 text-xs font-medium text-muted-foreground pb-2 border-b px-2">
                                          <span>Description</span>
                                          <span className="text-right">
                                            Price
                                          </span>
                                          <span className="text-center">
                                            Receipt
                                          </span>
                                          <span></span>
                                        </div>
                                        {item.additionalWorks.map(
                                          (work: any, wIndex: number) => (
                                            <div
                                              key={wIndex}
                                              className="grid grid-cols-[1fr_120px_180px_100px] gap-4 text-sm items-center px-2"
                                            >
                                              <span className="font-medium truncate">
                                                {work.description}
                                              </span>
                                              <span className="font-mono text-right text-gray-600">
                                                € {work.price.toFixed(2)}
                                              </span>
                                              <div className="flex justify-center">
                                                {work.receiptName ? (
                                                  <Badge
                                                    variant="outline"
                                                    className="text-[10px] bg-green-50 text-green-700 border-green-200 truncate max-w-full"
                                                  >
                                                    <FileText className="h-3 w-3 mr-1" />{" "}
                                                    {work.receiptName}
                                                  </Badge>
                                                ) : (
                                                  <span className="text-xs text-muted-foreground italic">
                                                    No receipt
                                                  </span>
                                                )}
                                              </div>
                                              <div></div>
                                            </div>
                                          ),
                                        )}
                                        <div className="flex justify-between items-center pt-2 mt-2 border-t px-2">
                                          <span className="text-xs font-bold">
                                            Total Additional Cost
                                          </span>
                                          <span className="font-mono font-bold text-blue-600">
                                            €{" "}
                                            {item.additionalWorks
                                              .reduce(
                                                (sum: number, w: any) =>
                                                  sum + (w.price || 0),
                                                0,
                                              )
                                              .toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    )}

                                  {/* Add New Item Form - Polished Layout */}
                                  <div className="bg-gray-50/80 dark:bg-gray-900/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <div className="grid gap-4">
                                      {/* Row 1: Description */}
                                      <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                                          Description
                                        </label>
                                        <Input
                                          placeholder="e.g. Additional cabling for living room unit..."
                                          className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 focus:ring-blue-500/20"
                                          value={
                                            additionalWorkInputs[i]
                                              ?.description || ""
                                          }
                                          onChange={(e) =>
                                            handleAdditionalWorkInputChange(
                                              i,
                                              "description",
                                              e.target.value,
                                            )
                                          }
                                        />
                                      </div>

                                      {/* Row 2: Details & Action */}
                                      <div className="flex flex-col md:flex-row gap-4 items-end">
                                        <div className="w-full md:w-32 space-y-1.5">
                                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                                            Price
                                          </label>
                                          <div className="relative">
                                            <span className="absolute left-2.5 top-2.5 text-gray-400 text-xs">
                                              €
                                            </span>
                                            <Input
                                              type="number"
                                              placeholder="0.00"
                                              className="pl-6 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 font-mono text-sm"
                                              value={
                                                additionalWorkInputs[i]
                                                  ?.price || ""
                                              }
                                              onChange={(e) =>
                                                handleAdditionalWorkInputChange(
                                                  i,
                                                  "price",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          </div>
                                        </div>

                                        <div className="flex-1 space-y-1.5 min-w-0">
                                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                                            Receipt
                                          </label>
                                          <Input
                                            id={`receipt-upload-${i}`}
                                            type="file"
                                            className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-xs py-1.5 h-10 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-600 hover:file:bg-gray-200"
                                          />
                                        </div>

                                        <Button
                                          size="default"
                                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 min-w-[100px]"
                                          onClick={() =>
                                            handleAddAdditionalWorkItem(i, item)
                                          }
                                        >
                                          <PlusCircle className="h-4 w-4 mr-2" />{" "}
                                          Add
                                        </Button>
                                      </div>
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
      </div>

      {/* Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" /> Generate Invoices
            </DialogTitle>
            <DialogDescription>
              Review and edit invoice details for all parties before generating.
            </DialogDescription>
          </DialogHeader>

          {currentInvoice && (
            <Tabs defaultValue="partner" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="partner">Partner Invoice</TabsTrigger>
                <TabsTrigger value="subcontractor">Subcontractor</TabsTrigger>
                <TabsTrigger value="company">
                  {currentInvoice?.hasMediator ? "Mediator" : "Mediator (N/A)"}
                </TabsTrigger>
              </TabsList>

              {/* PARTNER INVOICE TAB */}
              <TabsContent value="partner" className="space-y-4">
                <div className="bg-white dark:bg-gray-950 border rounded-lg p-5 space-y-6">
                  {/* 1. Header Info (6 fields grid) */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase font-semibold">
                        Project Name
                      </span>
                      <span className="font-medium">
                        {currentInvoice.project}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase font-semibold">
                        Project ID
                      </span>
                      <span className="font-medium">{currentInvoice.id}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase font-semibold">
                        Contractor
                      </span>
                      <span className="font-medium">
                        {currentInvoice.contractor || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase font-semibold">
                        Subcontractor
                      </span>
                      <span className="font-medium">
                        {currentInvoice.projectData?.sub || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase font-semibold">
                        Mediator
                      </span>
                      <span className="font-medium">
                        {currentInvoice.projectData?.mediator || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase font-semibold">
                        Prostruktion
                      </span>
                      <span className="font-medium text-blue-600">
                        PROSTRUKTION
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-dashed my-2"></div>

                  {/* 2. Scope of Work (With Bonuses at bottom) */}
                  <div className="bg-gray-50 dark:bg-gray-900/10 p-3 rounded text-xs space-y-3">
                    <h4 className="font-semibold uppercase text-muted-foreground">
                      Scope of Work
                    </h4>

                    {/* Existing Work List */}
                    <div className="space-y-1">
                      <span className="text-muted-foreground block font-semibold mb-1">
                        Work Types (
                        {currentInvoice.projectData?.indoorUnits || 0} Indoor
                        Units):
                      </span>
                      {currentInvoice.projectData?.selectedWorkTypes?.length >
                      0 ? (
                        <ul className="space-y-1">
                          {currentInvoice.projectData.selectedWorkTypes.map(
                            (type: string) => {
                              const units =
                                currentInvoice.projectData?.indoorUnits || 0;
                              const cost =
                                PRICING_MATRIX.baseCosts[units]?.[
                                  type as keyof (typeof PRICING_MATRIX.baseCosts)[0]
                                ] || 0;

                              return (
                                <li
                                  key={type}
                                  className="flex items-start gap-2 justify-between"
                                >
                                  <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                                    <span className="leading-tight text-xs">
                                      {WORK_TYPE_LABELS[type] || type}
                                    </span>
                                  </div>
                                  <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    € {cost}
                                  </span>
                                </li>
                              );
                            },
                          )}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground italic">
                          No specific work types selected.
                        </span>
                      )}
                    </div>

                    {/* Additional Services */}
                    {currentInvoice.projectData?.selectedAdditionalServices
                      ?.length > 0 && (
                      <div className="space-y-1 mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                        <span className="text-muted-foreground block font-semibold mb-1">
                          Additional Services:
                        </span>
                        <ul className="space-y-1">
                          {currentInvoice.projectData.selectedAdditionalServices.map(
                            (serviceId: string) => {
                              const service = ADDITIONAL_SERVICES.find(
                                (s) => s.id === serviceId,
                              );
                              return (
                                <li
                                  key={serviceId}
                                  className="flex items-start gap-2 justify-between"
                                >
                                  <div className="flex items-start gap-2">
                                    <Plus className="h-3 w-3 text-purple-600 mt-0.5 shrink-0" />
                                    <span className="leading-tight text-xs">
                                      {service?.label || serviceId}
                                    </span>
                                  </div>
                                  <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    € {service?.price || 0}
                                  </span>
                                </li>
                              );
                            },
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Bonuses Checkboxes Integrated Here */}
                    <div className="pt-4 mt-4 border-t border-dashed space-y-3">
                      <h5 className="font-semibold text-[10px] uppercase text-muted-foreground flex items-center gap-2">
                        <Gift className="h-3 w-3" /> Bonuses & Performance
                      </h5>

                      {/* Quality Bonus Card */}
                      <div
                        className={`transition-colors rounded-lg border p-3 flex flex-col gap-1 ${
                          invoiceEditState.qualityBonus.enabled
                            ? "bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800"
                            : "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="quality-bonus-chk"
                              checked={invoiceEditState.qualityBonus.enabled}
                              onCheckedChange={(checked) =>
                                setInvoiceEditState({
                                  ...invoiceEditState,
                                  qualityBonus: {
                                    ...invoiceEditState.qualityBonus,
                                    enabled: !!checked,
                                  },
                                })
                              }
                              className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <div>
                              <label
                                htmlFor="quality-bonus-chk"
                                className="font-medium text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                              >
                                Quality Bonus
                              </label>
                              <div className="mt-0.5">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] h-4 px-1.5 font-normal ${
                                    invoiceEditState.qualityBonus.enabled
                                      ? "bg-white/50 text-blue-700 border-blue-300 dark:border-blue-700 dark:text-blue-400"
                                      : "text-gray-500 border-gray-300"
                                  }`}
                                >
                                  {invoiceEditState.qualityBonus.label ||
                                    "Indoor Units"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${
                                invoiceEditState.qualityBonus.enabled
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-gray-400"
                              }`}
                            >
                              + €
                            </span>
                            <Input
                              type="number"
                              disabled={!invoiceEditState.qualityBonus.enabled}
                              value={invoiceEditState.qualityBonus.amount || 0}
                              onChange={(e) =>
                                setInvoiceEditState({
                                  ...invoiceEditState,
                                  qualityBonus: {
                                    ...invoiceEditState.qualityBonus,
                                    amount:
                                      parseGermanFloat(e.target.value) || 0,
                                  },
                                })
                              }
                              className={`h-7 w-20 text-right font-mono font-bold text-sm ${
                                invoiceEditState.qualityBonus.enabled
                                  ? "border-blue-200 focus:border-blue-400 focus:ring-blue-400 bg-white"
                                  : "bg-transparent border-transparent"
                              }`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quantity Bonus Card */}
                      <div
                        className={`transition-colors rounded-lg border p-3 flex flex-col gap-1 ${
                          invoiceEditState.quantityBonus.enabled
                            ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                            : "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id="quantity-bonus-chk"
                              checked={invoiceEditState.quantityBonus.enabled}
                              onCheckedChange={(checked) =>
                                setInvoiceEditState({
                                  ...invoiceEditState,
                                  quantityBonus: {
                                    ...invoiceEditState.quantityBonus,
                                    enabled: !!checked,
                                  },
                                })
                              }
                              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <div>
                              <label
                                htmlFor="quantity-bonus-chk"
                                className="font-medium text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                              >
                                Quantity Bonus
                              </label>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] h-4 px-1.5 font-normal ${
                                    invoiceEditState.quantityBonus.enabled
                                      ? "bg-white/50 text-green-700 border-green-300 dark:border-green-700 dark:text-green-400"
                                      : "text-gray-500 border-gray-300"
                                  }`}
                                >
                                  {invoiceEditState.quantityBonus.label ||
                                    "Volume Tier"}
                                </Badge>
                                {invoiceEditState.quantityCount !== undefined &&
                                  invoiceEditState.quantityCount > 0 && (
                                    <span className="text-[10px] text-gray-500">
                                      ({invoiceEditState.quantityCount} projects
                                      this month)
                                    </span>
                                  )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              disabled={!invoiceEditState.quantityBonus.enabled}
                              value={String(
                                invoiceEditState.quantityBonus.amount || 0,
                              )}
                              onValueChange={(val) =>
                                setInvoiceEditState({
                                  ...invoiceEditState,
                                  quantityBonus: {
                                    ...invoiceEditState.quantityBonus,
                                    amount: parseFloat(val) || 0,
                                    label:
                                      val === "150"
                                        ? "0-12 Projects"
                                        : val === "330"
                                          ? "12-36 Projects"
                                          : val === "600"
                                            ? "36+ Projects"
                                            : "No Tier",
                                  },
                                })
                              }
                            >
                              <SelectTrigger
                                className={`h-7 w-40 text-right font-mono font-bold text-sm ${
                                  invoiceEditState.quantityBonus.enabled
                                    ? "border-green-200 focus:border-green-400 focus:ring-green-400 bg-white"
                                    : "bg-transparent border-transparent"
                                }`}
                              >
                                <SelectValue placeholder="Select Tier" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">No Bonus</SelectItem>
                                <SelectItem value="150">
                                  0-12 Projects: € 150
                                </SelectItem>
                                <SelectItem value="330">
                                  12-36 Projects: € 330
                                </SelectItem>
                                <SelectItem value="600">
                                  36+ Projects: € 600
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-dashed my-2"></div>

                  {/* 3. Payment Distribution (New Component) */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm uppercase text-gray-900 dark:text-gray-100">
                      Payment Distribution
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-900/10 rounded-lg border overflow-hidden">
                      {/* Contractor (Total) */}
                      <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-gray-800/50">
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm">
                            Contractor: {currentInvoice.contractor || "Unknown"}
                          </span>
                          <span className="text-[10px] text-gray-500 font-normal">
                            Base + Bonuses
                          </span>
                        </div>
                        <span className="font-mono font-bold">
                          €{" "}
                          {(
                            invoiceEditState.projectValue +
                            (invoiceEditState.quantityBonus.enabled
                              ? invoiceEditState.quantityBonus.amount
                              : 0) +
                            (invoiceEditState.qualityBonus.enabled
                              ? invoiceEditState.qualityBonus.amount
                              : 0)
                          ).toLocaleString("de-DE", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {/* Mediator (10% or -) */}
                      <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-800">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Mediator: {currentInvoice.mediator || "N/A"} (
                          {currentInvoice.hasMediator ? "10%" : "N/A"})
                        </span>
                        <span className="font-mono font-medium">
                          {currentInvoice.hasMediator
                            ? `€ ${(
                                (invoiceEditState.projectValue +
                                  (invoiceEditState.quantityBonus.enabled
                                    ? invoiceEditState.quantityBonus.amount
                                    : 0) +
                                  (invoiceEditState.qualityBonus.enabled
                                    ? invoiceEditState.qualityBonus.amount
                                    : 0)) *
                                0.1
                              ).toLocaleString("de-DE", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}`
                            : "-"}
                        </span>
                      </div>

                      {/* Prostruktion (10% or 15%) */}
                      <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-800">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Prostruktion (
                          {currentInvoice.hasMediator ? "10%" : "15%"})
                        </span>
                        <span className="font-mono font-medium">
                          €{" "}
                          {(
                            (invoiceEditState.projectValue +
                              (invoiceEditState.quantityBonus.enabled
                                ? invoiceEditState.quantityBonus.amount
                                : 0) +
                              (invoiceEditState.qualityBonus.enabled
                                ? invoiceEditState.qualityBonus.amount
                                : 0)) *
                            (currentInvoice.hasMediator ? 0.1 : 0.15)
                          ).toLocaleString("de-DE", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {/* Partner (10% or 15% + Bonuses) */}
                      <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Partner: {currentInvoice.partner || "Unknown"} (
                            {currentInvoice.hasMediator ? "10%" : "15%"})
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            Based on Total + Bonuses
                          </span>
                        </div>
                        <span className="font-mono font-medium">
                          €{" "}
                          {(
                            (invoiceEditState.projectValue +
                              (invoiceEditState.quantityBonus.enabled
                                ? invoiceEditState.quantityBonus.amount
                                : 0) +
                              (invoiceEditState.qualityBonus.enabled
                                ? invoiceEditState.qualityBonus.amount
                                : 0)) *
                            (currentInvoice.hasMediator ? 0.1 : 0.15)
                          ).toLocaleString("de-DE", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4. Subcontractor Settlement (Separate Comp) */}
                  <div className="space-y-3 pt-2">
                    <h4 className="font-semibold text-sm uppercase text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <HardHat className="h-4 w-4" /> Subcontractor Settlement
                    </h4>
                    <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/20 overflow-hidden">
                      {/* Sub Base (70% of Base) */}
                      <div className="flex justify-between items-center p-3 border-b border-orange-100 dark:border-orange-900/20">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Base Amount (70% of Project Value)
                        </span>
                        <span className="font-mono font-medium">
                          €{" "}
                          {(invoiceEditState.projectValue * 0.7).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                            },
                          )}
                        </span>
                      </div>

                      {/* Sub Quality Bonus Toggle */}
                      <div className="flex justify-between items-center p-3 border-b border-orange-100 dark:border-orange-900/20 bg-white/50 dark:bg-gray-900/20">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="sub-qual-bonus-chk"
                            checked={invoiceEditState.subQualityBonus?.enabled}
                            onCheckedChange={(checked) =>
                              setInvoiceEditState({
                                ...invoiceEditState,
                                subQualityBonus: {
                                  ...invoiceEditState.subQualityBonus,
                                  enabled: !!checked,
                                },
                              })
                            }
                            className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600 branch-checkbox"
                          />
                          <div>
                            <label
                              htmlFor="sub-qual-bonus-chk"
                              className="font-medium text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                            >
                              Quality Bonus (70%)
                            </label>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] h-4 px-1.5 font-normal ${
                                  invoiceEditState.subQualityBonus?.enabled
                                    ? "bg-orange-100 text-orange-700 border-orange-300"
                                    : "text-gray-500 border-gray-300"
                                }`}
                              >
                                {invoiceEditState.subQualityBonus?.label ||
                                  "Indoor Units"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              invoiceEditState.subQualityBonus?.enabled
                                ? "text-orange-600"
                                : "text-gray-400"
                            }`}
                          >
                            + €
                          </span>
                          <Input
                            type="number"
                            disabled={
                              !invoiceEditState.subQualityBonus?.enabled
                            }
                            value={
                              invoiceEditState.subQualityBonus?.amount
                                ? (
                                    invoiceEditState.subQualityBonus.amount *
                                    0.7
                                  ).toFixed(2)
                                : 0
                            }
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setInvoiceEditState({
                                ...invoiceEditState,
                                subQualityBonus: {
                                  ...invoiceEditState.subQualityBonus,
                                  amount: val / 0.7,
                                },
                              });
                            }}
                            className={`h-7 w-20 text-right font-mono font-bold text-sm ${
                              invoiceEditState.subQualityBonus?.enabled
                                ? "border-orange-200 focus:border-orange-400 focus:ring-orange-400 bg-white"
                                : "bg-transparent border-transparent"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Sub Quantity Bonus Toggle */}
                      <div className="flex justify-between items-center p-3 border-b border-orange-100 dark:border-orange-900/20 bg-white/50 dark:bg-gray-900/20">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="sub-qty-bonus-chk"
                            checked={invoiceEditState.subQuantityBonus?.enabled}
                            onCheckedChange={(checked) =>
                              setInvoiceEditState({
                                ...invoiceEditState,
                                subQuantityBonus: {
                                  ...invoiceEditState.subQuantityBonus,
                                  enabled: !!checked,
                                },
                              })
                            }
                            className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600 branch-checkbox"
                          />
                          <div>
                            <label
                              htmlFor="sub-qty-bonus-chk"
                              className="font-medium text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                            >
                              Quantity Bonus (70%)
                            </label>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] h-4 px-1.5 font-normal ${
                                  invoiceEditState.subQuantityBonus?.enabled
                                    ? "bg-orange-100 text-orange-700 border-orange-300"
                                    : "text-gray-500 border-gray-300"
                                }`}
                              >
                                {invoiceEditState.subQuantityBonus?.label ||
                                  "Sub Tier"}
                              </Badge>
                              {invoiceEditState.subQuantityCount > 0 && (
                                <span className="text-[10px] text-gray-500">
                                  ({invoiceEditState.subQuantityCount} projects)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              invoiceEditState.subQuantityBonus?.enabled
                                ? "text-orange-600"
                                : "text-gray-400"
                            }`}
                          >
                            + €
                          </span>
                          <Select
                            disabled={
                              !invoiceEditState.subQuantityBonus?.enabled
                            }
                            value={String(
                              invoiceEditState.subQuantityBonus?.amount || 0,
                            )}
                            onValueChange={(val) =>
                              setInvoiceEditState({
                                ...invoiceEditState,
                                subQuantityBonus: {
                                  ...invoiceEditState.subQuantityBonus,
                                  amount: parseFloat(val) || 0,
                                  label:
                                    val === "150"
                                      ? "Sub Tier: 1 (8-12)"
                                      : val === "330"
                                        ? "Sub Tier: 2 (12-36)"
                                        : val === "600"
                                          ? "Sub Tier: 3 (36+)"
                                          : "No Tier",
                                },
                              })
                            }
                          >
                            <SelectTrigger
                              className={`h-7 w-[200px] text-right font-mono font-bold text-sm ${
                                invoiceEditState.subQuantityBonus?.enabled
                                  ? "border-orange-200 focus:border-orange-400 focus:ring-orange-400 bg-white"
                                  : "bg-transparent border-transparent"
                              }`}
                            >
                              <SelectValue placeholder="Select Tier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">No Tier (€0)</SelectItem>
                              <SelectItem value="150">
                                Tier 1 (€150 &rarr; €105)
                              </SelectItem>
                              <SelectItem value="330">
                                Tier 2 (€330 &rarr; €231)
                              </SelectItem>
                              <SelectItem value="600">
                                Tier 3 (€600 &rarr; €420)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Sub Total */}
                      <div className="flex justify-between items-center p-3 bg-orange-100/50 dark:bg-orange-900/30">
                        <span className="font-semibold text-sm text-orange-900 dark:text-orange-100">
                          Total Subcontractor Payout
                        </span>
                        <span className="font-mono font-bold text-lg text-orange-700 dark:text-orange-300">
                          €{" "}
                          {(
                            invoiceEditState.projectValue * 0.7 +
                            (invoiceEditState.subQuantityBonus?.enabled
                              ? invoiceEditState.subQuantityBonus.amount * 0.7
                              : 0) +
                            (invoiceEditState.subQualityBonus?.enabled
                              ? invoiceEditState.subQualityBonus.amount * 0.7
                              : 0)
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Review Checkbox */}
                {/* Review Checkbox removed */}
              </TabsContent>

              {/* SUBCONTRACTOR TAB */}
              <TabsContent value="subcontractor" className="space-y-4">
                <div className="bg-white dark:bg-gray-950 border rounded-lg p-5 space-y-6">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase font-semibold">
                        Project Name
                      </span>
                      <span className="font-medium">
                        {currentInvoice.project}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase font-semibold">
                        Project ID
                      </span>
                      <span className="font-medium">{currentInvoice.id}</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed my-2"></div>

                  {/* Scope of Work (Subcontractor View - 70%) */}
                  <div className="bg-gray-50 dark:bg-gray-900/10 p-3 rounded text-xs space-y-3">
                    <h4 className="font-semibold uppercase text-muted-foreground">
                      Scope of Work (Subcontractor Share - 70%)
                    </h4>

                    {/* Work List */}
                    <div className="space-y-1">
                      <span className="text-muted-foreground block font-semibold mb-1">
                        Work Types:
                      </span>
                      {currentInvoice.projectData?.selectedWorkTypes?.length >
                      0 ? (
                        <ul className="space-y-1">
                          {currentInvoice.projectData.selectedWorkTypes.map(
                            (type: string) => {
                              const units =
                                currentInvoice.projectData?.indoorUnits || 0;
                              const baseCost =
                                PRICING_MATRIX.baseCosts[units]?.[
                                  type as keyof (typeof PRICING_MATRIX.baseCosts)[0]
                                ] || 0;
                              const subCost = baseCost * 0.7; // 70% share

                              return (
                                <li
                                  key={type}
                                  className="flex items-start gap-2 justify-between"
                                >
                                  <div className="flex items-start gap-2">
                                    <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                                    <span className="leading-tight text-xs">
                                      {WORK_TYPE_LABELS[type] || type}
                                    </span>
                                  </div>
                                  <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    € {subCost.toFixed(2)}
                                  </span>
                                </li>
                              );
                            },
                          )}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground italic">
                          No specific work types selected.
                        </span>
                      )}
                    </div>

                    {/* Additional Services */}
                    {currentInvoice.projectData?.selectedAdditionalServices
                      ?.length > 0 && (
                      <div className="space-y-1 mt-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                        <span className="text-muted-foreground block font-semibold mb-1">
                          Additional Services:
                        </span>
                        <ul className="space-y-1">
                          {currentInvoice.projectData.selectedAdditionalServices.map(
                            (serviceId: string) => {
                              const service = ADDITIONAL_SERVICES.find(
                                (s) => s.id === serviceId,
                              );
                              const baseCost = service?.price || 0;
                              const subCost = baseCost * 0.7;

                              return (
                                <li
                                  key={serviceId}
                                  className="flex items-start gap-2 justify-between"
                                >
                                  <div className="flex items-start gap-2">
                                    <Plus className="h-3 w-3 text-purple-600 mt-0.5 shrink-0" />
                                    <span className="leading-tight text-xs">
                                      {service?.label || serviceId}
                                    </span>
                                  </div>
                                  <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    € {subCost.toFixed(2)}
                                  </span>
                                </li>
                              );
                            },
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-dashed my-2"></div>

                  {/* Subcontractor Bonuses */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Quality Bonus */}
                    <div
                      className={`transition-colors rounded-lg border p-3 flex flex-col gap-1 ${
                        invoiceEditState.subQualityBonus.enabled
                          ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                          : "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="sub-quality-bonus-chk"
                            checked={invoiceEditState.subQualityBonus.enabled}
                            onCheckedChange={(checked) =>
                              setInvoiceEditState({
                                ...invoiceEditState,
                                subQualityBonus: {
                                  ...invoiceEditState.subQualityBonus,
                                  enabled: !!checked,
                                },
                              })
                            }
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                          <div>
                            <label
                              htmlFor="sub-quality-bonus-chk"
                              className="font-medium text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                            >
                              Quality Bonus
                            </label>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              invoiceEditState.subQualityBonus.enabled
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-400"
                            }`}
                          >
                            + €
                          </span>
                          <Input
                            type="number"
                            disabled={!invoiceEditState.subQualityBonus.enabled}
                            value={invoiceEditState.subQualityBonus.amount || 0}
                            onChange={(e) =>
                              setInvoiceEditState({
                                ...invoiceEditState,
                                subQualityBonus: {
                                  ...invoiceEditState.subQualityBonus,
                                  amount: parseGermanFloat(e.target.value) || 0,
                                },
                              })
                            }
                            className={`h-7 w-20 text-right font-mono font-bold text-sm ${
                              invoiceEditState.subQualityBonus.enabled
                                ? "border-green-200 focus:border-green-400 focus:ring-green-400 bg-white"
                                : "bg-transparent border-transparent"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quantity Bonus */}
                    <div
                      className={`transition-colors rounded-lg border p-3 flex flex-col gap-1 ${
                        invoiceEditState.subQuantityBonus.enabled
                          ? "bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
                          : "bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id="sub-quantity-bonus-chk"
                            checked={invoiceEditState.subQuantityBonus.enabled}
                            onCheckedChange={(checked) =>
                              setInvoiceEditState({
                                ...invoiceEditState,
                                subQuantityBonus: {
                                  ...invoiceEditState.subQuantityBonus,
                                  enabled: !!checked,
                                },
                              })
                            }
                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                          />
                          <div>
                            <label
                              htmlFor="sub-quantity-bonus-chk"
                              className="font-medium text-sm text-gray-900 dark:text-gray-100 cursor-pointer"
                            >
                              Quantity Bonus
                            </label>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            disabled={
                              !invoiceEditState.subQuantityBonus.enabled
                            }
                            value={String(
                              invoiceEditState.subQuantityBonus.amount || 0,
                            )}
                            onValueChange={(val) =>
                              setInvoiceEditState({
                                ...invoiceEditState,
                                subQuantityBonus: {
                                  ...invoiceEditState.subQuantityBonus,
                                  amount: parseFloat(val) || 0,
                                  label:
                                    val === "150"
                                      ? "0-12 Projects"
                                      : val === "330"
                                        ? "12-36 Projects"
                                        : val === "600"
                                          ? "36+ Projects"
                                          : "No Tier",
                                },
                              })
                            }
                          >
                            <SelectTrigger
                              className={`h-7 w-28 text-right font-mono font-bold text-sm ${
                                invoiceEditState.subQuantityBonus.enabled
                                  ? "border-green-200 focus:border-green-400 focus:ring-green-400 bg-white"
                                  : "bg-transparent border-transparent"
                              }`}
                            >
                              <SelectValue placeholder="Tier" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">None</SelectItem>
                              <SelectItem value="150">€ 150</SelectItem>
                              <SelectItem value="330">€ 330</SelectItem>
                              <SelectItem value="600">€ 600</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-dashed my-2"></div>

                  {/* Total Calculation */}
                  <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <span className="font-bold text-blue-900 dark:text-blue-100 text-sm">
                      Total Payable to Subcontractor
                    </span>
                    <span className="font-mono font-bold text-xl text-blue-700 dark:text-blue-300">
                      €{" "}
                      {(
                        (currentInvoice.projectData?.selectedWorkTypes?.reduce(
                          (acc: number, type: string) => {
                            const units =
                              currentInvoice.projectData?.indoorUnits || 0;
                            const base =
                              PRICING_MATRIX.baseCosts[units]?.[
                                type as keyof (typeof PRICING_MATRIX.baseCosts)[0]
                              ] || 0;
                            return acc + base * 0.7;
                          },
                          0,
                        ) || 0) +
                        (currentInvoice.projectData?.selectedAdditionalServices?.reduce(
                          (acc: number, s: string) => {
                            const service = ADDITIONAL_SERVICES.find(
                              (as) => as.id === s,
                            );
                            const base = service?.price || 0;
                            return acc + base * 0.7;
                          },
                          0,
                        ) || 0) +
                        (invoiceEditState.subQualityBonus.enabled
                          ? invoiceEditState.subQualityBonus.amount
                          : 0) +
                        (invoiceEditState.subQuantityBonus.enabled
                          ? invoiceEditState.subQuantityBonus.amount
                          : 0)
                      ).toLocaleString("de-DE", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  <div className="border-t border-dashed my-2"></div>

                  {/* Review Checkbox */}
                  {/* Review Checkbox removed */}
                </div>
              </TabsContent>

              {/* MEDIATOR TAB */}
              <TabsContent value="company" className="space-y-4">
                {currentInvoice.hasMediator ? (
                  <div className="bg-white dark:bg-gray-950 border rounded-lg p-5 space-y-6">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase font-semibold">
                          Project Name
                        </span>
                        <span className="font-medium">
                          {currentInvoice.project}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase font-semibold">
                          Project ID
                        </span>
                        <span className="font-medium">{currentInvoice.id}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase font-semibold">
                          Project Address
                        </span>
                        <span
                          className="font-medium truncate block"
                          title={currentInvoice.address}
                        >
                          {currentInvoice.address || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase font-semibold">
                          Subcontractor
                        </span>
                        <span className="font-medium">
                          {currentInvoice.projectData?.sub || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase font-semibold">
                          Partner
                        </span>
                        <span className="font-medium">
                          {currentInvoice.projectData?.partner || "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-xs uppercase font-semibold">
                          Mediator
                        </span>
                        <span className="font-medium">
                          {currentInvoice.projectData?.mediator}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-dashed my-2"></div>

                    <div className="space-y-4">
                      {/* Base Value */}
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/10 p-3 rounded">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Base Project Value
                        </span>
                        <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                          €{" "}
                          {invoiceEditState.projectValue.toLocaleString(
                            "de-DE",
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </span>
                      </div>

                      {/* Total with Bonuses */}
                      <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/10 p-3 rounded">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            Total Value (with Bonuses)
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Base + Quality Bonus + Quantity Bonus
                          </span>
                        </div>
                        <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                          €{" "}
                          {(
                            invoiceEditState.projectValue +
                            (invoiceEditState.qualityBonus.enabled
                              ? invoiceEditState.qualityBonus.amount
                              : 0) +
                            (invoiceEditState.quantityBonus.enabled
                              ? invoiceEditState.quantityBonus.amount
                              : 0)
                          ).toLocaleString("de-DE", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      {/* Mediator Share */}
                      <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <div className="flex flex-col">
                          <span className="font-bold text-blue-900 dark:text-blue-100 text-sm">
                            Total Payable to Mediator
                          </span>
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            (10% of Base Value)
                          </span>
                        </div>
                        <span className="font-mono font-bold text-xl text-blue-700 dark:text-blue-300">
                          €{" "}
                          {(
                            invoiceEditState.projectValue *
                            (invoiceEditState.mediatorSharePercent / 100)
                          ).toLocaleString("de-DE", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-dashed my-2"></div>

                    {/* Review Checkbox */}
                    {/* Review Checkbox removed */}
                  </div>
                ) : (
                  <div className="p-10 text-center text-muted-foreground border rounded bg-gray-50 flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-8 w-8 text-gray-300" />
                    <p>No Mediator assigned to this project.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSuccessModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 text-white"
              disabled={false}
              onClick={async () => {
                // Calculate Subcontractor Total Fee dynamically
                const subBaseFee =
                  (currentInvoice.projectData?.selectedWorkTypes?.reduce(
                    (acc: number, type: string) => {
                      const units =
                        currentInvoice.projectData?.indoorUnits || 0;
                      const base =
                        PRICING_MATRIX.baseCosts[units]?.[
                          type as keyof (typeof PRICING_MATRIX.baseCosts)[0]
                        ] || 0;
                      return acc + base * 0.7;
                    },
                    0,
                  ) || 0) +
                  (currentInvoice.projectData?.selectedAdditionalServices?.reduce(
                    (acc: number, s: string) => {
                      const service = ADDITIONAL_SERVICES.find(
                        (as) => as.id === s,
                      );
                      const base = service?.price || 0;
                      return acc + base * 0.7;
                    },
                    0,
                  ) || 0);

                const subBonusFee =
                  (invoiceEditState.subQualityBonus.enabled
                    ? invoiceEditState.subQualityBonus.amount * 0.7
                    : 0) +
                  (invoiceEditState.subQuantityBonus.enabled
                    ? invoiceEditState.subQuantityBonus.amount * 0.7
                    : 0);

                const totalSubFee = subBaseFee + subBonusFee;

                // Email sending removed as per request
                // Logic continues to register invoice locally

                // 1. Update Project Status locally
                const updatedProjects = [...projects];
                // Try to find by ID (currentInvoice.projectData.id) or fallback to reference/index if ID missing
                let realIndex = -1;
                if (currentInvoice.projectData?.id) {
                  realIndex = updatedProjects.findIndex(
                    (p) => p.id === currentInvoice.projectData.id,
                  );
                }

                // Fallback: match by title/partner if ID not found (unlikely)
                if (realIndex === -1) {
                  realIndex = updatedProjects.findIndex(
                    (p) => p === currentInvoice.projectData,
                  );
                }

                if (realIndex !== -1) {
                  updatedProjects[realIndex].status = "Invoiced";
                  updatedProjects[realIndex].statusColor =
                    "bg-gray-500 text-white";
                  updatedProjects[realIndex].invoiceStatus = "Sent";
                  // Update abnahme? Usually Invoiced implies Abnahme done.
                  setProjects(updatedProjects);
                  localStorage.setItem(
                    "prostruktion_projects_v1",
                    JSON.stringify(updatedProjects),
                  );
                }

                // 2. Generate Financial Records (Invoices)
                const existingInvoices = JSON.parse(
                  localStorage.getItem("prostruktion_invoices") || "[]",
                );
                const newInvoices = [];
                const nowStr = new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
                const supabase = createClient();

                // PARTNER Invoice
                const partnerAmount =
                  invoiceEditState.projectValue *
                    (invoiceEditState.partnerSharePercent / 100) +
                  (invoiceEditState.qualityBonus.enabled
                    ? invoiceEditState.qualityBonus.amount
                    : 0) +
                  (invoiceEditState.quantityBonus.enabled
                    ? invoiceEditState.quantityBonus.amount
                    : 0);

                const partnerInvoiceId = Date.now();
                newInvoices.push({
                  id: partnerInvoiceId,
                  project: currentInvoice.project,
                  partner: currentInvoice.projectData.partner,
                  mediator: currentInvoice.hasMediator
                    ? currentInvoice.mediator
                    : "-",
                  emp: currentInvoice.projectData.contractor, // Employer/Contractor
                  date: nowStr,
                  amount: partnerAmount,
                  type: "Partner Invoice", // Custom field not in original schema but useful, or put in action
                  action: "Partner Invoice",
                  status: "For Invoice", // Correct status for Financials Staging
                  days: "Now",
                });

                // MEDIATOR Invoice
                if (currentInvoice.hasMediator) {
                  const mediatorAmount =
                    invoiceEditState.projectValue *
                    (invoiceEditState.mediatorSharePercent / 100);
                  newInvoices.push({
                    id: partnerInvoiceId + 1,
                    project: currentInvoice.project,
                    partner: currentInvoice.projectData.partner, // Context
                    mediator: currentInvoice.mediator, // Recipient
                    emp: currentInvoice.projectData.contractor,
                    date: nowStr,
                    amount: mediatorAmount,
                    action: "Mediator Invoice",
                    status: "For Invoice",
                    days: "Now",
                  });
                }

                // SUBCONTRACTOR Invoice
                if (totalSubFee > 0 || currentInvoice.projectData.sub) {
                  newInvoices.push({
                    id: partnerInvoiceId + 2,
                    project: currentInvoice.project,
                    partner: currentInvoice.projectData.partner,
                    mediator: "-",
                    // Using 'emp' or 'partner' field to store Subcontractor Name for display
                    emp: currentInvoice.projectData.sub || "Subcontractor",
                    date: nowStr,
                    amount: totalSubFee,
                    action: "Subcontractor Invoice",
                    status: "For Invoice",
                    days: "Now",
                  });
                }

                localStorage.setItem(
                  "prostruktion_invoices",
                  JSON.stringify([...existingInvoices, ...newInvoices]),
                );

                // SYNC TO SUPABASE
                try {
                  for (const inv of newInvoices) {
                    let recipientRole = "Partner";
                    let recipientName = inv.partner;
                    if (inv.action === "Mediator Invoice") {
                      recipientRole = "Mediator";
                      recipientName = inv.mediator;
                    } else if (inv.action === "Subcontractor Invoice") {
                      recipientRole = "Subcontractor";
                      recipientName = inv.emp; // reused field
                    }

                    // Construct Scope of Work Description
                    const workTypesStr = (
                      currentInvoice.projectData?.selectedWorkTypes || []
                    )
                      .map((t: string) => WORK_TYPE_LABELS[t] || t)
                      .join(", ");
                    const addServicesStr = (
                      currentInvoice.projectData?.selectedAdditionalServices ||
                      []
                    )
                      .map((s: string) => {
                        const service = ADDITIONAL_SERVICES.find(
                          (as) => as.id === s,
                        );
                        return service?.label || s;
                      })
                      .join(", ");
                    const scopeDesc = `Indoor Units: ${
                      currentInvoice.projectData?.indoorUnits || 0
                    }. Work: ${workTypesStr}. Additional: ${addServicesStr}.`;

                    const payload = {
                      project_id: currentInvoice.projectData?.id || null,
                      project_name: inv.project,
                      recipient_name: recipientName,
                      recipient_role: recipientRole,
                      amount: inv.amount,
                      status: "For Invoice",
                      date: new Date().toISOString().split("T")[0],
                      invoice_type: inv.action,
                      description: scopeDesc,
                    };

                    const { error } = await supabase
                      .from("invoices")
                      .insert(payload);
                    if (error) {
                      console.error(
                        "Failed to sync invoice to Supabase:",
                        error,
                      );
                      throw error;
                    }
                  }
                  console.log("Invoices synced to Supabase successfully.");
                } catch (err: any) {
                  console.error("Supabase sync error:", err);
                  alert(
                    `Invoices saved locally but failed to sync to Supabase: ${err.message}. Please check if 'invoices' table exists.`,
                  );
                }

                // Close
                setSuccessModalOpen(false);
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Register Invoices
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={addProjectOpen}
        onOpenChange={(open) => {
          setAddProjectOpen(open);
          if (!open) resetProjectForm();
        }}
      >
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Project" : "Add New Project"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Edit details for the selected project."
                : "Enter the project details and calculate pricing based on the German standards."}
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
                  <label
                    htmlFor="customerNumber"
                    className="text-xs font-medium"
                  >
                    Customer Number
                  </label>
                  <Input
                    id="customerNumber"
                    value={newProject.customerNumber}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        customerNumber: e.target.value,
                      })
                    }
                    placeholder="e.g. KD-12345"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="customerPhone"
                    className="text-xs font-medium"
                  >
                    Customer Phone
                  </label>
                  <Input
                    id="customerPhone"
                    value={newProject.customerPhone}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        customerPhone: e.target.value,
                      })
                    }
                    placeholder="e.g. +49 123 456789"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="customerEmail"
                    className="text-xs font-medium"
                  >
                    Customer Email
                  </label>
                  <Input
                    id="customerEmail"
                    value={newProject.customerEmail}
                    onChange={(e) =>
                      setNewProject({
                        ...newProject,
                        customerEmail: e.target.value,
                      })
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
                          checked={newProject.workers.includes(worker.id)}
                          onCheckedChange={(checked) => {
                            setNewProject((prev) => {
                              const newWorkers = checked
                                ? [...prev.workers, worker.id]
                                : prev.workers.filter((w) => w !== worker.id);
                              return { ...prev, workers: newWorkers };
                            });
                          }}
                        />

                        {/* Name & Avatar */}
                        <div className="w-[140px] flex items-center gap-2">
                          <Avatar className="h-7 w-7 border">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.name}`}
                            />
                            <AvatarFallback>
                              {worker.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className="text-sm font-medium leading-none truncate"
                            title={worker.name}
                          >
                            {worker.name}
                          </div>
                        </div>

                        {/* Role / Trade */}
                        <div
                          className="w-[100px] text-xs text-muted-foreground capitalize truncate"
                          title={worker.trade || worker.role || "Worker"}
                        >
                          {worker.trade || worker.role || "Worker"}
                        </div>

                        {/* A1 Status */}
                        <div className="w-[80px] text-center">
                          <Badge
                            variant="secondary"
                            className="text-[9px] bg-gray-50 text-gray-500 hover:bg-gray-100 font-normal border px-1"
                          >
                            {worker.a1Status || "No File"}
                          </Badge>
                        </div>

                        {/* Certification */}
                        <div className="w-[100px] text-center">
                          <Badge
                            variant="secondary"
                            className="text-[9px] bg-gray-50 text-gray-500 hover:bg-gray-100 font-normal border px-1"
                          >
                            {worker.certStatus || "No Certificate"}
                          </Badge>
                        </div>

                        {/* Stats */}
                        <div className="w-[70px] text-center text-xs flex items-center justify-center gap-1 text-muted-foreground">
                          <CheckCircle2 className="h-3 w-3" />{" "}
                          {worker.completedProjects || 0}
                        </div>
                        <div className="w-[70px] text-center text-xs flex items-center justify-center gap-1 text-muted-foreground">
                          <AlertCircle className="h-3 w-3" />{" "}
                          {worker.complaints || 0}
                        </div>
                        <div className="w-[60px] text-center text-xs text-green-600 font-medium">
                          {worker.successRate || 100}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-sm text-muted-foreground p-8 flex flex-col items-center justify-center gap-2">
                      <Users className="h-8 w-8 text-muted-foreground/50" />
                      <p>
                        {newProject.sub || newProject.partner
                          ? "No workers found for selected companies."
                          : "Select Subcontractor or Partner to see workers."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Calculator Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4" /> Project Pricing & Scope
            </h3>

            <div className="grid gap-6">
              {/* Indoor Units Slider */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">
                    Number of Indoor Units
                  </label>
                  <span className="text-lg font-bold bg-white dark:bg-slate-800 px-3 py-1 rounded border shadow-sm">
                    {newProject.indoorUnits}
                  </span>
                </div>
                <Input
                  type="range"
                  min="0"
                  max="16"
                  step="1"
                  value={newProject.indoorUnits}
                  onChange={(e) => {
                    const units = parseInt(e.target.value);
                    const currentCosts = PRICING_MATRIX.baseCosts[units] || {};

                    // Recalculate price
                    let basePrice = 0;
                    newProject.selectedWorkTypes.forEach((type) => {
                      basePrice += (currentCosts as any)[type] || 0;
                    });

                    let servicesPrice = 0;
                    newProject.selectedAdditionalServices.forEach(
                      (serviceId) => {
                        const service = ADDITIONAL_SERVICES.find(
                          (s) => s.id === serviceId,
                        );
                        if (service) servicesPrice += service.price;
                      },
                    );

                    setNewProject({
                      ...newProject,
                      indoorUnits: units,
                      amount: (basePrice + servicesPrice).toString(),
                    });
                  }}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>0</span>
                  <span>8</span>
                  <span>16</span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Work Types Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium block border-b pb-1 mb-2">
                    Base Work Types
                  </label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {Object.entries(WORK_TYPE_LABELS).map(([key, label]) => {
                      const unitCosts =
                        PRICING_MATRIX.baseCosts[newProject.indoorUnits] || {};
                      const cost = (unitCosts as any)[key] || 0;

                      return (
                        <div
                          key={key}
                          className="flex items-center space-x-2 bg-white dark:bg-slate-950 p-2 rounded border hover:bg-slate-50 transition-colors"
                        >
                          <Checkbox
                            id={`work-${key}`}
                            checked={newProject.selectedWorkTypes.includes(key)}
                            onCheckedChange={(checked) => {
                              let newTypes = [...newProject.selectedWorkTypes];
                              if (checked) {
                                newTypes.push(key);
                              } else {
                                newTypes = newTypes.filter((t) => t !== key);
                              }

                              // Recalculate
                              const currentCosts =
                                PRICING_MATRIX.baseCosts[
                                  newProject.indoorUnits
                                ] || {};
                              let basePrice = 0;
                              newTypes.forEach((type) => {
                                basePrice += (currentCosts as any)[type] || 0;
                              });

                              let servicesPrice = 0;
                              newProject.selectedAdditionalServices.forEach(
                                (serviceId) => {
                                  const service = ADDITIONAL_SERVICES.find(
                                    (s) => s.id === serviceId,
                                  );
                                  if (service) servicesPrice += service.price;
                                },
                              );

                              setNewProject({
                                ...newProject,
                                selectedWorkTypes: newTypes,
                                amount: (basePrice + servicesPrice).toString(),
                              });
                            }}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`work-${key}`}
                              className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer block"
                            >
                              {label}
                            </label>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              € {cost}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Services Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium block border-b pb-1 mb-2">
                    Additional Services
                  </label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {ADDITIONAL_SERVICES.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center space-x-2 bg-white dark:bg-slate-950 p-2 rounded border hover:bg-slate-50 transition-colors"
                      >
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={newProject.selectedAdditionalServices.includes(
                            service.id,
                          )}
                          onCheckedChange={(checked) => {
                            let newServices = [
                              ...newProject.selectedAdditionalServices,
                            ];
                            if (checked) {
                              newServices.push(service.id);
                            } else {
                              newServices = newServices.filter(
                                (s) => s !== service.id,
                              );
                            }

                            // Recalculate
                            const currentCosts =
                              PRICING_MATRIX.baseCosts[
                                newProject.indoorUnits
                              ] || {};
                            let basePrice = 0;
                            newProject.selectedWorkTypes.forEach((type) => {
                              basePrice += (currentCosts as any)[type] || 0;
                            });

                            let servicesPrice = 0;
                            newServices.forEach((serviceId) => {
                              const s = ADDITIONAL_SERVICES.find(
                                (item) => item.id === serviceId,
                              );
                              if (s) servicesPrice += s.price;
                            });

                            setNewProject({
                              ...newProject,
                              selectedAdditionalServices: newServices,
                              amount: (basePrice + servicesPrice).toString(),
                            });
                          }}
                        />
                        <div className="flex-1">
                          <label
                            htmlFor={`service-${service.id}`}
                            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer block"
                          >
                            {service.label}
                          </label>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            € {service.price}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="space-y-2 bg-slate-100 dark:bg-slate-900 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">Estimated Total</h4>
                  <p className="text-xs text-muted-foreground">
                    Based on {newProject.indoorUnits} units,{" "}
                    {newProject.selectedWorkTypes.length} work types, and{" "}
                    {newProject.selectedAdditionalServices.length} add-ons.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary">
                    €{" "}
                    {parseFloat(newProject.amount || "0").toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Project Description / Notes
                </label>
                <Textarea
                  id="description"
                  placeholder="Additional notes..."
                  className="min-h-[100px] font-mono text-xs"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      description: e.target.value,
                    })
                  }
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
                  onChange={(e) =>
                    setNewProject({
                      ...newProject,
                      estimatedHours: e.target.value,
                    })
                  }
                />
              </div>

              {/* Editable Amount Override */}
              <div className="space-y-2">
                <label
                  htmlFor="amount"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Final Amount Override (if needed)
                </label>
                <Input
                  id="amount"
                  placeholder="0.00"
                  value={newProject.amount}
                  onChange={(e) =>
                    setNewProject({ ...newProject, amount: e.target.value })
                  }
                  className="h-8 text-xs w-full sm:w-1/3"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddProjectOpen(false);
                resetProjectForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProject}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />{" "}
              {isEditing ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
