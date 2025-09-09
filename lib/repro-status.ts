// lib/repro-status.ts
import { differenceInDays, parseISO } from "date-fns";
import type { Animal } from "@/lib/actions/animals";
import type { Calving } from "@/lib/types";
import type { BreedingRecord } from "@/lib/types";

export type ReproVariant = "default" | "secondary" | "destructive" | "outline";

export interface ReproStatus {
  label: string;
  variant: ReproVariant;
  expected_calving_date?: string | null;
  days_until_due?: number | null;
  heat_check_date?: string | null;
  days_since_last_calving?: number | null;
  details?: Record<string, any>;
}

export function getReproStatus(
  animal: Animal,
  calvings: Calving[] = [],
  breedingRecords: BreedingRecord[] = []
): ReproStatus {
  if (!animal || animal.sex !== "Female")
    return { label: "N/A", variant: "outline" };

  const today = new Date();

  // last calving (if provided)
  const myCalvings = (calvings || []).filter(
    (c) => Number(c.animal_id) === Number(animal.id)
  );
  const lastCalving = myCalvings.length
    ? myCalvings
        .slice()
        .sort(
          (a, b) => +new Date(b.calving_date) - +new Date(a.calving_date)
        )[0]
    : null;
  const daysSinceLastCalving = lastCalving
    ? differenceInDays(today, parseISO(lastCalving.calving_date))
    : null;

  // breeding record priority
  const brs = (breedingRecords || []).filter(
    (b) => Number(b.animal_id) === Number(animal.id)
  );
  const activeBR = brs.length
    ? brs
        .slice()
        .sort(
          (a, b) => +new Date(b.breeding_date) - +new Date(a.breeding_date)
        )[0]
    : null;

  // Fresh (voluntary waiting period)
  if (daysSinceLastCalving !== null && daysSinceLastCalving <= 60) {
    return {
      label: "Fresh",
      variant: "default",
      days_since_last_calving: daysSinceLastCalving,
    };
  }

  if (activeBR) {
    // Returned-to-heat is an explicit signal that animal showed estrus again
    if (activeBR.returned_to_heat) {
      return {
        label: "Returned to heat",
        variant: "destructive",
        details: { breeding_record_id: activeBR.id },
      };
    }

    // Confirmed pregnant
    if (activeBR.confirmed_pregnant || activeBR.pd_result === "Pregnant") {
      const expected = activeBR.expected_calving_date || null;
      const daysUntil = expected
        ? differenceInDays(parseISO(expected), today)
        : null;
      return {
        label: "Pregnant",
        variant: "secondary",
        expected_calving_date: expected,
        days_until_due: daysUntil,
      };
    }

    // Heat check workflow
    if (activeBR.pd_result === "Unchecked") {
      const heatCheck =
        activeBR.heat_check_date || activeBR.pregnancy_check_due_date || null;
      if (heatCheck) {
        const heatDate = parseISO(heatCheck);
        const daysDiff = differenceInDays(heatDate, today);
        if (daysDiff <= 0) {
          return {
            label: "Heat check due",
            variant: "destructive",
            heat_check_date: heatCheck,
            details: { breeding_record_id: activeBR.id },
          };
        }
        return {
          label: "Pending PD",
          variant: "outline",
          heat_check_date: heatCheck,
          details: { breeding_record_id: activeBR.id },
        };
      }
      return {
        label: "Pending PD",
        variant: "outline",
        details: { breeding_record_id: activeBR.id },
      };
    }

    if (activeBR.pd_result === "Empty") {
      const emptySince = activeBR.breeding_date
        ? parseISO(activeBR.breeding_date)
        : parseISO(activeBR.pregnancy_check_due_date!); // fallback if no explicit PD date
      const daysEmpty = differenceInDays(today, emptySince);

      if (daysEmpty < 60) {
        return {
          label: "Empty",
          variant: "destructive",
          details: { days_empty: daysEmpty, breeding_record_id: activeBR.id },
        };
      } else {
        return {
          label: "Open",
          variant: "outline",
          details: { days_empty: daysEmpty },
        };
      }
    }
  }

  return {
    label: "Open",
    variant: "outline",
    days_since_last_calving: daysSinceLastCalving,
  };
}
