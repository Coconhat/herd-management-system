import { Animal } from "./actions/animals";

type Variant = "default" | "secondary" | "destructive" | "outline";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MONTH_IN_DAYS = 30.4375;

export function getClassification(animal: Animal): {
  label: string;
  variant: Variant;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysUntilCalving = getDaysUntilExpectedCalving(animal, today);
  // Use pregnancy_status first, fall back to status for backward compatibility
  const normalizedStatus = (
    animal.pregnancy_status || animal.status
  )?.toLowerCase();

  if (normalizedStatus === "fresh") {
    return { label: "Milking", variant: "secondary" };
  }

  const isDryStage =
    normalizedStatus === "dry" ||
    (normalizedStatus === "pregnant" &&
      daysUntilCalving !== null &&
      daysUntilCalving <= 60 &&
      daysUntilCalving >= 0);

  if (isDryStage) {
    return { label: "Dry", variant: "destructive" };
  }

  if (!animal.birth_date) {
    return { label: "Unknown", variant: "outline" };
  }

  const birth = new Date(animal.birth_date);
  const ageInDays = Math.floor(
    (today.getTime() - birth.getTime()) / MS_PER_DAY
  );

  if (ageInDays < 0) {
    return { label: "Not Born Yet", variant: "outline" };
  }

  const ageInMonths = ageInDays / MONTH_IN_DAYS;

  if (ageInMonths <= 13) {
    return { label: "Nursery", variant: "outline" };
  }

  if (ageInMonths <= 15) {
    return { label: "Heifer", variant: "default" };
  }

  if (normalizedStatus === "pregnant") {
    return { label: "Pregnant Cow", variant: "secondary" };
  }

  return { label: "Adult Cow", variant: "default" };
}

function getDaysUntilExpectedCalving(
  animal: Animal,
  today: Date
): number | null {
  const records = animal.breeding_records || [];

  const futureCalvings = records
    .map((record) => record.expected_calving_date)
    .filter(Boolean)
    .map((dateString) => {
      const expected = new Date(dateString as string);
      return Math.ceil((expected.getTime() - today.getTime()) / MS_PER_DAY);
    })
    .filter((days) => !Number.isNaN(days));

  if (futureCalvings.length === 0) {
    return null;
  }

  const upcomingDays = futureCalvings.filter((days) => days >= 0);

  if (upcomingDays.length === 0) {
    return null;
  }

  return Math.min(...upcomingDays);
}
