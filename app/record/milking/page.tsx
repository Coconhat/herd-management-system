import { getFemaleCattleWithMilkingRecords } from "@/lib/actions/milking";
import { AddMilkingRecordModal } from "./_components/add-milking-record-modal";
import { MilkingRecordsTable } from "./_components/milking-records-table";
import { MilkingStatsCard } from "./_components/milking-stats-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MilkingRecord } from "@/lib/types";

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

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Records</TabsTrigger>
          <TabsTrigger value="by-animal">By Animal</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="pt-4">
          <MilkingRecordsTable records={sortedRecords} animals={animals} />
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
                  />
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
