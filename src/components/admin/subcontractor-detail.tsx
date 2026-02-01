import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Plus,
  Users,
  Briefcase,
  CheckCircle2,
  Clock,
  MoreVertical,
  Mail,
  Phone,
  UserCog,
  Search,
  AlertCircle,
  ThermometerSun,
  Hammer,
  RotateCw,
  MapPin,
  ChevronDown,
  FileText,
  X,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { createClient } from "@/lib/supabase/client";

interface DocumentItem {
  file?: File; // Optional for persistence
  name: string;
  startDate?: string;
  endDate?: string;
}

interface Worker {
  id: string;
  name: string;
  role: string;
  subRole?: string;
  status: "Active" | "On Leave" | "Inactive" | "Blocked";
  a1Status: "Valid" | "Expired" | "Pending";
  a1Start?: string;
  a1End?: string;
  a1Files?: string[];
  certStatus: "Valid" | "Expiring Soon" | "Expired" | "None";
  certStart?: string;
  certEnd?: string;
  certFiles?: string[];
  activeProjects: number;
  completedProjects: number;
  complaints: number;
  successRate: number;
  joinedDate: string;
  avatarSeed: string;
  supabaseId?: string; // ID in Supabase profiles (if created)
  synced?: boolean;
}

interface Manager {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
}

interface SubcontractorDetailProps {
  subcontractor: any;
  onBack: () => void;
}

// Helper to generate monthly stats
const generateMonthlyStats = (role: string) => {
  const months = [
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
  ];
  return months.map((month) => {
    // If partner, numbers are sum of subs (simulated higher range)
    const base = role === "partner" ? 50 : 5;
    const range = role === "partner" ? 100 : 15;
    return {
      name: month,
      // Random value between base and base+range
      value: Math.floor(base + Math.random() * range),
    };
  });
};

