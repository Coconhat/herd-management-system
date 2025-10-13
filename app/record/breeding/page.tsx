// app/breeding/page.tsx
import { getAnimalsWithBreedingData } from "@/lib/actions/animals";
import { BreedingActionDashboard } from "./_components/breeding-action-dashboard";
import { BreedingHistoryTable } from "./_components/history-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, BarChart3, FileText } from "lucide-react";
import { PDCheckCalendar } from "./_components/pd-check-calendar";

export default async function BreedingPage() {
  const allAnimals = await getAnimalsWithBreedingData();

  const pendingPdCount = allAnimals.reduce((count, animal) => {
    return (
      count +
      (animal.breeding_records?.filter(
        (record) => record.pd_result === "Unchecked"
      ).length || 0)
    );
  }, 0);

  const pregnantCount = allAnimals.reduce((count, animal) => {
    return (
      count +
      (animal.breeding_records?.filter(
        (record) => record.pd_result === "Pregnant"
      ).length || 0)
    );
  }, 0);

  return (
    <div className="space-y-8 m-4">
      <div>
        <h1 className="text-3xl font-bold">Breeding & Pregnancy Center</h1>
        <p className="text-muted-foreground">
          Your central hub for managing the reproductive cycle.
        </p>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Animals</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allAnimals.length}</div>
            <p className="text-xs text-muted-foreground">In breeding program</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pending PD Checks
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPdCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Pregnant Animals
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pregnantCount}</div>
            <p className="text-xs text-muted-foreground">Currently pregnant</p>
          </CardContent>
        </Card>
      </div>

      {/* Action dashboard (full width) */}
      <div>
        <BreedingActionDashboard animals={allAnimals} />
      </div>

      {/* Main content: history (3 cols) + calendar (1 col) on lg, stacked on small */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <BreedingHistoryTable animals={allAnimals} />
        </div>

        <div className="lg:col-span-1">
          <PDCheckCalendar animals={allAnimals} />
        </div>
      </div>
    </div>
  );
}
