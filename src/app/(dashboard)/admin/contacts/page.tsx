"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Briefcase,
  HardHat,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Plus,
  ArrowLeft,
  Hammer,
  UserCog,
  MapPin,
  Phone,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ThermometerSun, // For 'Cooling' visualization
  MoreHorizontal,
  Download,
  Filter,
  Upload,
  X,
  ImageIcon,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SubcontractorDetail } from "@/components/admin/subcontractor-detail";
import {
  KanbanBoard,
  Lead,
  LeadStage,
} from "@/components/admin/contacts/kanban-board";

type Contact = {
  id: string;
  name: string;
  companyName?: string;
  role:
    | "partner"
    | "broker"
    | "contractor"
    | "subcontractor"
    | "staff"
    | "super_admin";
  jobTitle?: string;
  email?: string;
  phone?: string;
  status: "Active" | "Inactive" | "Blocked" | "Pending";
  // New metrics
  regWorkers: number;
  activeProjects: number;
  complaints: number;
  activeComplaints: number;
  completedProjects: number;
  successRate: number;
  mediator?: string;
  contractor?: string;
  documents?: any[];
  // CRM Fields
  stage?: LeadStage;
  notes?: string;
  value?: number;
  nextStep?: string;
};

type Worker = {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  status: "Active" | "On Leave" | "Inactive"; // General status
  a1Status: "Valid" | "Expired" | "Pending";
  coolingStatus: "Valid" | "Expiring Soon" | "Expired";
  complaints: number;
  successRate: number;
  phone: string;
  email: string;
  avatarSeed: string;
};

