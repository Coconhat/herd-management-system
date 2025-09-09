import { getAnimalsWithBreedingData } from "@/lib/actions/animals";
import { BreedingActionDashboard } from "./_components/breeding-action-dashboard";
import { BreedingHistoryTable } from "./_components/history-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, BarChart3, FileText } from "lucide-react";
import { PDCheckCalendar } from "./_components/pd-check-calendar";

export default async function BreedingPage() {
  const allAnimals = await getAnimalsWithBreedingData();

  return (
    <div className="space-y-8 m-4">
      <div>
        <h1 className="text-3xl font-bold">Breeding & Pregnancy Center</h1>
        <p className="text-muted-foreground">
          Your central hub for managing the reproductive cycle.
        </p>
      </div>
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Animals</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allAnimals.length}</div>
            <p className="text-xs text-muted-foreground">In breeding program</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending PD Checks
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allAnimals.reduce((count, animal) => {
                return (
                  count +
                  (animal.breeding_records?.filter(
                    (record) => record.pd_result === "Unchecked"
                  ).length || 0)
                );
              }, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pregnant Animals
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allAnimals.reduce((count, animal) => {
                return (
                  count +
                  (animal.breeding_records?.filter(
                    (record) => record.pd_result === "Pregnant"
                  ).length || 0)
                );
              }, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Currently pregnant</p>
          </CardContent>
        </Card>
      </div>

      {/* The To-Do list component */}
      <div className="lg:col-span-2">
        <BreedingActionDashboard animals={allAnimals} />
      </div>
      {/* The historical log */}
      <div className="grid-cols-2">
        <BreedingHistoryTable animals={allAnimals} />
      </div>
      {/* Two-column layout for calendar and action dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"></div>
    </div>
  );
}
