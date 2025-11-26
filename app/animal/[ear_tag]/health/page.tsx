import { createClient } from "@/lib/supabase/server";
import EditAnimalForm from "../edit/_component/edit-modal";
import { notFound } from "next/navigation";
import AnimalHealthForm from "./_component/animal-health";

export default async function AnimalHealthPage({
  params,
}: {
  params: { ear_tag: string };
}) {
  const supabase = await createClient();

  // fetch single animal
  const { data: animal, error } = await supabase
    .from("animals")
    .select("*")
    .eq("ear_tag", params.ear_tag)
    .single();

  if (error || !animal) return notFound();

  // fetch all animals (for dam/sire dropdown)
  const { data: allAnimals } = await supabase.from("animals").select("*");

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Animal Health</h1>
      <AnimalHealthForm animal={animal} allAnimals={allAnimals || []} />
    </div>
  );
}
