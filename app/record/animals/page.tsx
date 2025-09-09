"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Ellipsis,
  Filter,
  Download,
  TrendingUp,
  Users,
  Calendar,
  Activity,
  Eye,
  EyeOff,
} from "lucide-react";
import { deleteAnimal, getAnimals, type Animal } from "@/lib/actions/animals";
import { CalvingRecordModal } from "@/components/calving-record-modal";
import { AddAnimalModal } from "@/components/add-animal-modal";
import { useToast } from "@/hooks/use-toast";
import { formatAge } from "@/lib/utils";
import Link from "next/link";
import type { Calving } from "@/lib/types";
import { getClassification } from "@/lib/get-classification";
import DeleteAnimalModal from "@/components/delete-animal-modal";
import { getCombinedStatus } from "@/lib/status-helper";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

export default function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [addAnimalModalOpen, setAddAnimalModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<string | number | null>(
    null
  );
  const [showCharts, setShowCharts] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sexFilter, setSexFilter] = useState("all");

  const [animals, setAnimals] = useState<Animal[]>([]);

  useEffect(() => {
    async function loadAnimals() {
      const data = await getAnimals();
      setAnimals(data);
    }
    loadAnimals();
  }, []);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { toast } = useToast();

  // Enhanced filtering
  const filteredAnimals = animals.filter((animal) => {
    const matchesSearch =
      animal.ear_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || animal.status === statusFilter;
    const matchesSex = sexFilter === "all" || animal.sex === sexFilter;

    return matchesSearch && matchesStatus && matchesSex;
  });

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize, animals.length, statusFilter, sexFilter]);

  const totalItems = filteredAnimals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedAnimals = filteredAnimals.slice(startIndex, endIndex);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const pageSizes = [5, 10, 25, 50];

  // Chart data calculations
  const getChartData = () => {
    // Sex distribution
    const sexData = animals.reduce((acc, animal) => {
      acc[animal.sex || "Unknown"] = (acc[animal.sex || "Unknown"] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sexChartData = Object.entries(sexData).map(([sex, count]) => ({
      name: sex,
      value: count,
      percentage: Math.round((count / animals.length) * 100),
    }));

    // Age distribution
    const ageGroups = {
      "0-1 years": 0,
      "1-3 years": 0,
      "3-5 years": 0,
      "5+ years": 0,
    };
    animals.forEach((animal) => {
      if (animal.birth_date) {
        const age =
          new Date().getFullYear() - new Date(animal.birth_date).getFullYear();
        if (age < 1) ageGroups["0-1 years"]++;
        else if (age < 3) ageGroups["1-3 years"]++;
        else if (age < 5) ageGroups["3-5 years"]++;
        else ageGroups["5+ years"]++;
      }
    });

    const ageChartData = Object.entries(ageGroups).map(([age, count]) => ({
      name: age,
      count,
      percentage: Math.round((count / animals.length) * 100),
    }));

    // Status distribution
    const statusData = animals.reduce((acc, animal) => {
      acc[animal.status || "Unknown"] =
        (acc[animal.status || "Unknown"] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusChartData = Object.entries(statusData).map(
      ([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
        percentage: Math.round((count / animals.length) * 100),
      })
    );

    // Monthly registration trend (mock data)
    const monthlyData = [
      { month: "Jan", animals: 12 },
      { month: "Feb", animals: 8 },
      { month: "Mar", animals: 15 },
      { month: "Apr", animals: 10 },
      { month: "May", animals: 18 },
      { month: "Jun", animals: 14 },
    ];

    return { sexChartData, ageChartData, statusChartData, monthlyData };
  };

  const { sexChartData, ageChartData, statusChartData, monthlyData } =
    getChartData();

  const COLORS = {
    primary: ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"],
    secondary: ["#a78bfa", "#38bdf8", "#34d399", "#fbbf24", "#fb7185"],
  };

  const getPaginationRange = (
    total: number,
    current: number,
    siblingCount = 1
  ): (number | "left-ellipsis" | "right-ellipsis")[] => {
    const totalNumbers = siblingCount * 2 + 5;
    if (total <= totalNumbers) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const left = Math.max(2, current - siblingCount);
    const right = Math.min(total - 1, current + siblingCount);

    const showLeftEllipsis = left > 2;
    const showRightEllipsis = right < total - 1;

    const pages: (number | "left-ellipsis" | "right-ellipsis")[] = [1];

    if (showLeftEllipsis) pages.push("left-ellipsis");
    for (let i = left; i <= right; i++) pages.push(i);
    if (showRightEllipsis) pages.push("right-ellipsis");
    pages.push(total);

    return pages;
  };

  const paginationItems = getPaginationRange(totalPages, page, 1);

  // Statistics cards data
  const totalAnimals = animals.length;
  const femaleCount = animals.filter((a) => a.sex === "Female").length;
  const maleCount = animals.filter((a) => a.sex === "Male").length;
  const averageAge =
    animals.reduce((sum, animal) => {
      if (animal.birth_date) {
        const age =
          new Date().getFullYear() - new Date(animal.birth_date).getFullYear();
        return sum + age;
      }
      return sum;
    }, 0) / animals.filter((a) => a.birth_date).length || 0;

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold text-primary bg-clip-text ">
            Animal Management Dashboard
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Monitor and manage your livestock with comprehensive insights
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCharts(!showCharts)}
            className=""
          >
            {showCharts ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {showCharts ? "Hide" : "Show"} Analytics
          </Button>
          <Button variant="outline" className="">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Animals
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {totalAnimals}
            </div>
            <p className="text-xs text-muted-foreground">Overall herd size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Females
            </CardTitle>
            <Activity className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">
              {femaleCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Active breeding cows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Males
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{maleCount}</div>
            <p className="text-xs text-muted-foreground">Active bulls</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Age
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {averageAge.toFixed(1)}y
            </div>
            <p className="text-xs text-muted-foreground">Average across herd</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sex Distribution Pie Chart */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Sex Distribution
              </CardTitle>
              <CardDescription>
                Distribution of animals by gender
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sexChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                  >
                    {sexChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS.primary[index % COLORS.primary.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Age Distribution Bar Chart */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Age Distribution
              </CardTitle>
              <CardDescription>Animals grouped by age ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Status Overview
              </CardTitle>
              <CardDescription>Current status of all animals</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#06b6d4"
                    dataKey="value"
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS.secondary[index % COLORS.secondary.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly Registration Trend */}
          <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-800">
                Registration Trend
              </CardTitle>
              <CardDescription>Monthly animal registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="animals"
                    stroke="#10b981"
                    fill="url(#colorGradient)"
                  />
                  <defs>
                    <linearGradient
                      id="colorGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Action Bar */}
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => setAddAnimalModalOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Animal
              </Button>
            </div>

            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search animals by tag or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pregnant">Pregnant</option>
                <option value="sick">Sick</option>
              </select>

              <select
                value={sexFilter}
                onChange={(e) => setSexFilter(e.target.value)}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {pageSizes.map((s) => (
                  <option key={s} value={s}>
                    {s} per page
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Animals Table */}
      <Card className="shadow-lg border-0 bg-white/70 backdrop-blur">
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-2xl font-semibold text-gray-800">
            Animal Inventory
          </CardTitle>
          <CardDescription className="text-base">
            Showing {startIndex + 1 <= endIndex ? startIndex + 1 : 0}-{endIndex}{" "}
            of {filteredAnimals.length} animals
            {(statusFilter !== "all" || sexFilter !== "all") && (
              <span className="ml-2 text-blue-600">
                (filtered from {animals.length} total)
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="font-semibold text-gray-800">
                    Ear Tag
                  </TableHead>
                  <TableHead className="font-semibold text-gray-800">
                    Sex
                  </TableHead>
                  <TableHead className="font-semibold text-gray-800">
                    Age
                  </TableHead>
                  <TableHead className="font-semibold text-gray-800">
                    Classification
                  </TableHead>
                  <TableHead className="font-semibold text-gray-800">
                    Birth Date
                  </TableHead>
                  <TableHead className="font-semibold text-gray-800">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-gray-800">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAnimals.map((animal) => (
                  <TableRow
                    key={animal.id}
                    className="hover:bg-blue-50/50 transition-colors duration-200"
                  >
                    <TableCell className="font-medium text-gray-900">
                      {animal.ear_tag}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          animal.sex === "Female" ? "secondary" : "outline"
                        }
                        className={
                          animal.sex === "Female"
                            ? "bg-pink-100 text-pink-800 border-pink-200"
                            : "bg-blue-100 text-blue-800 border-blue-200"
                        }
                      >
                        {animal.sex || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {animal.birth_date ? formatAge(animal.birth_date) : "N/A"}
                    </TableCell>
                    <TableCell>
                      {animal.birth_date ? (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Adult
                        </Badge>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {formatDate(animal.birth_date)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          animal.status === "active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : animal.status === "pregnant"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-orange-50 text-orange-700 border-orange-200"
                        }
                      >
                        {animal.status?.charAt(0).toUpperCase() +
                          animal.status?.slice(1) || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-blue-100 transition-colors duration-200"
                          >
                            <Ellipsis className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="shadow-lg border-gray-200">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/animal/${animal.ear_tag}`}
                              className="hover:bg-blue-50"
                            >
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/animal/${animal.ear_tag}/edit`}
                              className="hover:bg-blue-50"
                            >
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setDeleteModalOpen(true);
                              setSelectedAnimal(animal.id);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {paginatedAnimals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Users className="h-12 w-12 opacity-50" />
                        <p className="text-lg font-medium">No animals found</p>
                        <p className="text-sm">
                          Try adjusting your search or filter criteria
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Enhanced Pagination Controls */}
          <div className="mt-6 p-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages} • {totalItems} total animals
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="hover:bg-blue-50"
                >
                  {"<<"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="hover:bg-blue-50"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1 px-2">
                  {paginationItems.map((item, idx) =>
                    typeof item === "number" ? (
                      <Button
                        key={idx}
                        size="sm"
                        variant={item === page ? "default" : "outline"}
                        onClick={() => setPage(item)}
                        className={
                          item === page
                            ? "bg-blue-600 hover:bg-blue-700"
                            : "hover:bg-blue-50"
                        }
                      >
                        {item}
                      </Button>
                    ) : item === "left-ellipsis" ||
                      item === "right-ellipsis" ? (
                      <span
                        key={idx}
                        className="px-2 select-none text-muted-foreground"
                      >
                        …
                      </span>
                    ) : null
                  )}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="hover:bg-blue-50"
                >
                  Next
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="hover:bg-blue-50"
                >
                  {">>"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddAnimalModal
        open={addAnimalModalOpen}
        onOpenChange={setAddAnimalModalOpen}
        animals={animals}
      />
      <DeleteAnimalModal
        animal={animals.find((a) => a.id === selectedAnimal) || null}
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
      />
    </div>
  );
}
