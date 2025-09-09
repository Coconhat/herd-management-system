import { differenceInDays, parseISO } from "date-fns";
import { Animal, BreedingRecord, Calving } from "./types"; // Ensure Calving is imported from your types

export type CombinedStatus =
  | "Active" // Ready for breeding
  | "Pregnant" // Confirmed pregnant
  | "Fresh" // Calved within the last 30 days
  | "Empty" // Post-calving, past the "Fresh" period, in recovery
  | "Open" // Ready to breed after a prior cycle or being checked empty
  | "Awaiting PD Check"
  | "Check Due"
  | "Sold"
  | "Deceased"
  | "Culled";

export interface StatusInfo {
  status: CombinedStatus;
  label: string;
  variant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning";
  priority: number;
}

/**
 * Determines the combined, dynamic status of an animal.
 * It uses the nested 'calvings' and 'breeding_records' arrays from the Animal object.
 */
export function getCombinedStatus(animal: Animal): StatusInfo {
  // 1. Handle definitive, non-breeding statuses first. They have the highest priority.
  if (["Sold", "Deceased", "Culled"].includes(animal.status)) {
    return {
      status: animal.status as CombinedStatus,
      label: animal.status,
      variant: animal.status === "Deceased" ? "destructive" : "outline",
      priority: 0,
    };
  }

  const breedingRecords = (animal as any).breeding_records as
    | BreedingRecord[]
    | undefined;
  const calvings = (animal as any).calvings as Calving[] | undefined;

  // 2. Check for "Fresh" status. This is the next highest priority after definitive statuses.
  if (calvings && calvings.length > 0) {
    const recentCalving = calvings.sort(
      (a, b) =>
        new Date(b.calving_date).getTime() - new Date(a.calving_date).getTime()
    )[0];

    const daysSinceCalving = differenceInDays(
      new Date(),
      parseISO(recentCalving.calving_date)
    );

    // If calved within the last 30 days, display "Fresh".
    if (daysSinceCalving <= 30) {
      return {
        status: "Fresh",
        label: `Fresh (${daysSinceCalving}d)`,
        variant: "success",
        priority: 7, // Highest priority temporary status
      };
    }
  }

  // 3. If not Fresh, check for an ACTIVE breeding cycle.
  if (
    animal.sex === "Female" &&
    breedingRecords &&
    breedingRecords.length > 0
  ) {
    const recentBreeding = breedingRecords.sort(
      (a, b) =>
        new Date(b.breeding_date).getTime() -
        new Date(a.breeding_date).getTime()
    )[0];

    // An active cycle means the animal is pregnant or waiting for a check.
    const isActiveCycle =
      recentBreeding.confirmed_pregnant ||
      recentBreeding.pd_result === "Unchecked";

    if (isActiveCycle) {
      if (recentBreeding.confirmed_pregnant) {
        return {
          status: "Pregnant",
          label: "Pregnant",
          variant: "success",
          priority: 6,
        };
      }

      if (recentBreeding.pd_result === "Unchecked") {
        const checkDueDate = new Date(recentBreeding.pregnancy_check_due_date);
        const isOverdue = new Date() > checkDueDate;
        return {
          status: isOverdue ? "Check Due" : "Awaiting PD Check",
          label: isOverdue ? "Check Due" : "Awaiting PD Check",
          variant: isOverdue ? "warning" : "secondary",
          priority: 5,
        };
      }
    }
  }

  // 4. If no other dynamic status applies, fall back to the animal's base status from the DB.
  const statusMap: Record<string, StatusInfo> = {
    Active: {
      status: "Active",
      label: "Active",
      variant: "default",
      priority: 3,
    },
    Open: { status: "Open", label: "Open", variant: "outline", priority: 4 },
    // If the DB status is 'Fresh' but it's been over 30 days, we display it as 'Empty'.
    Fresh: {
      status: "Empty",
      label: "Empty",
      variant: "secondary",
      priority: 2,
    },
    Empty: {
      status: "Empty",
      label: "Empty",
      variant: "secondary",
      priority: 2,
    },
    Pregnant: {
      status: "Pregnant",
      label: "Pregnant",
      variant: "success",
      priority: 6,
    },
  };

  return (
    statusMap[animal.status] || {
      status: "Active",
      label: "Active",
      variant: "default",
      priority: 3,
    }
  );
}
