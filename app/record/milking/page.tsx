import { getFemaleCattleWithMilkingRecords } from "@/lib/actions/milking";
import { AddMilkingRecordModal } from "./_components/add-milking-record-modal";
import { MilkingStatsCard } from "./_components/milking-stats-card";
import { MilkingTabs } from "./_components/milking-tabs";
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
        <h2 className="text-xl font-semibold">Add New Record</h2>
        <AddMilkingRecordModal animals={animals} />
      </div>

      <MilkingTabs
        sortedRecords={sortedRecords}
        allMilkingRecords={allMilkingRecords}
        animals={animals}
      />
    </div>
  );
}
