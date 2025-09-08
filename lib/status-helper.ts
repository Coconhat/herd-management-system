import { Animal, BreedingRecord } from "./types";

export type CombinedStatus =
  | "Active" // Available for breeding
  | "Pregnant" // Confirmed pregnant from breeding records
  | "Empty" // Recently calved, in recovery period
  | "Open" // Available but not pregnant after breeding attempt
  | "Fresh" // Recently calved and producing milk
  | "Sold"
  | "Deceased"
  | "Culled"
  | "Unchecked"; // Bred but pregnancy status not confirmed

export interface StatusInfo {
  status: CombinedStatus;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline" | "success";
  priority: number; // For sorting/filtering
}

/**
 * Determines the combined status of an animal based on its base status
 * and most recent breeding record information
 */
export function getCombinedStatus(
  animal: Animal,
  breedingRecords?: BreedingRecord[]
): StatusInfo {
  // If animal has non-breeding status, return as-is
  if (["Sold", "Deceased", "Culled"].includes(animal.status)) {
    return {
      status: animal.status as CombinedStatus,
      label: animal.status,
      variant: animal.status === "Deceased" ? "destructive" : "outline",
      priority: 0,
    };
  }

  // For female animals, check breeding status
  if (animal.sex === "Female" && breedingRecords?.length) {
    // Get the most recent breeding record
    const recentBreeding = breedingRecords.sort(
      (a, b) =>
        new Date(b.breeding_date).getTime() -
        new Date(a.breeding_date).getTime()
    )[0];

    // If confirmed pregnant, show as pregnant regardless of base status
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

    // If recently bred but unchecked
    if (recentBreeding.pd_result === "Unchecked") {
      const daysSinceBreeding = Math.floor(
        (new Date().getTime() -
          new Date(recentBreeding.breeding_date).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // If past pregnancy check due date, show as needs checking
      if (daysSinceBreeding >= 60) {
        return {
          status: "Unchecked",
          label: "Check Due",
          variant: "destructive",
          priority: 6,
        };
      }

      return {
        status: "Unchecked",
        label: "Inseminated",
        variant: "secondary",
        priority: 4,
      };
    }

    // If confirmed empty after breeding attempt
    if (recentBreeding.pd_result === "Empty") {
      return {
        status: "Open",
        label: "Open",
        variant: "outline",
        priority: 3,
      };
    }
  }

  // Fall back to animal's base status
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
    Fresh: {
      status: "Fresh",
      label: "Fresh",
      variant: "success",
      priority: 1,
    },
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

/**
 * Helper to get just the status string
 */
export function getSimpleStatus(
  animal: Animal,
  breedingRecords?: BreedingRecord[]
): CombinedStatus {
  return getCombinedStatus(animal, breedingRecords).status;
}

/**
 * Filter animals by combined status
 */
export function filterAnimalsByStatus(
  animals: Animal[],
  breedingRecords: BreedingRecord[],
  targetStatus: CombinedStatus
): Animal[] {
  return animals.filter((animal) => {
    const animalBreedingRecords = breedingRecords.filter(
      (br) => br.animal_id === animal.id
    );
    const status = getCombinedStatus(animal, animalBreedingRecords);
    return status.status === targetStatus;
  });
}
