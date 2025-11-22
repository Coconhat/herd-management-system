import { notFound } from "next/navigation";
import {
  getAnimalByEarTag,
  getAnimalById,
} from "@/lib/actions/animals";
import { getBreedingRecordsByAnimalId } from "@/lib/actions/breeding";
import { getCalvingsByAnimalId } from "@/lib/actions/calvings";
import { getHealthRecordsByAnimalId } from "@/lib/actions/health-records";
import { AnimalPrintSheet } from "@/components/animal-print-sheet";

interface AnimalPrintPageProps {
  params: {
    ear_tag: string;
  };
}

export default async function AnimalPrintPage({
  params,
}: AnimalPrintPageProps) {
  const animal = await getAnimalByEarTag(params.ear_tag);

  if (!animal) {
    notFound();
  }

  const [breedingRecords, calvings, healthRecords, dam, sire] = await Promise.all([
    getBreedingRecordsByAnimalId(animal.id),
    getCalvingsByAnimalId(animal.id),
    getHealthRecordsByAnimalId(animal.id),
    animal.dam_id ? getAnimalById(Number(animal.dam_id)) : Promise.resolve(null),
    animal.sire_id ? getAnimalById(Number(animal.sire_id)) : Promise.resolve(null),
  ]);

  const damLabel = dam
    ? `${dam.ear_tag}${dam.name ? ` (${dam.name})` : ""}`
    : animal.dam_id
    ? String(animal.dam_id)
    : null;
  const sireLabel = sire
    ? `${sire.ear_tag}${sire.name ? ` (${sire.name})` : ""}`
    : animal.sire_id
    ? String(animal.sire_id)
    : null;

  return (
    <AnimalPrintSheet
      animal={animal}
      breedingRecords={breedingRecords}
      calvings={calvings}
      healthRecords={healthRecords}
      damLabel={damLabel}
      sireLabel={sireLabel}
    />
  );
}