// Mock Workers Data Generator
const generateMockWorkers = (count: number): Worker[] => {
  const roles = [
    "Electrician",
    "HVAC Installer",
    "Welder",
    "Plumber",
    "Fisslene Fischer",
    "Patake Wagmer",
  ];
  return Array.from({ length: count }).map((_, i) => ({
    id: `worker-${i}`,
    firstName: [
      "Mark",
      "Ralf",
      "Simone",
      "Stefan",
      "Patrick",
      "Tim",
      "Marco",
      "Lukas",
    ][i % 8],
    lastName: [
      "Weber",
      "König",
      "Fischer",
      "Bauer",
      "Wagner",
      "Roth",
      "Schmidt",
      "Müller",
      "Wagner",
    ][i % 8],
    role: roles[Math.floor(Math.random() * roles.length)],
    status: Math.random() > 0.1 ? "Active" : "On Leave",
    a1Status: Math.random() > 0.2 ? "Valid" : "Expired",
    coolingStatus:
      Math.random() > 0.8
        ? "Expiring Soon"
        : Math.random() > 0.2
          ? "Valid"
          : "Expired",
    complaints: Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0,
    successRate: Math.floor(90 + Math.random() * 10),
    phone: `+49 152 5273${5000 + i}`,
    email: `worker${i}@example.com`,
    avatarSeed: `worker-${i}-${Date.now()}`,
  }));
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "pipeline">("list");

  // View State for Drill-down
  const [selectedSubcontractor, setSelectedSubcontractor] =
    useState<Contact | null>(null);
  const [subWorkers, setSubWorkers] = useState<Worker[]>([]);

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Add Contact Form State
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    role: "subcontractor", // Default
    email: "",
    phone: "",
    address: "",
    mediator: "",
    contractor: "",
    mediatorName: "",
    mediatorEmail: "",
    mediatorPhone: "",
  });

  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag and drop for logo
  const handleLogoDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleLogoDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  // Add Mediator State
  const [isAddMediatorOpen, setIsAddMediatorOpen] = useState(false);
  const [newMediator, setNewMediator] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;

    setIsDeleting(true);
    const { id, role, name, companyName, email } = contactToDelete;

    // 1. Remove from LocalStorage
    let storageKey = "";
    if (role === "subcontractor") storageKey = "prostruktion_subcontractors";
    else if (role === "contractor") storageKey = "prostruktion_contractors";
    else if (role === "partner") storageKey = "prostruktion_partners";
    else if (role === "broker") storageKey = "prostruktion_mediators";

    if (storageKey) {
      try {
        const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
        // Filter by name/email/company since generated IDs might not match LS logic perfectly
        // (LS logic in this file uses simple push, IDs are generated on load.
        // We match by name/company/email to be safe).
        const update = existing.filter((item: any) => {
          // Try to match somewhat loosely to ensure deletion
          return (
            item.name !== name &&
            item.name !== companyName &&
            item.name !== contactToDelete.name
          );
        });
        localStorage.setItem(storageKey, JSON.stringify(update));
      } catch (e) {
        console.error("Error removing from LocalStorage", e);
      }
    }

    // 2. Remove from Supabase
    try {
      const supabase = createClient();
      // ID in state might be 'sub-xxxxx' (generated) or uuid (real).
      // If it starts with 'sub-', 'cont-', etc it's likely a LS contact, but let's try to delete by ID anyway if it looks like a UUID,
      // or try to match by email if possible.

      let shouldDeleteByEmail =
        id.startsWith("sub-") ||
        id.startsWith("cont-") ||
        id.startsWith("part-") ||
        id.startsWith("med-");

      if (!shouldDeleteByEmail) {
        await supabase.from("profiles").delete().eq("id", id);
      } else if (email) {
        // Fallback: delete by email if ID was client-generated mock
        await supabase.from("profiles").delete().eq("email", email);
      }
    } catch (e) {
      console.error("Error removing from Supabase", e);
    }

    // 3. Update Local State
    setContacts((prev) => prev.filter((c) => c.id !== id));

    // Close & Reset
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setContactToDelete(null);
  };

  const handleAddContact = () => {
    // Basic Validation
    if (!newContact.name || !newContact.email) {
      alert("Please provide both Name and Email.");
      return;
    }

    console.log("Attempting to save contact:", newContact);

    // Create new contact object
    // Save to Supabase (Contacts Table)
    const saveToSupabase = async () => {
      try {
        const supabase = createClient();

        // Prepare base contact data
        const contactData = {
          name: newContact.name,
          email: newContact.email,
          phone: newContact.phone || null,
          role: newContact.role,
          company_name: newContact.name, // Using name as company name
          address: newContact.address || null,
          status: "Active",
        };

        let savedContactId = null;

        // If creating a subcontractor with a mediator, first create/find the mediator
        if (newContact.role === "subcontractor" && newContact.mediatorName) {
          // 1. Create Mediator in Contacts
          const { data: medData, error: medError } = await supabase
            .from("contacts")
            .insert({
              name: newContact.mediatorName,
              email: newContact.mediatorEmail || null,
              phone: newContact.mediatorPhone || null,
              role: "broker", // Mediator role
              company_name: newContact.mediatorName,
              status: "Active",
            })
            .select("id")
            .single();

          if (medError) {
            console.error("Error creating mediator:", medError);
            alert("Error creating mediator: " + medError.message);
          } else if (medData) {
            // 2. Add mediator_id to subcontractor data
            (contactData as any).mediator_id = medData.id;
          }
        }

        // Create Main Contact
        const { data, error } = await supabase
          .from("contacts")
          .insert(contactData)
          .select("id")
          .single();

        if (error) {
          console.error("Error creating contact:", error);
          alert("Error creating contact: " + error.message);
          // Verify if it's a conflict or other issue
        } else {
          // Success
          console.log("Contact saved to Supabase:", data);
        }
      } catch (e) {
        console.warn("Failed to save contact to Supabase:", e);
        alert("Failed to save contact to Supabase: " + String(e));
      }
    };
    saveToSupabase();

    // Update Local State directly to avoid reload (Mock ID until refresh)
    // Generate local object for immediate feedback
    const mockId = `temp-${Date.now()}`;
    const newContactObj: Contact = {
      id: mockId,
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone,
      role: newContact.role as any,
      companyName: newContact.name,
      jobTitle:
        newContact.role.charAt(0).toUpperCase() + newContact.role.slice(1),
      status: "Active",
      regWorkers: 0,
      activeProjects: 0,
      complaints: 0,
      activeComplaints: 0,
      completedProjects: 0,
      successRate: 0,
      stage: "new",
      mediator: newContact.mediatorName, // Keep for display
    };

    setContacts((prev) => [newContactObj, ...prev]);

    setAddContactOpen(false);
    // Reset form
    setNewContact({
      name: "",
      role: "subcontractor",
      email: "",
      phone: "",
      address: "",
      mediator: "",
      contractor: "",
      mediatorName: "",
      mediatorEmail: "",
      mediatorPhone: "",
    });
    // Reset logo
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleAddMediator = () => {
    if (!newMediator.name) return;

    const mediatorObj: Contact = {
      id: `med-${Date.now()}`,
      name: newMediator.name,
      companyName: newMediator.name,
      role: "broker",
      jobTitle: "Mediator",
      email: newMediator.email,
      phone: newMediator.phone,
      status: "Active",
      regWorkers: 0,
      activeProjects: 0,
      complaints: 0,
      activeComplaints: 0,
      completedProjects: 0,
      successRate: 0,
    };

    setContacts((prev) => [mediatorObj, ...prev]);
    setIsAddMediatorOpen(false);
    setNewMediator({ name: "", email: "", phone: "" });
  };

  const availableMediators = contacts.filter((c) => c.role === "broker");
  const availableContractors = contacts.filter((c) => c.role === "contractor");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const allContacts: Contact[] = [];

      // 1. Fetch Supabase Users (Partners & Mediators & Admins)
      const supabase = createClient();
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profiles) {
        profiles.forEach((p) => {
          let derivedRole: Contact["role"] = "partner";
          if (p.role === "broker") derivedRole = "broker";
          if (p.role === "super_admin") derivedRole = "staff";

          allContacts.push({
            id: p.id,
            name: p.full_name || p.email || "Unknown",
            companyName: p.company_name || p.full_name || "Prostruktion",
            role: derivedRole,
            jobTitle: p.role === "super_admin" ? "Admin" : "Manager",
            email: p.email,
            phone: p.phone || "+49 123 4567890",
            status: "Active",
            regWorkers: 0,
            activeProjects: 0,
            complaints: 0,
            activeComplaints: 0,
            completedProjects: 0,
            successRate: 0,
            stage: "active", // Supabase users are likely active
          });
        });
      }

      // 2. Fetch Subcontractors from LocalStorage
      let storedSubs = localStorage.getItem("prostruktion_subcontractors");

      // Seed Subcontractors if empty
      // Seed Subcontractors if empty - REMOVED for clean slate
      if (!storedSubs) {
        localStorage.setItem("prostruktion_subcontractors", JSON.stringify([]));
        storedSubs = "[]";
      }

      if (storedSubs) {
        const subs = JSON.parse(storedSubs);
        subs.forEach((s: any) => {
          allContacts.push({
            id: `sub-${Math.random().toString(36).substr(2, 9)}`,
            name: s.name,
            companyName: s.name,
            role: "subcontractor",
            jobTitle: "Viewer",
            email: s.email || "contact@sub.com",
            phone: s.phone || "+49 000 0000",
            status: s.status,
            regWorkers: 0,
            activeProjects: 0,
            complaints: 0,
            activeComplaints: 0,
            completedProjects: 0,
            successRate: 0,
            mediator: s.mediator,
            contractor: s.contractor,
            documents: s.documents || [],
            stage: s.stage || "new",
          });
        });
      }

      // 3. Fetch Contractors from LocalStorage
      const storedContractors = localStorage.getItem(
        "prostruktion_contractors",
      );
      if (storedContractors) {
        const conts = JSON.parse(storedContractors);
        conts.forEach((c: any) => {
          allContacts.push({
            id: `cont-${Math.random().toString(36).substr(2, 9)}`,
            name: c.name,
            companyName: c.name,
            role: "contractor",
            jobTitle: "Admin",
            email: c.email || "contact@contractor.com",
            phone: c.phone || "+49 111 1111",
            status: c.status || "Active",
            regWorkers: 0,
            activeProjects: 0,
            complaints: 0,
            activeComplaints: 0,
            completedProjects: 0,
            successRate: 0,
            documents: c.documents || [],
          });
        });
      } else {
        localStorage.setItem("prostruktion_contractors", JSON.stringify([]));
      }

      // 4. Inject Mock Partners - Removed

      // 4. Inject Mock Partners - Removed
      // Mock partners array removed.

      // 5. Fetch Partners from LocalStorage (New)
      const storedPartners = localStorage.getItem("prostruktion_partners");
      if (storedPartners) {
        const parts = JSON.parse(storedPartners);
        parts.forEach((p: any) => {
          allContacts.push({
            id: `part-${Math.random().toString(36).substr(2, 9)}`,
            name: p.name,
            companyName: p.name,
            role: "partner",
            jobTitle: "Partner",
            email: p.email,
            phone: p.phone,
            status: p.status || "Active",
            regWorkers: 0,
            activeProjects: 0,
            complaints: 0,
            activeComplaints: 0,
            completedProjects: 0,
            successRate: 0,
            documents: p.documents || [],
          });
        });
      }

      // 6. Fetch Mediators from LocalStorage (New)
      const storedMediators = localStorage.getItem("prostruktion_mediators");
      if (storedMediators) {
        const meds = JSON.parse(storedMediators);
        meds.forEach((m: any) => {
          allContacts.push({
            id: `med-${Math.random().toString(36).substr(2, 9)}`,
            name: m.name, // Mediators often use personal names as company in this context or added separately
            companyName: m.companyName || m.name,
            role: "broker",
            jobTitle: "Mediator",
            email: m.email,
            phone: m.phone,
            status: m.status || "Active",
            regWorkers: 0,
            activeProjects: 0,
            complaints: 0,
            activeComplaints: 0,
            completedProjects: 0,
            successRate: 0,
            documents: m.documents || [],
          });
        });
      }

      // Filter out mediators (brokers) and staff/admin immediately as per requirement
      // "Contact type colum should only contain subcontractors, contractors and partners but no mediators."
      // Filter Logic for Main Table (Contractors, Subs, Partners)
      const filteredRaw = allContacts.filter(
        (c) =>
          c.role === "contractor" ||
          c.role === "subcontractor" ||
          c.role === "partner",
      );

      // Filter Logic for Mediators Table
      // Assuming 'broker' is the role for Mediator from previous context
      const mediatorsRaw = allContacts.filter((c) => c.role === "broker");

      // Add mock metrics for contacts (Not needed for mediators per requirement "it's information" - likely standard)
      const contactsWithMetrics = filteredRaw.map((c) => ({
        ...c,
        regWorkers: 0,
        activeProjects: 0,
        complaints: 0,
        activeComplaints: 0,
        completedProjects: 0,
        successRate: 0,
        documents: c.documents || [], // Preserve documents!
      }));

      setContacts([...contactsWithMetrics, ...mediatorsRaw]); // Store all, filter in render
      setLoading(false);
    }

    fetchData();
  }, []);

  // Filter Logic
  // Filter Logic: Main Table (No Mediators)
  const filteredContacts = contacts.filter((contact) => {
    if (contact.role === "broker") return false; // Exclude mediators
    if (filterType !== "all" && contact.role !== filterType) return false;
    return true;
  });

  // Filter Logic: Mediators Table
  const filteredMediators = contacts.filter((contact) => {
    if (contact.role !== "broker") return false;
    // Apply search filter if needed, but for now just show all mediators
    return true;
  });

  // Calculate Pagination for Main Table
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterRole]);

  // Stats Logic
  const totalContacts = contacts.length;
  const countContractors = contacts.filter(
    (c) => c.role === "contractor",
  ).length;
  const countPartners = contacts.filter((c) => c.role === "partner").length;
  const countMediators = contacts.filter((c) => c.role === "broker").length;
  const countSubs = contacts.filter((c) => c.role === "subcontractor").length;

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "broker":
        return "Mediator";
      case "staff":
        return "Staff";
      case "super_admin":
        return "Staff";
      default:
        return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  const handleViewClick = (contact: Contact) => {
    if (contact.role === "subcontractor" || contact.role === "partner") {
      setSubWorkers(generateMockWorkers(28)); // Mock 28 workers to match image
      setSelectedSubcontractor(contact);
    }
  };
  const handleLeadsChange = (updatedLeads: any[]) => {
    // Update local state
    setContacts((prev) => {
      const newContacts = [...prev];
      updatedLeads.forEach((lead) => {
        const index = newContacts.findIndex((c) => c.id === lead.id);
        if (index !== -1) {
          newContacts[index] = { ...newContacts[index], ...lead };

          // Persist to LocalStorage
          const contact = newContacts[index];
          let storageKey = "";
          if (contact.role === "subcontractor")
            storageKey = "prostruktion_subcontractors";
          else if (contact.role === "contractor")
            storageKey = "prostruktion_contractors";
          else if (contact.role === "partner")
            storageKey = "prostruktion_partners";
          else if (contact.role === "broker")
            storageKey = "prostruktion_mediators";

          if (storageKey) {
            const existing = JSON.parse(
              localStorage.getItem(storageKey) || "[]",
            );
            const update = existing.map((item: any) => {
              if (item.name === contact.name || item.email === contact.email) {
                return { ...item, stage: contact.stage };
              }
              return item;
            });
            localStorage.setItem(storageKey, JSON.stringify(update));
          }
        }
      });
      return newContacts;
    });
  };

  // ----- RENDER: WORKERS DETAIL VIEW -----
  if (selectedSubcontractor) {
    return (
      <SubcontractorDetail
        subcontractor={selectedSubcontractor}
        onBack={() => setSelectedSubcontractor(null)}
      />
    );
  }

  // ----- RENDER: MAIN CONTACTS LIST -----
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Contacts</h2>
          <div className="flex bg-muted p-1 rounded-lg">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8"
            >
              <Users className="h-4 w-4 mr-2" /> List
            </Button>
            <Button
              variant={viewMode === "pipeline" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("pipeline")}
              className="h-8"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" /> Pipeline
            </Button>
          </div>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" /> Total Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalContacts}</div>
              <Users className="h-4 w-4 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <HardHat className="h-4 w-4 text-green-600" /> Contractors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{countContractors}</div>
              <UserCog className="h-4 w-4 text-green-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-orange-600" /> Partners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{countPartners}</div>
              <Briefcase className="h-4 w-4 text-orange-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Hammer className="h-4 w-4 text-emerald-600" /> Subcontractors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{countSubs}</div>
              <Hammer className="h-4 w-4 text-emerald-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-muted/20 p-2 rounded-lg border gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            Filters:
          </span>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] h-9 bg-white dark:bg-gray-950 border-gray-200">
              <SelectValue placeholder="All Contact Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contact Types</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="broker">Mediator</SelectItem>
              <SelectItem value="contractor">Contractor</SelectItem>
              <SelectItem value="subcontractor">Subcontractor</SelectItem>
              <SelectItem value="staff">Internal Staff</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-roles">
            <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-gray-950 border-gray-200">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-roles">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="any-status">
            <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-gray-950 border-gray-200">
              <SelectValue placeholder="Any Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any-status">Any Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-[280px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or company"
              className="h-9 pl-9 bg-white dark:bg-gray-950 border-gray-200"
            />
          </div>
          <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" /> Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Create a new partner, subcontractor, contractor, or mediator.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="c-role">Role</Label>
                  <Select
                    value={newContact.role}
                    onValueChange={(val) =>
                      setNewContact({ ...newContact, role: val })
                    }
                  >
                    <SelectTrigger id="c-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="partner">Partner</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                      <SelectItem value="subcontractor">
                        Subcontractor
                      </SelectItem>
                      <SelectItem value="broker">Mediator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c-name">Company Name</Label>
                  <Input
                    id="c-name"
                    value={newContact.name}
                    onChange={(e) =>
                      setNewContact({ ...newContact, name: e.target.value })
                    }
                    placeholder="e.g. Acme Construction GmbH"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="c-email">Email</Label>
                    <Input
                      id="c-email"
                      type="email"
                      value={newContact.email}
                      onChange={(e) =>
                        setNewContact({ ...newContact, email: e.target.value })
                      }
                      placeholder="contact@example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="c-phone">Phone</Label>
                    <Input
                      id="c-phone"
                      value={newContact.phone}
                      onChange={(e) =>
                        setNewContact({ ...newContact, phone: e.target.value })
                      }
                      placeholder="+49 ..."
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c-address">Address</Label>
                  <Input
                    id="c-address"
                    value={newContact.address}
                    onChange={(e) =>
                      setNewContact({ ...newContact, address: e.target.value })
                    }
                    placeholder="Street, City, Zip"
                  />
                </div>

                {/* Logo Upload - Show for subcontractor, partner, contractor */}
                {(newContact.role === "subcontractor" ||
                  newContact.role === "partner" ||
                  newContact.role === "contractor") && (
                  <div className="grid gap-2">
                    <Label>Company Logo</Label>
                    <div
                      className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
                        isDragging
                          ? "border-primary bg-primary/5"
                          : logoPreview
                            ? "border-green-400 bg-green-50 dark:bg-green-950/20"
                            : "border-gray-300 dark:border-gray-700 hover:border-primary/50 hover:bg-muted/30"
                      }`}
                      onDrop={handleLogoDrop}
                      onDragOver={handleLogoDragOver}
                      onDragLeave={handleLogoDragLeave}
                    >
                      {logoPreview ? (
                        <div className="relative p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="h-20 w-20 object-contain rounded-lg border bg-white dark:bg-gray-900 shadow-sm"
                              />
                              <button
                                type="button"
                                onClick={removeLogo}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                Logo uploaded
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {logoFile?.name || "Logo image"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Click or drag to replace
                              </p>
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-6 cursor-pointer">
                          <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Upload company logo
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Drag and drop or click to browse
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG, SVG up to 2MB
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {newContact.role === "subcontractor" && (
                  <div className="grid gap-2">
                    <Label htmlFor="c-contractor">Link to Contractor</Label>
                    <Select
                      value={newContact.contractor}
                      onValueChange={(val) =>
                        setNewContact({ ...newContact, contractor: val })
                      }
                    >
                      <SelectTrigger id="c-contractor">
                        <SelectValue placeholder="Select Contractor" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableContractors.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {newContact.role === "subcontractor" && (
                  <div className="border-t pt-4 mt-2 space-y-4 bg-gray-50 dark:bg-gray-900/50 -mx-6 px-6 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCircle className="h-4 w-4 text-blue-600" />
                      <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-200">
                        Create Mediator for Subcontractor
                      </h4>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="m-name">Mediator Name</Label>
                      <Input
                        id="m-name"
                        value={newContact.mediatorName}
                        onChange={(e) =>
                          setNewContact({
                            ...newContact,
                            mediatorName: e.target.value,
                          })
                        }
                        placeholder="Full Name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="m-email">Mediator Email</Label>
                        <Input
                          id="m-email"
                          type="email"
                          value={newContact.mediatorEmail}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              mediatorEmail: e.target.value,
                            })
                          }
                          placeholder="email@example.com"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="m-phone">Mediator Phone</Label>
                        <Input
                          id="m-phone"
                          value={newContact.mediatorPhone}
                          onChange={(e) =>
                            setNewContact({
                              ...newContact,
                              mediatorPhone: e.target.value,
                            })
                          }
                          placeholder="+49 ..."
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAddContactOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddContact}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Create Contact
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {viewMode === "pipeline" ? (
        <div className="h-[calc(100vh-250px)]">
          <KanbanBoard
            leads={(filteredContacts as any[]).filter(
              (c) => c.stage !== "active",
            )}
            onLeadsChange={handleLeadsChange}
          />
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            {filteredContacts.length} Contacts found
          </div>

          {/* Main Table */}
          <div className="rounded-md border bg-white dark:bg-gray-950 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50/80 dark:bg-gray-900/50">
                <TableRow>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    Company Name
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                    Contact Type
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-center">
                    Reg. Workers
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-center">
                    Active Proj.
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-center">
                    Completed
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-center">
                    Complaints
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-center">
                    Active Compl.
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-center">
                    Success
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Loading data...
                    </TableCell>
                  </TableRow>
                ) : filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      No contacts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedContacts.map((contact, i) => (
                    <TableRow
                      key={i}
                      className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.companyName}`}
                            />
                            <AvatarFallback>
                              {contact.companyName
                                ?.substring(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {contact.companyName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex text-sm text-gray-700 dark:text-gray-300">
                          {getRoleLabel(contact.role)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600 dark:text-gray-400">
                        {contact.regWorkers}
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600 dark:text-gray-400">
                        {contact.activeProjects}
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600 dark:text-gray-400">
                        {contact.completedProjects}
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600 dark:text-gray-400">
                        {contact.complaints}
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600 dark:text-gray-400">
                        {contact.activeComplaints > 0 ? (
                          <span className="text-red-500 font-medium">
                            {contact.activeComplaints}
                          </span>
                        ) : (
                          "0"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium text-green-600">
                          {contact.successRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(contact.role === "subcontractor" ||
                            contact.role === "partner") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 hover:text-yellow-800 border border-yellow-200"
                              onClick={() => handleViewClick(contact)}
                            >
                              View <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(contact)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Footer */}
            <div className="flex flex-col md:flex-row items-center justify-between p-4 border-t bg-gray-50/50 dark:bg-gray-900/50 gap-4">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {filteredContacts.length > 0
                  ? (currentPage - 1) * itemsPerPage + 1
                  : 0}{" "}
                to{" "}
                {Math.min(currentPage * itemsPerPage, filteredContacts.length)}{" "}
                of {filteredContacts.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from(
                  {
                    length: Math.min(
                      5,
                      Math.ceil(filteredContacts.length / itemsPerPage),
                    ),
                  },
                  (_, i) => {
                    const totalPages = Math.ceil(
                      filteredContacts.length / itemsPerPage,
                    );
                    let pageNum = i + 1;

                    // Simple sliding window if many pages
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                    }

                    if (pageNum > totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "secondary" : "outline"
                        }
                        size="sm"
                        className={`h-8 w-8 p-0 ${
                          currentPage === pageNum
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "text-muted-foreground"
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  },
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-yellow-600 gap-1"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(
                        Math.ceil(filteredContacts.length / itemsPerPage),
                        p + 1,
                      ),
                    )
                  }
                  disabled={
                    currentPage >=
                    Math.ceil(filteredContacts.length / itemsPerPage)
                  }
                >
                  Next Page <ChevronRight className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const sizes = [10, 20, 50, 100];
                      const currentIndex = sizes.indexOf(itemsPerPage);
                      if (currentIndex > 0) {
                        setItemsPerPage(sizes[currentIndex - 1]);
                        setCurrentPage(1);
                      }
                    }}
                    disabled={itemsPerPage === 10}
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-xs font-medium text-muted-foreground w-16 text-center">
                    {itemsPerPage} / page
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      const sizes = [10, 20, 50, 100];
                      const currentIndex = sizes.indexOf(itemsPerPage);
                      if (currentIndex < sizes.length - 1) {
                        setItemsPerPage(sizes[currentIndex + 1]);
                        setCurrentPage(1);
                      }
                    }}
                    disabled={itemsPerPage === 100}
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2 text-muted-foreground"
                >
                  Download CSV <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">Mediators</h3>
              <Button
                onClick={() => setIsAddMediatorOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm h-9"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Mediator
              </Button>
            </div>
            <div className="rounded-md border bg-white dark:bg-gray-950 overflow-hidden">
              <Table>
                <TableHeader className="bg-purple-50/50 dark:bg-purple-900/20">
                  <TableRow>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                      Name
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                      Role
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                      Email
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                      Phone
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMediators.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No mediators found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMediators.map((mediator, i) => (
                      <TableRow key={i} className="hover:bg-purple-50/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-purple-100 text-purple-700">
                                {mediator.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">
                              {mediator.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {mediator.jobTitle || "Mediator"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mediator.email}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mediator.phone}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">
                            {mediator.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}

      {/* Add Mediator Dialog */}
      <Dialog open={isAddMediatorOpen} onOpenChange={setIsAddMediatorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Mediator</DialogTitle>
            <DialogDescription>
              Create a new mediator profile.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="med-name">Name</Label>
              <Input
                id="med-name"
                value={newMediator.name}
                onChange={(e) =>
                  setNewMediator({ ...newMediator, name: e.target.value })
                }
                placeholder="Mediator Name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="med-email">Email</Label>
              <Input
                id="med-email"
                value={newMediator.email}
                onChange={(e) =>
                  setNewMediator({ ...newMediator, email: e.target.value })
                }
                placeholder="mediator@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="med-phone">Phone</Label>
              <Input
                id="med-phone"
                value={newMediator.phone}
                onChange={(e) =>
                  setNewMediator({ ...newMediator, phone: e.target.value })
                }
                placeholder="+49..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddMediatorOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddMediator}>Add Mediator</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Contact
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {contactToDelete?.companyName || contactToDelete?.name}
              </strong>
              ?
              <br />
              <br />
              This action cannot be undone. The contact will be removed from
              your list permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