export function SubcontractorDetail({
  subcontractor,
  onBack,
}: SubcontractorDetailProps) {
  // Generate consistent mock data
  const [workers, setWorkers] = useState<Worker[]>([]); // Initialized as empty, waiting for real data
  const workersLoadedRef = useRef(false);

  // Managers State
  const [managers, setManagers] = useState<Manager[]>([]);

  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [isAddManagerOpen, setIsAddManagerOpen] = useState(false);
  const [editingManagerId, setEditingManagerId] = useState<string | null>(null);
  // New Worker Form State
  const [newWorker, setNewWorker] = useState({
    name: "",
    role: "",
    status: "Active",
    a1Start: "",
    a1End: "",
    certStart: "",
    certEnd: "",
  });

  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);

  const handleAddNewWorker = () => {
    if (!newWorker.name || !newWorker.role) return;

    if (editingWorkerId) {
      // Update existing worker
      const updatedWorkers = workers.map((w) => {
        if (w.id === editingWorkerId) {
          return {
            ...w,
            name: newWorker.name,
            role: newWorker.role,
            status: newWorker.status as any,
            a1Start: newWorker.a1Start,
            a1End: newWorker.a1End,
            a1Files: a1Files.map((f) => f.name), // Mock
            certStart: newWorker.certStart,
            certEnd: newWorker.certEnd,
            certFiles: certFiles.map((f) => f.name), // Mock
            // Recalculate statuses based on dates? For now stick to manual/mock logic or basic check
            // Ideally we check dates against today to set Valid/Expired
          };
        }
        return w;
      });
      setWorkers(updatedWorkers);
      setTimeout(() => saveWorkersToStorage(updatedWorkers), 0);
    } else {
      // Create new worker
      const worker: Worker = {
        id: Math.random().toString(36).substr(2, 9),
        name: newWorker.name,
        role: newWorker.role,
        status: newWorker.status as any, // Default or from form
        a1Status: a1Na ? "Valid" : "Valid", // Simplification: Default to Valid for now
        a1Start: newWorker.a1Start,
        a1End: newWorker.a1End,
        a1Files: a1Files.map((f) => f.name),
        certStatus: certNa ? "None" : "Valid",
        certStart: newWorker.certStart,
        certEnd: newWorker.certEnd,
        certFiles: certFiles.map((f) => f.name),
        activeProjects: 0,
        completedProjects: 0,
        complaints: 0,
        successRate: 100,
        joinedDate: new Date().toLocaleDateString(),
        avatarSeed: newWorker.name,
        synced: false,
      };

      const updatedWorkers = [...workers, worker];
      setWorkers(updatedWorkers);

      // Save to storage & Sync
      setTimeout(() => saveWorkersToStorage(updatedWorkers), 0);
    }

    // Reset and Close
    setNewWorker({
      name: "",
      role: "",
      status: "Active",
      a1Start: "",
      a1End: "",
      certStart: "",
      certEnd: "",
    });
    setA1Na(false);
    setCertNa(false);
    setA1Files([]);
    setCertFiles([]);
    setIsAddWorkerOpen(false);
    setEditingWorkerId(null);
  };

  const handleEditWorker = (worker: Worker) => {
    setNewWorker({
      name: worker.name,
      role: worker.role,
      status: worker.status,
      a1Start: worker.a1Start || "",
      a1End: worker.a1End || "",
      certStart: worker.certStart || "",
      certEnd: worker.certEnd || "",
    });
    // Load files logic omitted for brevity (requires File object reconstruction or separate string list state)
    // For now we assume new upload required or just keep metadata if not changed (advanced logic needed for file persistence)
    // Let's at least set ID and open modal
    setEditingWorkerId(worker.id);
    setIsAddWorkerOpen(true);
  };

  const handleRemoveWorker = (workerId: string) => {
    const updatedWorkers = workers.filter((w) => w.id !== workerId);
    setWorkers(updatedWorkers);
    setTimeout(() => saveWorkersToStorage(updatedWorkers), 0);
  };

  const [newManager, setNewManager] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
  });

  const handleSaveManager = async () => {
    if (!newManager.name) return;

    let newManagersList: Manager[] = [];

    if (editingManagerId) {
      // Build list first, then update state
      newManagersList = managers.map((m) =>
        m.id === editingManagerId ? { ...m, ...newManager } : m,
      );
      setManagers(newManagersList);
    } else {
      // Build list first, then update state
      newManagersList = [
        ...managers,
        {
          id: Math.random().toString(36).substr(2, 9),
          ...newManager,
        },
      ];
      setManagers(newManagersList);
    }

    // Save to storage immediately with the built list
    await saveManagersToStorage(newManagersList);

    setNewManager({ name: "", role: "", email: "", phone: "" });
    setEditingManagerId(null);
    setIsAddManagerOpen(false);
  };

  const handleEditManager = (manager: Manager) => {
    setNewManager({
      name: manager.name,
      role: manager.role,
      email: manager.email,
      phone: manager.phone,
    });
    setEditingManagerId(manager.id);
    setIsAddManagerOpen(true);
  };

  const handleDeleteManager = (id: string) => {
    setManagers((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      setTimeout(() => saveManagersToStorage(updated), 0);
      return updated;
    });
  };

  const saveManagersToStorage = async (managersToSave: Manager[]) => {
    const supabase = createClient();

    for (const manager of managersToSave) {
      try {
        const email =
          manager.email && manager.email.trim() !== ""
            ? manager.email
            : `manager.${manager.name.replace(/\s+/g, ".").toLowerCase()}@${subcontractor.name.replace(/\s+/g, ".").toLowerCase()}.local`;

        const { error } = await supabase.from("contacts").upsert(
          {
            name: manager.name,
            role: "manager",
            email: email,
            company_name: subcontractor.name,
            status: "Active",
          },
          { onConflict: "email", ignoreDuplicates: false },
        );

        if (error) {
          console.error(
            "Supabase sync error for manager:",
            manager.name,
            error,
          );
        } else {
          console.log("Supabase sync success for manager:", manager.name);
        }
      } catch (err) {
        console.error("Unexpected error syncing manager:", err);
      }
    }
  };
  // ... rest of imports

  const [a1Na, setA1Na] = useState(false);
  const [certNa, setCertNa] = useState(false);
  const [a1Files, setA1Files] = useState<File[]>([]);
  const [certFiles, setCertFiles] = useState<File[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [docCurrentPage, setDocCurrentPage] = useState(1);
  const [docItemsPerPage, setDocItemsPerPage] = useState(10);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "a1" | "cert",
  ) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (type === "a1") {
        setA1Files((prev) => [...prev, ...newFiles].slice(0, 2));
      } else {
        setCertFiles((prev) => [...prev, ...newFiles].slice(0, 2));
      }
    }
  };

  const removeFile = (index: number, type: "a1" | "cert") => {
    if (type === "a1") {
      setA1Files((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCertFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Documents State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const isInitializedRef = useRef(false);

  // Load data from Supabase on mount
  useEffect(() => {
    if (isInitializedRef.current) return;

    const loadDataFromSupabase = async () => {
      const supabase = createClient();

      // Load managers from personnel table
      const { data: managersData, error: managersError } = await supabase
        .from("contacts")
        .select("*")
        .eq("company_name", subcontractor.name)
        .eq("role", "manager");

      if (!managersError && managersData && managersData.length > 0) {
        const loadedManagers: Manager[] = managersData.map((m: any) => ({
          id: m.id,
          name: m.name,
          role: "Manager",
          email: m.email || "",
          phone: m.phone || "",
        }));
        setManagers(loadedManagers);
        console.log(
          "[SubcontractorDetail] Loaded",
          loadedManagers.length,
          "managers from Supabase",
        );
      }

      // Load workers from personnel table
      const { data: workersData, error: workersError } = await supabase
        .from("contacts")
        .select("*")
        .eq("company_name", subcontractor.name)
        .eq("role", "worker");

      if (!workersError && workersData && workersData.length > 0) {
        const loadedWorkers: Worker[] = workersData.map((w: any) => ({
          id: w.id,
          name: w.name,
          role: "Worker",
          status: w.status || "Active",
          a1Status: "Pending" as const,
          a1Start: "",
          a1End: "",
          a1Files: [],
          certStatus: "None" as const,
          certStart: "",
          certEnd: "",
          certFiles: [],
          activeProjects: 0,
          completedProjects: 0,
          complaints: 0,
          successRate: 100,
          joinedDate: w.created_at || new Date().toISOString(),
          avatarSeed: w.full_name,
          synced: true,
          supabaseId: w.id,
        }));
        setWorkers(loadedWorkers);
        workersLoadedRef.current = true;
        console.log(
          "[SubcontractorDetail] Loaded",
          loadedWorkers.length,
          "workers from Supabase",
        );
      }

      // Load documents from documents table
      const { data: docsData, error: docsError } = await supabase
        .from("documents")
        .select("*")
        .eq("company_name", subcontractor.name);

      if (!docsError && docsData && docsData.length > 0) {
        const loadedDocs: DocumentItem[] = docsData.map((d: any) => ({
          name: d.name,
          startDate: d.start_date,
          endDate: d.end_date,
        }));
        setDocuments(loadedDocs);
        console.log(
          "[SubcontractorDetail] Loaded",
          loadedDocs.length,
          "documents from Supabase",
        );
      } else if (
        subcontractor.documents &&
        subcontractor.documents.length > 0
      ) {
        setDocuments(subcontractor.documents);
      }

      isInitializedRef.current = true;
      workersLoadedRef.current = true;
    };

    loadDataFromSupabase();
  }, [subcontractor.name, subcontractor.documents]);

  const saveWorkersToStorage = async (workersToSave: Worker[]) => {
    const supabase = createClient();

    for (const w of workersToSave) {
      try {
        const email = `${w.name.replace(/\s+/g, ".").toLowerCase()}@${subcontractor.name.replace(/\s+/g, ".").toLowerCase()}.worker`;

        const { error } = await supabase.from("contacts").upsert(
          {
            name: w.name,
            email: email,
            role: "worker",
            company_name: subcontractor.name,
            status: w.status || "Active",
          },
          { onConflict: "email", ignoreDuplicates: false },
        );

        if (error) {
          console.error("Worker sync error:", w.name, error);
        } else {
          console.log("Worker synced:", w.name);
        }
      } catch (e) {
        console.warn("Failed to sync worker:", w.name, e);
      }
    }
  };

  // Helper function to save documents to Supabase
  const saveDocumentsToStorage = async (docsToSave: DocumentItem[]) => {
    const supabase = createClient();

    for (const doc of docsToSave) {
      try {
        let filePath: string | null = null;

        // Upload file to Supabase Storage if present
        if (doc.file) {
          const fileExt = doc.file.name.split(".").pop();
          const fileName = `${subcontractor.name.replace(/\s+/g, "_")}/${Date.now()}_${doc.name.replace(/\s+/g, "_")}.${fileExt}`;

          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("documents").upload(fileName, doc.file);

          if (uploadError) {
            console.error("File upload error:", uploadError);
          } else {
            filePath = uploadData.path;
            console.log("File uploaded:", filePath);
          }
        }

        // Save metadata to documents table
        const { error } = await supabase.from("documents").upsert(
          {
            company_name: subcontractor.name,
            name: doc.name,
            file_path: filePath,
            start_date: doc.startDate || null,
            end_date: doc.endDate || null,
          },
          { onConflict: "id" },
        );

        if (error) {
          console.error("Document metadata save error:", doc.name, error);
        } else {
          console.log("Document saved:", doc.name);
        }
      } catch (e) {
        console.error("Error saving document:", doc.name, e);
      }
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        name: file.name,
      }));
      const newDocs = [...documents, ...newFiles];
      setDocuments(newDocs);
      // Save immediately
      setTimeout(() => saveDocumentsToStorage(newDocs), 0);
    }
  };

  const removeDocument = (index: number) => {
    const newDocs = documents.filter((_, i) => i !== index);
    setDocuments(newDocs);
    // Save immediately
    setTimeout(() => saveDocumentsToStorage(newDocs), 0);
  };

  const handleDocumentUpdate = (
    index: number,
    field: keyof DocumentItem,
    value: any,
  ) => {
    const newDocs = documents.map((doc, i) =>
      i === index ? { ...doc, [field]: value } : doc,
    );
    setDocuments(newDocs);
    // Save immediately
    setTimeout(() => saveDocumentsToStorage(newDocs), 0);
  };

  const getDocumentStatus = (endDate?: string) => {
    if (!endDate) return "None";
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (end < today) return "Expired";

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 15) return "Expiring Soon";
    return "Valid";
  };

  // Auto-calculate success rates on load or data change
  // Formula: ((Completed - Complaints) / Completed) * 100
  // Note: If Completed = 0, we default to 100% (innocent until proven guilty) or 0% depending on preference.
  // Using 100% as a base for new workers.
  useEffect(() => {
    setWorkers((prevWorkers) => {
      // Check if any worker needs an update to avoid infinite loop if values are stable
      const needsUpdate = prevWorkers.some((w) => {
        const calculated =
          w.completedProjects === 0
            ? 100
            : Math.round(
                ((w.completedProjects - w.complaints) / w.completedProjects) *
                  100,
              );
        // Ensure within bounds 0-100 just in case complaints > completed (which shouldn't happen logically but mathematically can)
        const clamped = Math.max(0, Math.min(100, calculated));
        return w.successRate !== clamped;
      });

      if (!needsUpdate) return prevWorkers;

      return prevWorkers.map((w) => {
        const calculated =
          w.completedProjects === 0
            ? 100
            : Math.round(
                ((w.completedProjects - w.complaints) / w.completedProjects) *
                  100,
              );
        return { ...w, successRate: Math.max(0, Math.min(100, calculated)) };
      });
    });
  }, []); // Run once on mount. Real implementations should fetch from API.

  const handleStatusUpdate = async (workerId: string, newStatus: any) => {
    let updatedWorker: Worker | undefined;
    const updatedWorkers = workers.map((w) => {
      if (w.id === workerId) {
        updatedWorker = { ...w, status: newStatus };
        return updatedWorker;
      }
      return w;
    });

    setWorkers(updatedWorkers);

    // Save to LocalStorage only (profiles table doesn't have status column)
    setTimeout(() => saveWorkersToStorage(updatedWorkers), 0);
  };

  // Stats
  const displayTotalWorkers = subcontractor.regWorkers || 0;
  const displayActiveProjects = subcontractor.activeProjects || 0;
  const displayCompletedProjects = subcontractor.completedProjects || 0;
  const displayInWarranty = subcontractor.inWarranty || 0;
  const displayExpiredWarranty = subcontractor.expiredWarranty || 0;
  const displayComplaints = subcontractor.complaints || 0;
  const displayResolvedComplaints = subcontractor.resolvedComplaints || 0;
  const displayTransferedComplaints = subcontractor.transferedComplaints || 0;
  const displaySuccessRate = subcontractor.successRate || 0;

  return (
    <div className="space-y-6">
      {/* Header Banner - redesigned to match image structure slightly better */}
      <div className="bg-white dark:bg-gray-950 rounded-xl p-6 border shadow-sm relative overflow-hidden">
        {/* Background decorative element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-white shadow-md bg-primary/10">
              <AvatarFallback className="text-2xl font-bold bg-primary/20 text-primary-foreground">
                {subcontractor.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                  {subcontractor.name}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="opacity-70">
                    #
                    {subcontractor.id
                      ? subcontractor.id.substring(0, 8)
                      : "ID-12345"}
                  </span>
                  <span className="mx-1">•</span>
                  <span>Installation & Montage</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>Speissstraße 186, München</span>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{subcontractor.phone || "+49 771 9085523"}</span>
                </div>
                {subcontractor.contractor && (
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800">
                    <UserCog className="h-3 w-3" />
                    <span className="text-xs">
                      Contractor: {subcontractor.contractor}
                    </span>
                  </div>
                )}
                {subcontractor.mediator && (
                  <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-800">
                    <Briefcase className="h-3 w-3" />
                    <span className="text-xs">
                      Mediator: {subcontractor.mediator}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onBack} className="bg-white">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Manage Subcontractor <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="workers" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-[840px] h-12 gap-2">
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="management">Management Personnel</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Jobs Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex items-end justify-between gap-2 pt-10 px-4">
                {generateMonthlyStats(subcontractor.role).map((item, i) => {
                  const maxVal = subcontractor.role === "partner" ? 150 : 25; // Scale approximation
                  const heightPercentage = Math.min(
                    100,
                    Math.max(5, (item.value / maxVal) * 100),
                  );
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-2 flex-1 group"
                    >
                      <div className="relative w-full bg-gray-100 dark:bg-gray-800 rounded-t-sm h-full flex items-end overflow-hidden">
                        <div
                          className="w-full bg-primary/80 group-hover:bg-primary transition-all duration-500 ease-in-out relative"
                          style={{ height: `${heightPercentage}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded transition-opacity whitespace-nowrap z-10">
                            {item.value} Jobs
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {item.name}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-sm text-muted-foreground text-center">
                {subcontractor.role === "partner"
                  ? "Aggregation of all jobs completed by linked subcontractors."
                  : "Total jobs completed per month."}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workers Tab */}
        <TabsContent value="workers" className="space-y-6 mt-6">
          {/* Stats Cards - Colorful Layout */}
          {/* Stats Cards - Updated Layout */}
          {/* Stats Cards - Updated Layout (2 rows x 4 columns) */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Active Projects */}
            <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-emerald-700/80 dark:text-emerald-400 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {displayActiveProjects}
                  </div>
                  <div className="h-7 w-7 bg-emerald-100 rounded flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Completed Projects */}
            <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-indigo-700/80 dark:text-indigo-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {displayCompletedProjects}
                  </div>
                  <div className="h-7 w-7 bg-indigo-100 rounded flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. In Warranty */}
            <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-blue-700/80 dark:text-blue-400 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> In Warranty
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {displayInWarranty}
                  </div>
                  <div className="h-7 w-7 bg-blue-100 rounded flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. Expired Warranty */}
            <Card className="bg-gray-50/50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-gray-700/80 dark:text-gray-400 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" /> Expired
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {displayExpiredWarranty}
                  </div>
                  <div className="h-7 w-7 bg-gray-200 rounded flex items-center justify-center">
                    <ShieldAlert className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 5. Complaints (Total) */}
            <Card className="bg-red-50/50 dark:bg-red-950/20 border-red-100 dark:border-red-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-red-700/80 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Complaints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {displayComplaints}
                  </div>
                  <div className="h-7 w-7 bg-red-100 rounded flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 6. Resolved Complaints */}
            <Card className="bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-green-700/80 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {displayResolvedComplaints}
                  </div>
                  <div className="h-7 w-7 bg-green-100 rounded flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 7. Transfered Complaints */}
            <Card className="bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-orange-700/80 dark:text-orange-400 flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" /> Transfered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {displayTransferedComplaints}
                  </div>
                  <div className="h-7 w-7 bg-orange-100 rounded flex items-center justify-center">
                    <ArrowRightLeft className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 8. Success Rate */}
            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-amber-700/80 dark:text-amber-400 flex items-center gap-2">
                  <RotateCw className="h-4 w-4" /> Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {displaySuccessRate}%
                  </div>
                  <div className="h-7 w-7 bg-amber-100 rounded flex items-center justify-center">
                    <RotateCw className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                Registered Workers
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-700"
                >
                  {displayTotalWorkers}
                </Badge>
              </h3>

              <div className="flex items-center gap-2">
                <div className="flex w-[250px] items-center gap-2 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search workers..." className="h-9 pl-9" />
                </div>

                <Dialog
                  open={isAddWorkerOpen}
                  onOpenChange={setIsAddWorkerOpen}
                >
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground h-9">
                      <Plus className="mr-2 h-4 w-4" /> Add Worker
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingWorkerId ? "Edit Worker" : "Add New Worker"}
                      </DialogTitle>
                      <DialogDescription>
                        {editingWorkerId
                          ? "Update worker details"
                          : `Register a new worker under ${subcontractor.name}.`}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="w-name">Full Name</Label>
                        <Input
                          id="w-name"
                          placeholder="Worker Name"
                          value={newWorker.name}
                          onChange={(e) =>
                            setNewWorker((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="w-role">Role / Trade</Label>
                        <Select
                          value={newWorker.role}
                          onValueChange={(val) =>
                            setNewWorker((prev) => ({ ...prev, role: val }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select trade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Electrician">
                              Electrician
                            </SelectItem>
                            <SelectItem value="S/H/K">S/H/K</SelectItem>
                            <SelectItem value="Cooling Technician">
                              Cooling Technician
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* A1 Information */}
                      <div className="space-y-3 border rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-sm">
                            A1 Certificate
                          </Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="a1-na"
                              checked={a1Na}
                              onCheckedChange={(checked) =>
                                setA1Na(checked as boolean)
                              }
                            />
                            <Label
                              htmlFor="a1-na"
                              className="text-xs font-normal"
                            >
                              Not Applicable
                            </Label>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-1.5">
                            <Label htmlFor="a1-start" className="text-xs">
                              Start Date
                            </Label>
                            <Input
                              id="a1-start"
                              type="date"
                              disabled={a1Na}
                              className="h-8 text-xs"
                              value={newWorker.a1Start}
                              onChange={(e) =>
                                setNewWorker((prev) => ({
                                  ...prev,
                                  a1Start: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor="a1-end" className="text-xs">
                              End Date
                            </Label>
                            <Input
                              id="a1-end"
                              type="date"
                              disabled={a1Na}
                              className="h-8 text-xs"
                              value={newWorker.a1End}
                              onChange={(e) =>
                                setNewWorker((prev) => ({
                                  ...prev,
                                  a1End: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        {!a1Na && (
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">
                                Attachments (Max 2)
                              </Label>
                              <span className="text-[10px] text-muted-foreground">
                                {a1Files.length}/2
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                type="file"
                                className="text-xs h-8 cursor-pointer"
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple
                                disabled={a1Files.length >= 2}
                                onChange={(e) => handleFileChange(e, "a1")}
                              />
                            </div>
                            {a1Files.length > 0 && (
                              <div className="flex flex-col gap-1 mt-1">
                                {a1Files.map((file, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border px-2 py-1 rounded text-xs"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <FileText className="h-3 w-3 text-primary-foreground" />
                                      <span className="truncate max-w-[150px]">
                                        {file.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          const url = URL.createObjectURL(file);
                                          const a = document.createElement("a");
                                          a.href = url;
                                          a.download = file.name;
                                          a.click();
                                          URL.revokeObjectURL(url);
                                        }}
                                        className="text-gray-500 hover:text-primary-foreground"
                                      >
                                        <Download className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() => removeFile(index, "a1")}
                                        className="text-gray-500 hover:text-red-500"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Certification Information */}
                      <div className="space-y-3 border rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-sm">
                            Trade Certification
                          </Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="cert-na"
                              checked={certNa}
                              onCheckedChange={(checked) =>
                                setCertNa(checked as boolean)
                              }
                            />
                            <Label
                              htmlFor="cert-na"
                              className="text-xs font-normal"
                            >
                              Not Applicable
                            </Label>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-1.5">
                            <Label htmlFor="cert-start" className="text-xs">
                              Start Date
                            </Label>
                            <Input
                              id="cert-start"
                              type="date"
                              disabled={certNa}
                              className="h-8 text-xs"
                              value={newWorker.certStart}
                              onChange={(e) =>
                                setNewWorker((prev) => ({
                                  ...prev,
                                  certStart: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor="cert-end" className="text-xs">
                              End Date
                            </Label>
                            <Input
                              id="cert-end"
                              type="date"
                              disabled={certNa}
                              className="h-8 text-xs"
                              value={newWorker.certEnd}
                              onChange={(e) =>
                                setNewWorker((prev) => ({
                                  ...prev,
                                  certEnd: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        {!certNa && (
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">
                                Attachments (Max 2)
                              </Label>
                              <span className="text-[10px] text-muted-foreground">
                                {certFiles.length}/2
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                type="file"
                                className="text-xs h-8 cursor-pointer"
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple
                                disabled={certFiles.length >= 2}
                                onChange={(e) => handleFileChange(e, "cert")}
                              />
                            </div>
                            {certFiles.length > 0 && (
                              <div className="flex flex-col gap-1 mt-1">
                                {certFiles.map((file, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 border px-2 py-1 rounded text-xs"
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <FileText className="h-3 w-3 text-primary-foreground" />
                                      <span className="truncate max-w-[150px]">
                                        {file.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => {
                                          const url = URL.createObjectURL(file);
                                          const a = document.createElement("a");
                                          a.href = url;
                                          a.download = file.name;
                                          a.click();
                                          URL.revokeObjectURL(url);
                                        }}
                                        className="text-gray-500 hover:text-primary-foreground"
                                      >
                                        <Download className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          removeFile(index, "cert")
                                        }
                                        className="text-gray-500 hover:text-red-500"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="w-status">Initial Status</Label>
                        <Select
                          value={newWorker.status}
                          onValueChange={(val) =>
                            setNewWorker((prev) => ({ ...prev, status: val }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="On Leave">On Leave</SelectItem>
                            <SelectItem value="Blocked">Blocked</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddWorkerOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddNewWorker}>
                        {editingWorkerId ? "Save Changes" : "Add Worker"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="rounded-xl border bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
                  <TableRow>
                    <TableHead className="font-semibold w-[220px]">
                      Name
                    </TableHead>
                    <TableHead className="font-semibold w-[120px]">
                      Role / Trade
                    </TableHead>
                    <TableHead className="font-semibold w-[100px]">
                      A1
                    </TableHead>
                    <TableHead className="font-semibold w-[150px]">
                      Certification
                    </TableHead>
                    <TableHead className="font-semibold w-[120px]">
                      Completed
                    </TableHead>
                    <TableHead className="font-semibold w-[100px]">
                      Complaints
                    </TableHead>
                    <TableHead className="font-semibold w-[80px]">
                      Success
                    </TableHead>
                    <TableHead className="font-semibold w-[140px]">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-right w-[60px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workers.map((worker) => (
                    <TableRow
                      key={worker.id}
                      className="group hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border bg-gray-100">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.avatarSeed}`}
                            />
                            <AvatarFallback>
                              {worker.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {worker.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {worker.subRole || worker.role}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm w-[120px]">
                        {worker.role}
                      </TableCell>
                      <TableCell className="w-[100px]">
                        <span
                          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium w-fit ${
                            worker.a1Files && worker.a1Files.length > 0
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {worker.a1Files && worker.a1Files.length > 0
                            ? "Uploaded"
                            : "No File"}
                        </span>
                      </TableCell>
                      <TableCell className="w-[150px]">
                        <div className="flex items-center gap-2">
                          {/* Certificate Status Badge */}
                          <Badge
                            variant="outline"
                            className={`
                                cursor-pointer hover:opacity-80 transition-opacity text-xs font-normal gap-1 pl-1
                                ${
                                  // First check if there are files - if not, always show gray
                                  !worker.certFiles ||
                                  worker.certFiles.length === 0
                                    ? "bg-gray-100 text-gray-500 border-gray-200"
                                    : worker.certStatus === "Valid"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : worker.certStatus === "Expiring Soon"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : worker.certStatus === "Expired"
                                          ? "bg-red-50 text-red-700 border-red-200"
                                          : "bg-gray-100 text-gray-500 border-gray-200"
                                }
                              `}
                            title={
                              worker.certFiles && worker.certFiles.length > 0
                                ? worker.certFiles.join(", ")
                                : "No certificate uploaded"
                            }
                          >
                            {/* Only show icons when there are files */}
                            {worker.certFiles &&
                              worker.certFiles.length > 0 &&
                              worker.certStatus === "Valid" && (
                                <CheckCircle2 className="h-3 w-3 fill-green-200 text-green-600" />
                              )}
                            {worker.certFiles &&
                              worker.certFiles.length > 0 &&
                              worker.certStatus === "Expiring Soon" && (
                                <AlertCircle className="h-3 w-3 fill-amber-200 text-amber-600" />
                              )}
                            {worker.certFiles &&
                              worker.certFiles.length > 0 &&
                              worker.certStatus === "Expired" && (
                                <AlertCircle className="h-3 w-3 fill-red-200 text-red-600" />
                              )}

                            {/* Show appropriate text based on file presence */}
                            {worker.certFiles && worker.certFiles.length > 0
                              ? worker.certStatus === "Valid"
                                ? "Active"
                                : worker.certStatus
                              : "No Certificate"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="w-[120px]">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          <span>{worker.completedProjects}</span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[100px]">
                        <div className="flex items-center gap-2 text-sm">
                          <UserCog className="h-4 w-4 text-muted-foreground" />
                          <span>{worker.complaints}</span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[80px]">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <span
                            className={`${worker.successRate >= 90 ? "text-green-600" : worker.successRate >= 70 ? "text-amber-600" : "text-red-600"}`}
                          >
                            {worker.successRate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="w-[140px]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Badge
                              variant="outline"
                              className={`
                                cursor-pointer hover:opacity-80 transition-opacity
                                ${
                                  worker.status === "Active"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : worker.status === "On Leave"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                }
                              `}
                            >
                              {worker.status}{" "}
                              <ChevronDown className="ml-1 h-3 w-3" />
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(worker.id, "Active")
                              }
                            >
                              Active
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(worker.id, "On Leave")
                              }
                            >
                              On Leave
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(worker.id, "Blocked")
                              }
                            >
                              Blocked
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-right w-[60px]">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEditWorker(worker)}
                            >
                              Edit Worker
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={() => handleRemoveWorker(worker.id)}
                            >
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Footer matching image style roughly */}
              {/* Footer with Uniform Pagination */}
              <div className="flex flex-col md:flex-row items-center justify-between p-4 border-t bg-gray-50/50 dark:bg-gray-900/50 gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  {workers.length > 0
                    ? (currentPage - 1) * itemsPerPage + 1
                    : 0}{" "}
                  to {Math.min(currentPage * itemsPerPage, workers.length)} of{" "}
                  {workers.length} entries
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <span className="sr-only">Prev</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from(
                    {
                      length: Math.min(
                        5,
                        Math.ceil(workers.length / itemsPerPage),
                      ),
                    },
                    (_, i) => {
                      const totalPages = Math.ceil(
                        workers.length / itemsPerPage,
                      );
                      let pageNum = i + 1;

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
                          Math.ceil(workers.length / itemsPerPage),
                          p + 1,
                        ),
                      )
                    }
                  >
                    Next Page <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Management Tab */}
        <TabsContent value="management" className="space-y-4 mt-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Management Contacts</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  // Debug: Check if env vars are loaded
                  console.log(
                    "Supabase URL:",
                    process.env.NEXT_PUBLIC_SUPABASE_URL,
                  );
                  console.log(
                    "Supabase Key exists:",
                    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                  );

                  const supabase = createClient();
                  const testId = self.crypto.randomUUID();
                  try {
                    // Check auth status first
                    const { data: authData } = await supabase.auth.getUser();
                    console.log(
                      "Auth Status:",
                      authData?.user
                        ? `Logged in as ${authData.user.email}`
                        : "Not authenticated",
                    );

                    const { data, error, status, statusText } = await supabase
                      .from("contacts")
                      .insert({
                        id: testId,
                        name: "Test Sync Probe",
                        email: `probe.${testId}@test.local`,
                        role: "manager",
                        company_name: "Diagnostic Probe",
                        status: "Active",
                      })
                      .select();

                    if (error) {
                      const errDetails = JSON.stringify(error, null, 2);
                      console.error("Probe Failed:", error);
                      console.error("Full Error Object:", errDetails);
                      console.error("HTTP Status:", status, statusText);

                      // RLS typically returns empty error or 403
                      if (
                        status === 403 ||
                        (error && Object.keys(error).length === 0)
                      ) {
                        alert(
                          `RLS BLOCKED: Row Level Security is preventing inserts.\n\nYou need to either:\n1. Disable RLS on 'contacts' table, OR\n2. Add a policy to allow inserts for your user role.\n\nHTTP Status: ${status}`,
                        );
                      } else {
                        alert(
                          `Probe Failed: ${error.message || errDetails}\nHTTP Status: ${status}`,
                        );
                      }
                    } else {
                      console.log("Probe Success:", data);
                      alert(
                        "Probe Success! Supabase connection is working for inserts.",
                      );
                      // Cleanup
                      await supabase.from("contacts").delete().eq("id", testId);
                    }
                  } catch (e: any) {
                    console.error("Probe Exception:", e);
                    alert(`Probe Exception: ${e.message}`);
                  }
                }}
              >
                <ShieldCheck className="mr-2 h-4 w-4" /> Test Sync
              </Button>
              <Dialog
                open={isAddManagerOpen}
                onOpenChange={setIsAddManagerOpen}
              >
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <UserCog className="mr-2 h-4 w-4" /> Add Manager
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingManagerId
                        ? "Edit Management Personnel"
                        : "Add Management Personnel"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingManagerId
                        ? "Edit the details of this contact person."
                        : "Add a new key contact person for this subcontractor."}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="m-name">Full Name</Label>
                      <Input
                        id="m-name"
                        placeholder="e.g. Klaus Webber"
                        value={newManager.name}
                        onChange={(e) =>
                          setNewManager({ ...newManager, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="m-role">Role / Position</Label>
                      <Input
                        id="m-role"
                        placeholder="e.g. CEO, Project Manager"
                        value={newManager.role}
                        onChange={(e) =>
                          setNewManager({ ...newManager, role: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="m-email">Email Address</Label>
                      <Input
                        id="m-email"
                        type="email"
                        placeholder="name@company.com"
                        value={newManager.email}
                        onChange={(e) =>
                          setNewManager({
                            ...newManager,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="m-phone">Phone Number</Label>
                      <Input
                        id="m-phone"
                        placeholder="+49..."
                        value={newManager.phone}
                        onChange={(e) =>
                          setNewManager({
                            ...newManager,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddManagerOpen(false);
                        setEditingManagerId(null);
                        setNewManager({
                          name: "",
                          role: "",
                          email: "",
                          phone: "",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveManager}>
                      {editingManagerId ? "Save Changes" : "Add Contact"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map((manager) => (
                    <TableRow key={manager.id}>
                      <TableCell className="font-medium">
                        {manager.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-primary/10 text-primary-foreground border-primary/20"
                        >
                          {manager.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {manager.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {manager.phone}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-primary-foreground"
                                  onClick={() => handleEditManager(manager)}
                                >
                                  <UserCog className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit Manager</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-500 hover:text-red-600"
                                  onClick={() =>
                                    handleDeleteManager(manager.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove Manager</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {managers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No management personnel listed.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold tracking-tight">
                Documents & Certificates
              </h3>
              <div className="flex items-center gap-2">
                <div className="flex w-[250px] items-center gap-2 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents..."
                    className="h-9 pl-9"
                  />
                </div>
                <Input
                  type="file"
                  id="doc-upload"
                  className="hidden"
                  multiple
                  onChange={handleDocumentUpload}
                />
                <Label
                  htmlFor="doc-upload"
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors h-9"
                >
                  <Upload className="h-4 w-4" /> Upload Document
                </Label>
              </div>
            </div>

            <div className="rounded-xl border bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/50 dark:bg-gray-900/50">
                  <TableRow>
                    <TableHead className="font-semibold w-[300px]">
                      Role / Trade
                    </TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[120px]">Completed</TableHead>
                    <TableHead className="w-[120px]">Complaints</TableHead>
                    <TableHead className="w-[50px]">Sync</TableHead>
                    <TableHead className="w-[100px] text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-10 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText className="h-8 w-8 opacity-20" />
                          <p>No documents uploaded yet.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc, index) => {
                      // Handle missing file object (from storage) gracefully
                      const name = doc.name || "Untitled Document";
                      const status = getDocumentStatus(doc.endDate);

                      // if (!file) return null; // Removed to allow viewing stored docs

                      return (
                        <TableRow
                          key={index}
                          className="group hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-primary/10 dark:bg-primary/5 text-primary-foreground dark:text-primary rounded-lg flex items-center justify-center shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col w-full max-w-[250px]">
                                <Input
                                  value={name}
                                  onChange={(e) =>
                                    handleDocumentUpdate(
                                      index,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  className="h-8 text-sm font-medium border-transparent hover:border-input focus:border-input px-2 -ml-2 bg-transparent truncate"
                                />
                                <span className="text-xs text-muted-foreground pl-0.5">
                                  {doc.file
                                    ? (doc.file.size / 1024).toFixed(1) + " KB"
                                    : "Stored"}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={doc.startDate || ""}
                              onChange={(e) =>
                                handleDocumentUpdate(
                                  index,
                                  "startDate",
                                  e.target.value,
                                )
                              }
                              className="h-8 w-[130px] text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={doc.endDate || ""}
                              onChange={(e) =>
                                handleDocumentUpdate(
                                  index,
                                  "endDate",
                                  e.target.value,
                                )
                              }
                              className="h-8 w-[130px] text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            {status === "Valid" && (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200 text-xs font-normal gap-1 pl-1"
                              >
                                <CheckCircle2 className="h-3 w-3 fill-green-200 text-green-600" />{" "}
                                Valid
                              </Badge>
                            )}
                            {status === "Expiring Soon" && (
                              <Badge
                                variant="outline"
                                className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-normal gap-1 pl-1"
                              >
                                <Clock className="h-3 w-3 fill-amber-200 text-amber-600" />{" "}
                                Expiring Soon
                              </Badge>
                            )}
                            {status === "Expired" && (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-200 text-xs font-normal gap-1 pl-1"
                              >
                                <AlertCircle className="h-3 w-3 fill-red-200 text-red-600" />{" "}
                                Expired
                              </Badge>
                            )}
                            {status === "None" && (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-primary-foreground"
                                disabled={!doc.file}
                                onClick={() => {
                                  if (doc.file) {
                                    const url = URL.createObjectURL(doc.file);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = name;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }
                                }}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-red-600"
                                onClick={() => removeDocument(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              {/* Pagination mimicking uniform style */}
              {documents.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between p-4 border-t bg-gray-50/50 dark:bg-gray-900/50 gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {documents.length > 0
                      ? (docCurrentPage - 1) * docItemsPerPage + 1
                      : 0}{" "}
                    to{" "}
                    {Math.min(
                      docCurrentPage * docItemsPerPage,
                      documents.length,
                    )}{" "}
                    of {documents.length} entries
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() =>
                        setDocCurrentPage((p) => Math.max(1, p - 1))
                      }
                      disabled={docCurrentPage === 1}
                    >
                      <span className="sr-only">Prev</span>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-8 w-8 p-0 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      1
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 text-yellow-600 gap-1"
                      disabled
                    >
                      Next Page <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
