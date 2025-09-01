import { PregnancyClient } from "@/components/pregnancy-client";
import { getPregnantAnimals } from "@/lib/actions/calvings";
import { BreedingRecord } from "@/lib/types";

interface AnimalWithBreeding {
  id: number;
  ear_tag: string;
  breeding_records: BreedingRecord[];
}

interface PregnancyClientProps {
  animals: AnimalWithBreeding[];
}
export default async function Page() {
  const rawPregnantAnimals = await getPregnantAnimals();

  // Transform the data to match AnimalWithBreeding type
  const pregnantAnimals: AnimalWithBreeding[] = rawPregnantAnimals.map(
    (animal) => ({
      ...animal,
      breeding_records: animal.breeding_records.map(
        (record) =>
          ({
            ...record,
            animal_id: animal.id, // Set required properties
            user_id: 0, // Set appropriate default or get from somewhere
            created_at: new Date().toISOString(), // Set appropriate default
            heat_check_date: record.breeding_date, // Set appropriate default
            pregnancy_check_due_date: record.expected_calving_date, // Set appropriate default
          } as unknown as BreedingRecord)
      ),
    })
  );

  return <PregnancyClient animals={pregnantAnimals} />;
}
