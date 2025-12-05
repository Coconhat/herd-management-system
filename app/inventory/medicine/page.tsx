import { getMedicines } from "@/lib/actions/medicines";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  differenceInDays,
  isBefore,
  parseISO,
  startOfToday,
  format,
} from "date-fns";
import { AddMedicineModal } from "./_components/add-medicine-modal";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Calendar,
  Home,
  Activity,
  Clock,
  AlertCircle,
} from "lucide-react";
import { EditMedicineModal } from "./_components/edit-medicine-modal";

// Define a type for the variant of the badge component, assuming 'warning' is available.
type BadgeVariant = "default" | "secondary" | "destructive" | "warning";

interface StatusResult {
  text: string;
  variant: BadgeVariant;
  category: "expired" | "expiring-soon" | "good" | "no-expiry";
}

export default async function MedicineInventoryPage() {
  const medicines = await getMedicines();

  const today = startOfToday();

  const getStatus = (expDate: string | null | undefined): StatusResult => {
    if (!expDate)
      return {
        text: "No Expiry",
        variant: "secondary",
        category: "no-expiry",
      };

    const expirationDate = parseISO(expDate);
    if (isBefore(expirationDate, today)) {
      return {
        text: "Expired",
        variant: "destructive",
        category: "expired",
      };
    }

    const daysUntilExpiry = differenceInDays(expirationDate, today);
    if (daysUntilExpiry <= 30) {
      return {
        text: `Expires in ${daysUntilExpiry}d`,
        variant: "warning" as BadgeVariant,
        category: "expiring-soon",
      };
    }

    return {
      text: "Good",
      variant: "default",
      category: "good",
    };
  };

  // Calculate statistics
  const totalMedicines = medicines.length;
  const expiredMedicines = medicines.filter(
    (m) =>
      m.expiration_date && getStatus(m.expiration_date).category === "expired"
  ).length;
  const expiringSoon = medicines.filter(
    (m) =>
      m.expiration_date &&
      getStatus(m.expiration_date).category === "expiring-soon"
  ).length;
  const goodStock = medicines.filter(
    (m) =>
      !m.expiration_date || getStatus(m.expiration_date).category === "good"
  ).length;
  const lowStock = medicines.filter((m) => m.stock_quantity < 10).length;
  const totalStock = medicines.reduce((sum, m) => sum + m.stock_quantity, 0);

  // Calculate percentages for visual representation
  const expiredPercentage =
    totalMedicines > 0 ? (expiredMedicines / totalMedicines) * 100 : 0;
  const expiringSoonPercentage =
    totalMedicines > 0 ? (expiringSoon / totalMedicines) * 100 : 0;
  const goodStockPercentage =
    totalMedicines > 0 ? (goodStock / totalMedicines) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Home
        </Link>
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Medicine Inventory
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Comprehensive medicine stock management and analytics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            </Link>
            <AddMedicineModal />
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Medicines */}
          <Card className="relative overflow-hidden border-l-4 border-l-primary hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Total Medicines
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1">
                    {totalMedicines}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                    {totalStock} units in stock
                  </p>
                </div>
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Good Stock */}
          <Card className="relative overflow-hidden border-l-4 border-l-emerald-500 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Good Condition
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-emerald-600">
                    {goodStock}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {goodStockPercentage.toFixed(0)}% of inventory
                  </p>
                </div>
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expiring Soon */}
          <Card
            className="relative overflow-hidden border-l-4 border-Visual representation of medicine conditions
l-amber-500 hover:shadow-lg transition-all duration-300"
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Expiring Soon
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-amber-600">
                    {expiringSoon}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Within 30 days
                  </p>
                </div>
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 sm:h-7 sm:w-7 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expired */}
          <Card className="relative overflow-hidden border-l-4 border-l-red-500 hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Expired
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold mt-1 text-red-600">
                    {expiredMedicines}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-red-600 mt-1 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Requires action
                  </p>
                </div>
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 sm:h-7 sm:w-7 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visual Health Overview */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle className="text-base sm:text-lg">
                Inventory Health Overview
              </CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Visual representation of medicine conditions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Low Stock Alert */}
            {lowStock > 0 && (
              <div className="mt-4 p-3 sm:p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400">
                      Low Stock Alert
                    </p>
                    <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-500 mt-1">
                      {lowStock} medicine{lowStock > 1 ? "s" : ""} running low
                      (below 10 units). Consider restocking soon.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medicine Table */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  All Medicines
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Detailed view of all medicine stock and expiration dates
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="whitespace-nowrap font-semibold">
                      Medicine Name
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">
                      Stock Quantity
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">
                      Expiration Date
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="whitespace-nowrap font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                          <Package className="h-12 w-12 opacity-20" />
                          <div>
                            <p className="font-medium">No medicines found</p>
                            <p className="text-xs sm:text-sm">
                              Add your first medicine to get started
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    medicines.map((med) => {
                      const status = getStatus(med.expiration_date);
                      const isLowStock = med.stock_quantity < 10;

                      return (
                        <TableRow
                          key={med.id}
                          className={`hover:bg-muted/30 transition-colors ${
                            status.category === "expired" ? "bg-red-500/5" : ""
                          }`}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2 w-2 rounded-full ${
                                  status.category === "expired"
                                    ? "bg-red-500"
                                    : status.category === "expiring-soon"
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                              />
                              <span className="text-sm sm:text-base">
                                {med.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-semibold ${
                                  isLowStock ? "text-amber-600" : ""
                                }`}
                              >
                                {med.stock_quantity}
                              </span>
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                {med.unit}
                              </span>
                              {isLowStock && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] border-amber-500 text-amber-600"
                                >
                                  Low
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                              <span className="text-xs sm:text-sm">
                                {med.expiration_date
                                  ? format(
                                      parseISO(med.expiration_date),
                                      "MMM dd, yyyy"
                                    )
                                  : "N/A"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                status.variant === "warning"
                                  ? "outline"
                                  : (status.variant as
                                      | "default"
                                      | "secondary"
                                      | "destructive"
                                      | "outline")
                              }
                              className={
                                status.category === "expiring-soon"
                                  ? "border-amber-500 text-amber-600 bg-amber-500/10"
                                  : ""
                              }
                            >
                              {status.text}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <EditMedicineModal medicineId={med.id} />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
