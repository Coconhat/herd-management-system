import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import HealthRecordModal from "./_component/animal-health";
import HealthRecordList from "./_component/animal-health-records-list";

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

  // fetch all health records of this animal

  const { data: healthRecords } = await supabase
    .from("health_records")
    .select("*")
    .eq("animal_id", animal.id)
    .order("record_date", { ascending: false });

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Animal Health</h1>
      <HealthRecordModal animal={animal} />
      <HealthRecordList records={healthRecords || []} />
    </div>
  );
}
