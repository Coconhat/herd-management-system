import { getAnimals } from "@/lib/actions/animals";
import HealthPageClient from "@/components/health-page-client";

export default async function Page({ params }: { params: { id: string } }) {
  // Fetch minimal animals list server-side and pass to client
  const animalsRaw = await getAnimals();

  // Keep only the serializable fields we need for the client
  const animals = (animalsRaw || []).map((a) => ({
    id: a.id,
    ear_tag: a.ear_tag,
    name: a.name || null,
  }));

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Health Record</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Manage health events for animal: {params.id}
      </p>

      {/* @ts-expect-error Server -> Client prop passthrough */}
      <HealthPageClient animals={animals} />
    </div>
  );
}
