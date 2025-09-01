import { getAnimalsWithBreedingData } from "@/lib/actions/animals"; // A new function we'll create
import { BreedingActionDashboard } from "./_components/breeding-action-dashboard";
import { BreedingHistoryTable } from "./_components/history-table";

export default async function BreedingPage() {
  // This parent page fetches all the data its children will need.
  const allAnimals = await getAnimalsWithBreedingData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Breeding & Pregnancy Center</h1>
        <p className="text-muted-foreground">
          Your central hub for managing the reproductive cycle.
        </p>
      </div>

      {/* The To-Do list component */}
      <BreedingActionDashboard animals={allAnimals} />

      {/* The historical log */}
      <BreedingHistoryTable animals={allAnimals} />
    </div>
  );
}
