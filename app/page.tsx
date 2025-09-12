import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar as CalendarIcon,
  Users,
  Heart,
  TrendingUp,
} from "lucide-react";
import {
  getAnimals,
  getAnimalStats,
  getAnimalsWithBreedingData,
} from "@/lib/actions/animals";
import { DashboardContent } from "@/components/dashboard-content";
import { UserNav } from "@/components/user-nav";
import { CalendarWidget } from "@/components/calendar";
import { DesktopSidebar, MobileSidebar } from "@/components/sidebar-demo";
import { getCalvingsWithDetails } from "@/lib/actions/calvings";
import { getBreedingRecordsWithAnimalInfo } from "@/lib/actions/breeding";
import Link from "next/link";

async function StatsCards() {
  const stats = await getAnimalStats();

  const allAnimals = await getAnimalsWithBreedingData();

  const allBreedingRecords = allAnimals.flatMap((animal) =>
    (animal.breeding_records || []).map((record) => ({
      ...record,
      animals: {
        // Ensure the 'animals' object structure matches the widget's expectation
        ear_tag: animal.ear_tag,
        name: animal.name,
      },
    }))
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Animals
          </CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {stats.totalAnimals}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.femaleAnimals} females active
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent Calvings
          </CardTitle>
          <Heart className="h-4 w-4 text-secondary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-secondary">
            {stats.recentCalvings}
          </div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pregnant Cows
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-accent">
            {stats.pregnantCows}
          </div>
          <p className="text-xs text-muted-foreground">
            Expected calvings coming
          </p>
        </CardContent>
      </Card>
    </div>
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
  // Fetch animals with breeding data for the calendar widget
  const allAnimals = await getAnimalsWithBreedingData();
  const allCalvings = await getCalvingsWithDetails();

  const allBreedingRecords = allAnimals.flatMap((animal) =>
    (animal.breeding_records || []).map((record) => ({
      ...record,
      animals: {
        ear_tag: animal.ear_tag,
        name: animal.name ?? null,
      },
    }))
  );

  // Transform calvings to match the expected format
  const allCalvingsForCalendar = allCalvings.map((calving) => ({
    ...calving,
    animals: {
      ear_tag: calving.animals?.ear_tag || `ID #${calving.animal_id}`,
      name: calving.animals?.name || null,
    },
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Main content */}
      <div className="md:pl-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MobileSidebar />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Herd Management System
                  </h1>
                  <p className="text-muted-foreground">
                    Manage your cattle with confidence
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/reports">
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Reports
                  </Button>
                </Link>
                <Button variant="outline" size="sm">
                  Settings
                </Button>
                <UserNav />
              </div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex flex-1">
          {/* Dashboard content */}
          <div className="flex-1 p-6">
            {/* Stats Cards */}
            <Suspense
              fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                      </CardHeader>
                      <CardContent>
                        <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
            <CalendarWidget
              records={allBreedingRecords}
              calvings={allCalvingsForCalendar}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
