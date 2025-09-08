import { Animal, BreedingRecord } from "./types";

export type CombinedStatus =
  | "Active" // Ready for breeding
  | "Pregnant" // Confirmed pregnant
  | "Empty" // Post-calving, in recovery (not ready to breed)
  | "Open" // Ready to breed after a prior cycle or being checked empty
  | "Awaiting PD Check" // Bred, but pregnancy status is not yet confirmed
  | "Check Due" // The window to check for pregnancy has passed
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
  priority: number; // For sorting/filtering
}

/**
 * Determines the combined, dynamic status of an animal based on its base status
 * and its most recent, active breeding record.
 */
export function getCombinedStatus(
  animal: Animal,
  breedingRecords?: BreedingRecord[]
): StatusInfo {
  // 1. Handle definitive, non-breeding statuses first.
  if (["Sold", "Deceased", "Culled"].includes(animal.status)) {
    return {
      status: animal.status as CombinedStatus,
      label: animal.status,
      variant: animal.status === "Deceased" ? "destructive" : "outline",
      priority: 0,
    };
  }

  // 2. For female animals, check for an ACTIVE breeding cycle that overrides the base status.
  if (animal.sex === "Female" && breedingRecords?.length) {
    const recentBreeding = breedingRecords.sort(
      (a, b) =>
        new Date(b.breeding_date).getTime() -
        new Date(a.breeding_date).getTime()
    )[0];

    // **THE CRITICAL FIX IS HERE:**
    // We only proceed if the most recent breeding cycle is genuinely active.
    // An active cycle is one that is either confirmed pregnant or is awaiting a diagnosis.
    // A record with `pd_result: 'Empty'` is a COMPLETED cycle, so we should ignore it here
    // and let the function fall back to the animal's base status (e.g., 'Open').
    const isActiveCycle =
      recentBreeding &&
      (recentBreeding.confirmed_pregnant ||
        recentBreeding.pd_result === "Unchecked");

    if (isActiveCycle) {
      // If confirmed pregnant, this is the highest priority status.
      if (
        recentBreeding.confirmed_pregnant &&
        recentBreeding.pd_result === "Pregnant"
      ) {
        return {
          status: "Pregnant",
          label: "Pregnant",
          variant: "success",
          priority: 5,
        };
      }

      // If bred but awaiting diagnosis.
      if (recentBreeding.pd_result === "Unchecked") {
        const checkDueDate = new Date(recentBreeding.pregnancy_check_due_date);
        const today = new Date();

        // If the check is overdue.
        if (today > checkDueDate) {
          return {
            status: "Check Due",
            label: "Check Due",
            variant: "warning", // Changed to warning for better UI feedback
            priority: 6,
          };
        }

        // If awaiting check and not yet due.
        return {
          status: "Awaiting PD Check",
          label: "Awaiting PD Check",
          variant: "secondary",
          priority: 4,
        };
      }
    }
  }

  // 3. If there's no active breeding cycle, fall back to the animal's base status.
  // This now works correctly for post-calving animals whose status is "Empty".
  const statusMap: Record<string, StatusInfo> = {
    Active: {
      status: "Active",
      label: "Active",
      variant: "default",
      priority: 2,
    },
    Empty: {
      status: "Empty",
      label: "Empty",
      variant: "secondary",
      priority: 1,
    },
    // The "Fresh" status from your original file was removed for simplicity, as "Empty" covers the post-calving period. ADD THIS BACK
    Open: {
      status: "Open",
      label: "Open",
      variant: "outline",
      priority: 3,
    },
    Pregnant: {
      status: "Pregnant",
      label: "Pregnant",
      variant: "success",
      priority: 5,
    },
  };

  return (
    statusMap[animal.status] || {
      status: "Active",
      label: "Active",
      variant: "default",
      priority: 2,
    }
  );
}

export function getSimpleStatus(
  animal: Animal,
  breedingRecords?: BreedingRecord[]
): CombinedStatus {
  return getCombinedStatus(animal, breedingRecords).status;
}

export function filterAnimalsByStatus(
  animals: Animal[],
  targetStatus: CombinedStatus
): Animal[] {
  // This helper assumes breeding records are already nested in each animal object.
  return animals.filter((animal) => {
    const statusInfo = getCombinedStatus(
      animal,
      (animal as any).breeding_records
    );
    return statusInfo.status === targetStatus;
  });
}
