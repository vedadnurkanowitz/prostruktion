import { useState } from "react";
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
} from "lucide-react";

interface DocumentItem {
  file: File;
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
  coolingStatus: "Valid" | "Expiring Soon" | "Expired" | "None";
  coolingStart?: string;
  coolingEnd?: string;
  coolingFiles?: string[];
  complaints: number;
  successRate: number;
  joinedDate: string;
  avatarSeed: string;
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

export function SubcontractorDetail({
  subcontractor,
  onBack,
}: SubcontractorDetailProps) {
  // Generate consistent mock data
  const [workers, setWorkers] = useState<Worker[]>([
    {
      id: "1",
      name: "Mark Weber",
      role: "Electrician",
      subRole: "Electrician",
      status: "Active",
      a1Status: "Valid",
      coolingStatus: "Valid",
      complaints: 0,
      successRate: 100,
      joinedDate: "2024-01-15",
      avatarSeed: "Mark",
    },
    {
      id: "2",
      name: "Ralf König",
      role: "HVAC Installer",
      subRole: "HVAC Installer",
      status: "Active",
      a1Status: "Valid",
      coolingStatus: "Expiring Soon",
      complaints: 1,
      successRate: 98,
      joinedDate: "2024-02-01",
      avatarSeed: "Ralf",
    },
    {
      id: "3",
      name: "Simone Fischer",
      role: "Welder",
      subRole: "Fisslene Fischer",
      status: "Active",
      a1Status: "Valid",
      coolingStatus: "Valid",
      complaints: 0,
      successRate: 100,
      joinedDate: "2024-03-10",
      avatarSeed: "Simone",
    },
    {
      id: "4",
      name: "Stefan Bauer",
      role: "Plumber",
      subRole: "Plumber",
      status: "Active",
      a1Status: "Expired",
      coolingStatus: "Valid",
      complaints: 3,
      successRate: 91,
      joinedDate: "2023-11-05",
      avatarSeed: "Stefan",
    },
    {
      id: "5",
      name: "Patrick Wagner",
      role: "Plumber",
      subRole: "Plumber",
      status: "Active",
      a1Status: "Expired",
      coolingStatus: "Valid",
      complaints: 1,
      successRate: 96,
      joinedDate: "2024-01-20",
      avatarSeed: "Patrick",
    },
    {
      id: "6",
      name: "Tim Roth",
      role: "Plumber",
      subRole: "Patake Wagmer",
      status: "Active",
      a1Status: "Expired",
      coolingStatus: "Valid",
      complaints: 1,
      successRate: 95,
      joinedDate: "2024-02-15",
      avatarSeed: "Tim",
    },
    {
      id: "7",
      name: "Marco Schmidt",
      role: "Staff",
      subRole: "Marco schmidt",
      status: "Active",
      a1Status: "Expired",
      coolingStatus: "None",
      complaints: 0,
      successRate: 97,
      joinedDate: "2023-10-01",
      avatarSeed: "Marco",
    },
  ]);

  // Managers State
  const [managers, setManagers] = useState<Manager[]>([
    {
      id: "1",
      name: "Klaus Webber",
      role: "CEO",
      email: "klaus.webber@construction-co.de",
      phone: "+49 151 1234 5678",
    },
    {
      id: "2",
      name: "Maria Stiegler",
      role: "Project Manager",
      email: "m.stiegler@construction-co.de",
      phone: "+49 151 8765 4321",
    },
  ]);

  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [isAddManagerOpen, setIsAddManagerOpen] = useState(false);
  const [a1Na, setA1Na] = useState(false);
  const [coolingNa, setCoolingNa] = useState(false);
  const [a1Files, setA1Files] = useState<File[]>([]);
  const [coolingFiles, setCoolingFiles] = useState<File[]>([]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "a1" | "cooling",
  ) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (type === "a1") {
        setA1Files((prev) => [...prev, ...newFiles].slice(0, 2));
      } else {
        setCoolingFiles((prev) => [...prev, ...newFiles].slice(0, 2));
      }
    }
  };

  const removeFile = (index: number, type: "a1" | "cooling") => {
    if (type === "a1") {
      setA1Files((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCoolingFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Documents State
  // Documents State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        name: file.name,
      }));
      setDocuments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDocumentUpdate = (
    index: number,
    field: keyof DocumentItem,
    value: any,
  ) => {
    setDocuments((prev) =>
      prev.map((doc, i) => (i === index ? { ...doc, [field]: value } : doc)),
    );
  };

  const getDocumentStatus = (endDate?: string) => {
    if (!endDate) return "None";
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (end < today) return "Expired";

    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) return "Expiring Soon";
    return "Valid";
  };

  // Stats
  const totalWorkers = 28;
  const displayTotalWorkers = 28;
  const displayActiveProjects = 12;
  const displayCompletedProjects = 41;
  const displaySuccessRate = 94;
  const displayComplaints = 6;

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
                    #{Math.floor(Math.random() * 10000000)}
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
        <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="management">Management Personnel</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Workers Tab */}
        <TabsContent value="workers" className="space-y-6 mt-6">
          {/* Stats Cards - Colorful Layout */}
          <div className="grid gap-6 md:grid-cols-5">
            <Card className="bg-primary/5 dark:bg-primary/5 border-primary/20 dark:border-primary/20 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5" /> Registered Workers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-foreground">
                    {displayTotalWorkers}
                  </div>
                  <div className="h-8 w-8 bg-primary/20 rounded flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-emerald-700/80 dark:text-emerald-400 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" /> Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                    {displayActiveProjects}
                  </div>
                  <div className="h-8 w-8 bg-emerald-100 rounded flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-indigo-700/80 dark:text-indigo-400 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                    {displayCompletedProjects}
                  </div>
                  <div className="h-8 w-8 bg-indigo-100 rounded flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-pink-50/50 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-pink-700/80 dark:text-pink-400 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" /> Complaints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                    {displayComplaints}
                  </div>
                  <div className="h-8 w-8 bg-pink-100 rounded flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-pink-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-amber-700/80 dark:text-amber-400 flex items-center gap-2">
                  <RotateCw className="h-5 w-5" /> Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                    {displaySuccessRate}%
                  </div>
                  <div className="h-8 w-8 bg-amber-100 rounded flex items-center justify-center">
                    <RotateCw className="h-5 w-5 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold tracking-tight">
                Registered Workers
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
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Worker</DialogTitle>
                      <DialogDescription>
                        Register a new worker under {subcontractor.name}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="w-name">Full Name</Label>
                        <Input id="w-name" placeholder="Worker Name" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="w-role">Role / Trade</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="electrician">
                              Electrician
                            </SelectItem>
                            <SelectItem value="cooling-technician">
                              Cooling Technician
                            </SelectItem>
                            <SelectItem value="shk">SHK</SelectItem>
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

                      {/* Cooling Information */}
                      <div className="space-y-3 border rounded-md p-3">
                        <div className="flex items-center justify-between">
                          <Label className="font-semibold text-sm">
                            Cooling Certificate
                          </Label>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="cooling-na"
                              checked={coolingNa}
                              onCheckedChange={(checked) =>
                                setCoolingNa(checked as boolean)
                              }
                            />
                            <Label
                              htmlFor="cooling-na"
                              className="text-xs font-normal"
                            >
                              Not Applicable
                            </Label>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-1.5">
                            <Label htmlFor="cooling-start" className="text-xs">
                              Start Date
                            </Label>
                            <Input
                              id="cooling-start"
                              type="date"
                              disabled={coolingNa}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor="cooling-end" className="text-xs">
                              End Date
                            </Label>
                            <Input
                              id="cooling-end"
                              type="date"
                              disabled={coolingNa}
                              className="h-8 text-xs"
                            />
                          </div>
                        </div>

                        {!coolingNa && (
                          <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs">
                                Attachments (Max 2)
                              </Label>
                              <span className="text-[10px] text-muted-foreground">
                                {coolingFiles.length}/2
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                type="file"
                                className="text-xs h-8 cursor-pointer"
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple
                                disabled={coolingFiles.length >= 2}
                                onChange={(e) => handleFileChange(e, "cooling")}
                              />
                            </div>
                            {coolingFiles.length > 0 && (
                              <div className="flex flex-col gap-1 mt-1">
                                {coolingFiles.map((file, index) => (
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
                                          removeFile(index, "cooling")
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
                        <Select defaultValue="active">
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="on-leave">On Leave</SelectItem>
                            <SelectItem value="blocked">Blocked</SelectItem>
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
                      <Button onClick={() => setIsAddWorkerOpen(false)}>
                        Add Worker
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
                    <TableHead className="font-semibold w-[250px]">
                      Name
                    </TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold w-[200px]">
                      A1
                    </TableHead>
                    <TableHead className="font-semibold w-[200px]">
                      Cooling
                    </TableHead>
                    <TableHead className="font-semibold">Complaints</TableHead>
                    <TableHead className="font-semibold">
                      Success Rate
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
                      <TableCell className="text-sm">{worker.role}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="flex items-center h-6 rounded overflow-hidden border border-gray-200">
                            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 h-full flex items-center justify-center">
                              A1
                            </span>
                            <span className="bg-primary/80 text-primary-foreground px-1 h-full flex items-center justify-center border-l border-primary">
                              <RotateCw className="h-3 w-3" />
                            </span>
                            <span
                              className={`h-full flex items-center gap-1 px-2 text-xs font-medium ${
                                worker.a1Status === "Valid"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {worker.a1Status}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {worker.coolingStatus === "Valid" && (
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700 border-green-200 text-xs font-normal gap-1 pl-1"
                            >
                              <CheckCircle2 className="h-3 w-3 fill-green-200 text-green-600" />{" "}
                              Valid
                            </Badge>
                          )}
                          {worker.coolingStatus === "Expiring Soon" && (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-normal gap-1 pl-1"
                            >
                              <CheckCircle2 className="h-3 w-3 fill-amber-200 text-amber-600" />{" "}
                              Expiring Soon
                            </Badge>
                          )}
                          {worker.coolingStatus === "None" && (
                            <div className="h-2 w-8 bg-gray-100 rounded-full"></div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <UserCog className="h-4 w-4 text-muted-foreground" />
                          <span>{worker.complaints}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 w-full pl-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 fill-green-100" />
                          {worker.successRate}%
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-4">
                      <Button
                        variant="secondary"
                        className="w-full max-w-[200px] text-blue-600 bg-blue-50 hover:bg-blue-100"
                      >
                        View All Workers
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Footer matching image style roughly */}
              <div className="flex items-center justify-between p-4 border-t bg-gray-50/50 dark:bg-gray-900/50 text-xs text-muted-foreground">
                <span>
                  Showing 1 to {Math.min(6, workers.length)} of{" "}
                  {displayTotalWorkers} entries
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <span className="sr-only">Prev</span>&lt;
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-6 w-6 p-0 bg-primary/20 text-primary-foreground"
                  >
                    1
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    2
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    3
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <span className="sr-only">Next</span>&gt;
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
            <Dialog open={isAddManagerOpen} onOpenChange={setIsAddManagerOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <UserCog className="mr-2 h-4 w-4" /> Add Manager
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Management Personnel</DialogTitle>
                  <DialogDescription>
                    Add a key contact person for this subcontractor.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="m-name">Full Name</Label>
                    <Input id="m-name" placeholder="Unknown" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="m-role">Role / Position</Label>
                    <Input
                      id="m-role"
                      placeholder="e.g. CEO, Project Manager"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="m-email">Email Address</Label>
                    <Input
                      id="m-email"
                      type="email"
                      placeholder="name@company.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="m-phone">Phone Number</Label>
                    <Input id="m-phone" placeholder="+49..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddManagerOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setIsAddManagerOpen(false)}>
                    Add Contact
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                      Document Name
                    </TableHead>
                    <TableHead className="font-semibold">Start Date</TableHead>
                    <TableHead className="font-semibold">End Date</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold text-right">
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
                      const file = doc.file || (doc as unknown as File);
                      const name = doc.name || file.name;
                      const status = getDocumentStatus(doc.endDate);

                      if (!file) return null;

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
                                  {(file.size / 1024).toFixed(1)} KB
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
                                onClick={() => {
                                  const url = URL.createObjectURL(file);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = name;
                                  a.click();
                                  URL.revokeObjectURL(url);
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
              {/* Pagination mimicking workers tab */}
              {documents.length > 0 && (
                <div className="flex items-center justify-between p-4 border-t bg-gray-50/50 dark:bg-gray-900/50 text-xs text-muted-foreground">
                  <span>
                    Showing 1 to {documents.length} of {documents.length}{" "}
                    entries
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <span className="sr-only">Prev</span>&lt;
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-6 w-6 p-0 bg-primary/20 text-primary-foreground"
                    >
                      1
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <span className="sr-only">Next</span>&gt;
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
