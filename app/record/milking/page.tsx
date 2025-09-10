import { getFemaleCattleWithMilkingRecords } from "@/lib/actions/milking";
import { AddMilkingRecordModal } from "./_components/add-milking-record-modal";
import { MilkingRecordsTable } from "./_components/milking-records-table";
import { MilkingStatsCard } from "./_components/milking-stats-card";
import { QuarterlyCharts } from "./_components/quarterly-charts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MilkingRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { TableIcon, Calendar, BarChart3 } from "lucide-react";

export default async function MilkingPage() {
  // Fetch all female cattle with their milking records
  const animals = await getFemaleCattleWithMilkingRecords();

  // Extract all milking records from all animals
  const allMilkingRecords = animals.reduce((records, animal) => {
    const animalRecords = animal.milking_records || [];
    return [...records, ...animalRecords];
  }, [] as MilkingRecord[]);

  // Sort records by date descending
  const sortedRecords = [...allMilkingRecords].sort(
    (a, b) =>
      new Date(b.milking_date).getTime() - new Date(a.milking_date).getTime()
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Milk Production Records</h1>
        <p className="text-muted-foreground">
          Track and manage the milk production of your herd.
        </p>
      </div>

      {/* Summary Statistics Cards */}
      <MilkingStatsCard milkingRecords={allMilkingRecords} />

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Production History</h2>
        <AddMilkingRecordModal animals={animals} />
      </div>

      <Tabs defaultValue="excel">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="excel" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Excel View
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" />
            All Records
          </TabsTrigger>
          <TabsTrigger value="by-animal">By Animal</TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="excel" className="pt-4">
          <MilkingRecordsTable
            records={sortedRecords}
            animals={animals}
            viewMode="excel"
          />
        </TabsContent>

        <TabsContent value="all" className="pt-4">
          <MilkingRecordsTable
            records={sortedRecords}
            animals={animals}
            viewMode="table"
          />
        </TabsContent>

        <TabsContent value="by-animal" className="pt-4">
          <div className="space-y-8">
            {animals.map((animal) => {
              // Skip animals with no milking records
              if (
                !animal.milking_records ||
                animal.milking_records.length === 0
              ) {
                return null;
              }

              // Sort records by date descending
              const animalRecords = [...animal.milking_records].sort(
                (a, b) =>
                  new Date(b.milking_date).getTime() -
                  new Date(a.milking_date).getTime()
              );

              return (
                <div key={animal.id} className="space-y-2">
                  <h3 className="text-lg font-medium">
                    {animal.ear_tag} - {animal.name || "Unnamed"}
                  </h3>
                  <MilkingRecordsTable
                    records={animalRecords}
                    animals={animals}
                    viewMode="table"
                  />
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="pt-4">
          <QuarterlyCharts
            milkingRecords={allMilkingRecords}
            animals={animals}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
