import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { getAnimals, getAnimalsWithBreedingData } from "@/lib/actions/animals";
import { DashboardContent } from "@/components/dashboard-content";
import { UserNav } from "@/components/user-nav";
import { CalendarWidget } from "@/components/calendar";
import { DesktopSidebar, MobileSidebar } from "@/components/sidebar-demo";
import { getCalvingsWithDetails } from "@/lib/actions/calvings";
import { getBreedingRecordsWithAnimalInfo } from "@/lib/actions/breeding";
import Link from "next/link";
import NotificationButton from "@/components/notification-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

async function StatsCards() {
  const allAnimals = await getAnimalsWithBreedingData();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const pregnantAnimals = allAnimals.filter(
    (animal) => animal.pregnancy_status?.toLowerCase() === "pregnant"
  );

  const pregnancyRows = pregnantAnimals
    .map((animal) => {
      const pregnancies = (animal.breeding_records || [])
        .filter(
          (record) =>
            record.confirmed_pregnant || record.pd_result === "Pregnant"
        )
        .sort((a, b) => {
          const aDate = a.expected_calving_date || "";
          const bDate = b.expected_calving_date || "";
          return aDate.localeCompare(bDate);
        });

      const nextPregnancy = pregnancies[0];
      if (!nextPregnancy) return null;

      const expectedDate = nextPregnancy.expected_calving_date;
      const daysLeft = expectedDate
        ? Math.ceil(
            (new Date(expectedDate).getTime() - today.getTime()) / MS_PER_DAY
          )
        : null;

      // Skip pregnancies already past their expected calving date
      if (daysLeft !== null && daysLeft < 0) {
        return null;
      }

      return {
        id: animal.id,
        earTag: animal.ear_tag,
        name: animal.name,
        expectedDate,
        daysLeft,
        weight: animal.weight,
        status: nextPregnancy.pd_result || "Pregnant",
        health: animal.health,
        pdCheckDate: nextPregnancy.pregnancy_check_date,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => {
      if (!a.expectedDate && !b.expectedDate) {
        return a.earTag.localeCompare(b.earTag);
      }
      if (!a.expectedDate) return 1;
      if (!b.expectedDate) return -1;
      return a.expectedDate.localeCompare(b.expectedDate);
    })
    .slice(0, 6) as Array<{
    id: number;
    earTag: string;
    name?: string | null;
    expectedDate?: string | null;
    daysLeft: number | null;
    status: string;
    weight?: number | null;
    health?: string | null;
    pdCheckDate?: string | null;
  }>;

  const formatDate = (date?: string | null) =>
    date ? new Date(date).toLocaleDateString() : "—";

  const statusVariant = (
    status: string
  ): "secondary" | "outline" | "destructive" | "default" => {
    if (status === "Pregnant") return "secondary";
    if (status === "Unchecked") return "outline";
    if (status === "Empty") return "destructive";
    return "default";
  };

  return (
    <Card className="mb-6 md:mb-8">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-base font-semibold">
            Pregnancy Watchlist
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Only confirmed pregnancies with upcoming calving dates
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/pregnancy">Open Pregnancy Center</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {pregnancyRows.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dam</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>PD Check Date</TableHead>
                  <TableHead>Expected Calving</TableHead>
                  <TableHead className="text-center">Days Left</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pregnancyRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={
                      row.daysLeft !== null && row.daysLeft <= 7
                        ? "bg-amber-50/60 dark:bg-amber-900/20"
                        : undefined
                    }
                  >
                    <TableCell className="font-medium">
                      {row.earTag}
                      {row.name ? ` – ${row.name}` : ""}
                    </TableCell>
                    <TableCell>
                      {row.weight ? `${row.weight} kg` : "—"}
                    </TableCell>
                    <TableCell>{row.health}</TableCell>
                    <TableCell>{formatDate(row.pdCheckDate)}</TableCell>

                    <TableCell>{formatDate(row.expectedDate)}</TableCell>
                    <TableCell className="text-center">
                      {row.daysLeft !== null ? (
                        <span
                          className={
                            row.daysLeft <= 7
                              ? "font-semibold text-amber-600"
                              : undefined
                          }
                        >
                          {row.daysLeft === 0
                            ? "Due today"
                            : `${row.daysLeft}d`}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(row.status)}>
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No confirmed pregnancies found. Once animals are marked pregnant,
            they will appear here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

async function AnimalsData() {
  const animals = await getAnimals();
  const calvings = await getCalvingsWithDetails();
  const breedingRecords = await getBreedingRecordsWithAnimalInfo();
  return (
    <DashboardContent
      animals={animals}
      calvings={calvings}
      breedingRecords={breedingRecords}
    />
  );
}

export default async function Dashboard() {
  return (
    <div className="min-h-screen bg-background max-w-full ">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main content */}
      <div className="md:pl-64 flex flex-col min-h-screen max-w-full">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                <MobileSidebar />
                <div className="min-w-0">
                  <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">
                    D.H MAGPANTAY's Farm System
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">
                    Manage your cattle with confidence
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href="/reports" className="hidden sm:inline-block">
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Reports</span>
                  </Button>
                </Link>

                <NotificationButton />
                <UserNav />
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex flex-1 max-w-full">
          {/* Dashboard content */}
          <div className="flex-1 p-3 sm:p-4 md:p-6 min-w-0">
            {/* Stats Cards */}
            <Suspense
              fallback={
                <Card className="mb-8">
                  <CardHeader>
                    <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[...Array(4)].map((_, rowIdx) => (
                        <div key={rowIdx} className="flex items-center gap-4">
                          {[...Array(4)].map((__, colIdx) => (
                            <div
                              key={colIdx}
                              className="h-4 w-full bg-muted animate-pulse rounded"
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <StatsCards />
            </Suspense>

            {/* Animals Table and Actions */}
            <Suspense
              fallback={
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex gap-2">
                      <div className="h-10 w-40 bg-muted animate-pulse rounded" />
                      <div className="h-10 w-32 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-10 w-full max-w-sm bg-muted animate-pulse rounded" />
                  </div>
                  <Card>
                    <CardHeader>
                      <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex space-x-4">
                            {[...Array(8)].map((_, j) => (
                              <div
                                key={j}
                                className="h-4 w-20 bg-muted animate-pulse rounded"
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              }
            >
              <AnimalsData />
            </Suspense>
          </div>

          {/* Right sidebar with calendar */}
          <div className="hidden xl:block w-80 border-l bg-card/50 p-6">
            <CalendarWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
