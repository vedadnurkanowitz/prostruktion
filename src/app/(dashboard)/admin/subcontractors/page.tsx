"use client";

import { useState, useEffect } from "react";
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
  LayoutDashboard,
  Users,
  AlertTriangle,
  Ban,
  Star,
  Search,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { SubcontractorDetail } from "@/components/admin/subcontractor-detail";

export default function SubcontractorsPage() {
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<any>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    // Load data from local storage
    const storedData = localStorage.getItem("prostruktion_subcontractors");
    if (storedData) {
      setSubcontractors(JSON.parse(storedData));
    } else {
      // Initialize empty if nothing exists
      setSubcontractors([]);
      localStorage.setItem("prostruktion_subcontractors", JSON.stringify([]));
    }
  }, []);

  // Calculate dynamic stats
  const totalSubs = subcontractors.length;
  const activeSubs = subcontractors.filter((s) => s.status === "Active").length;
  // Based on the image, "Expiring Docs (30d)" is a specific stat.
  // We'll count those with status "Expiring" or flag `docsExpiring` (if we had complex logic).
  // For now, mapping status "Expiring" seems appropriate or checking `expiry` date logic if implemented.
  // We'll use status "Expiring" + "Docs Expired" check for simplicity.
  const expiringDocsCount = subcontractors.filter(
    (s) => s.status === "Expiring" || s.docsExpired,
  ).length;
  const blockedSubs = subcontractors.filter(
    (s) => s.status === "Blocked",
  ).length;

  const avgRating =
    totalSubs > 0
      ? (
          subcontractors.reduce((acc, curr) => acc + (curr.rating || 0), 0) /
          totalSubs
        ).toFixed(1)
      : "0.0";

  // Pagination Logic
  const totalPages = Math.ceil(subcontractors.length / itemsPerPage);
  const paginatedSubcontractors = subcontractors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (selectedSubcontractor) {
    return (
      <SubcontractorDetail
        subcontractor={selectedSubcontractor}
        onBack={() => setSelectedSubcontractor(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Subcontractors</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" /> Total SUBs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{totalSubs}</div>
              <Users className="h-4 w-4 text-blue-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-green-600" /> Active SUBs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{activeSubs}</div>
              <LayoutDashboard className="h-4 w-4 text-green-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-pink-50 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-pink-600" /> Expiring Docs
              (30d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{expiringDocsCount}</div>
              <AlertTriangle className="h-4 w-4 text-pink-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Ban className="h-4 w-4 text-orange-600" /> Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{blockedSubs}</div>
              <Ban className="h-4 w-4 text-orange-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-100 dark:border-yellow-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" /> Avg Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(parseFloat(avgRating))
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xl font-bold ml-2">{avgRating}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-muted/20 p-2 rounded-lg border">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            Filters:
          </span>
          <Select defaultValue="all-statuses">
            <SelectTrigger className="w-[130px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-statuses">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="expiring">Expiring</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-countries">
            <SelectTrigger className="w-[130px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-countries">All Countries</SelectItem>
              <SelectItem value="germany">Germany</SelectItem>
              <SelectItem value="italy">Italy</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="all-categories">
            <SelectTrigger className="w-[130px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-categories">All Categories</SelectItem>
              <SelectItem value="construction">Construction</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="rating-4">
            <SelectTrigger className="w-[130px] h-8 bg-white dark:bg-gray-950">
              <SelectValue placeholder="Rating 4+" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating-4">Rating 4+</SelectItem>
              <SelectItem value="rating-3">Rating 3+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-[200px]">
            <Input
              placeholder="Search"
              className="h-8 pl-8 bg-white dark:bg-gray-950"
            />
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button className="h-8 bg-primary hover:bg-primary/90 text-primary-foreground">
            <RotateCcw className="mr-2 h-3 w-3" /> Reset Filters
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {totalSubs} Subcontractors found
      </div>

      {/* Main Table */}
      <div className="rounded-md border bg-white dark:bg-gray-950">
        <Table>
          <TableHeader className="bg-gray-50 dark:bg-gray-900/50">
            <TableRow>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Company
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Status
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Rating
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Projects
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Complaints
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                On-time %
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Nearest Expiry
              </TableHead>
              <TableHead className="font-semibold text-gray-700 dark:text-gray-300">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subcontractors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  No subcontractors found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedSubcontractors.map((company, i) => (
                <TableRow key={i} className="group hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-6 bg-gray-200 rounded text-[10px] flex items-center justify-center">
                        {company.country}
                      </div>
                      <span className="font-medium">{company.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={`${
                          company.status === "Active"
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : company.status === "Expiring"
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                        } border-0 font-medium`}
                      >
                        {company.status === "Active" && (
                          <span className="mr-1 h-2 w-2 rounded-full bg-green-600 inline-block"></span>
                        )}
                        {company.status === "Expiring" && (
                          <span className="mr-1 h-2 w-2 rounded-full bg-yellow-600 inline-block"></span>
                        )}
                        {company.status === "Blocked" && (
                          <span className="mr-1 h-2 w-2 rounded-full bg-red-600 inline-block"></span>
                        )}
                        {company.status}
                      </Badge>
                      {company.docsExpired && (
                        <span className="text-xs text-red-500 bg-red-50 px-1 rounded border border-red-100">
                          Docs Expired!
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= company.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{company.projects}</TableCell>
                  <TableCell>{company.complaints}</TableCell>
                  <TableCell>{company.onTime}</TableCell>
                  <TableCell
                    className={
                      company.expiry === "Docs Expired!" || company.docsExpired
                        ? "text-red-500 font-medium"
                        : ""
                    }
                  >
                    {company.expiry}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
                        onClick={() => setSelectedSubcontractor(company)}
                      >
                        Manage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50/50 dark:bg-gray-900/50">
          <div className="text-sm text-muted-foreground">
            Showing{" "}
            {subcontractors.length > 0
              ? (currentPage - 1) * itemsPerPage + 1
              : 0}{" "}
            to {Math.min(currentPage * itemsPerPage, subcontractors.length)} of{" "}
            {subcontractors.length} entries
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Simple sliding logic
              let p = i + 1;
              if (totalPages > 5 && currentPage > 3) p = currentPage - 2 + i;
              if (p > totalPages) return null;

              return (
                <Button
                  key={p}
                  variant={currentPage === p ? "ghost" : "outline"}
                  size="sm"
                  className={`h-8 w-8 text-sm font-medium ${currentPage === p ? "bg-white dark:bg-gray-800 border shadow-sm" : "text-muted-foreground"}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
              <span>/ page</span>
            </div>
            <Button variant="outline" size="sm" className="h-8">
              Download CSV <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
