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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SubcontractorDetail } from "@/components/admin/subcontractor-detail";

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

  // View State for Drill-down
  const [selectedSubcontractor, setSelectedSubcontractor] =
    useState<Contact | null>(null);
  const [subWorkers, setSubWorkers] = useState<Worker[]>([]);

  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");

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
          });
        });
      }

      // 2. Fetch Subcontractors from LocalStorage
      const storedSubs = localStorage.getItem("prostruktion_subcontractors");
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
          });
        });
      } else {
        localStorage.setItem("prostruktion_contractors", JSON.stringify([]));
      }

      setContacts(allContacts);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Filter Logic
  const filteredContacts = contacts.filter((contact) => {
    if (filterType !== "all" && contact.role !== filterType) return false;
    return true;
  });

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
        <h2 className="text-2xl font-bold tracking-tight">Contacts</h2>
      </div>

      {/* Top Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
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

        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-purple-600" /> Mediators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{countMediators}</div>
              <UserCircle className="h-4 w-4 text-purple-300" />
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
          <Button className="h-9 bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
            <Plus className="mr-2 h-4 w-4" /> Add Contact
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredContacts.length} Contacts found
      </div>

      {/* Main Table */}
      <div className="rounded-md border bg-white dark:bg-gray-950 overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/80 dark:bg-gray-900/50">
            <TableRow>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Name
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Company
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Contact Type
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
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Status
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
              filteredContacts.map((contact, i) => (
                <TableRow
                  key={i}
                  className="group hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.name}`}
                        />
                        <AvatarFallback>
                          {contact.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {contact.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {contact.companyName}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {contact.companyName}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex text-sm text-gray-700 dark:text-gray-300">
                      {getRoleLabel(contact.role)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {contact.jobTitle}
                    </span>
                  </TableCell>
                  <TableCell
                    className="text-xs text-muted-foreground truncate max-w-[150px]"
                    title={contact.email}
                  >
                    {contact.email}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {contact.phone}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {contact.status === "Active" ? (
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-gray-300" />
                      )}
                      <span
                        className={`text-sm ${contact.status === "Active" ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}
                      >
                        {contact.status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {(contact.role === "subcontractor" ||
                      contact.role === "partner") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 border border-blue-100"
                        onClick={() => handleViewClick(contact)}
                      >
                        View <ChevronRight className="ml-1 h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between p-4 border-t bg-gray-50/50 dark:bg-gray-900/50 gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredContacts.length > 0 ? 1 : 0} to{" "}
            {Math.min(10, filteredContacts.length)} of {filteredContacts.length}{" "}
            entries
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 bg-blue-600 text-white hover:bg-blue-700"
            >
              1
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
            >
              2
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
            >
              3
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-blue-600 gap-1"
            >
              Next Page <ChevronRight className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-7 w-7">
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="text-xs font-medium text-muted-foreground">
                10 / page
              </span>
              <Button variant="outline" size="icon" className="h-7 w-7">
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
    </div>
  );
}
