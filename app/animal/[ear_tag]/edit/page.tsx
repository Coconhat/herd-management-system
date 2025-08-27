import { createClient } from "@/lib/supabase/server";
import EditAnimalForm from "./_component/edit-modal";
import { notFound } from "next/navigation";

export default async function EditAnimalPage({
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
      <h1 className="text-xl font-bold mb-4">Edit Animal</h1>
      <EditAnimalForm animal={animal} allAnimals={allAnimals || []} />
    </div>
  );
}
