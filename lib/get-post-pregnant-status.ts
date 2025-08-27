import type { Animal } from "@/lib/actions/animals";
import type { Calving } from "@/lib/types";

type ManualPregStatus = "Pregnant" | "Empty" | "Open" | null;

export function getPostPregnantStatus(
  animal: Animal,
  calvings: Calving[] = [], // default to empty array
  manualStatus: ManualPregStatus = null
): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  // Manual override first
  if (manualStatus) {
    switch (manualStatus) {
      case "Pregnant":
        return { label: "Pregnant", variant: "default" };
      case "Empty":
        return { label: "Empty", variant: "destructive" };
      case "Open":
        return { label: "Open", variant: "outline" };
    }
  }

  if (animal.sex !== "Female") {
    return { label: "N/A", variant: "outline" };
  }

  // coerce to numbers to avoid "string vs number" mismatch
  const animalCalvings = (calvings || []).filter(
    (c) => Number(c.animal_id) === Number(animal.id)
  );

  if (animalCalvings.length === 0) {
    return { label: "Open", variant: "outline" };
  }

  const latest = animalCalvings
    .slice()
    .sort((a, b) => +new Date(b.calving_date) - +new Date(a.calving_date))[0];

  const calvingDate = new Date(latest.calving_date);
  if (isNaN(calvingDate.getTime())) {
    console.error("Invalid calving_date for calving:", latest);
    return { label: "Open", variant: "outline" };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const today = new Date();
  const daysSince = Math.floor(
    (today.getTime() - calvingDate.getTime()) / msPerDay
  );

  if (daysSince >= 0 && daysSince <= 48)
    return { label: "Fresh", variant: "default" };
  if (daysSince >= 49 && daysSince <= 365)
    return { label: "Heat Detection", variant: "destructive" };

  return { label: "Open", variant: "outline" };
}
