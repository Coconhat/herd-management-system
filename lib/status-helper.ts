// status-helper.ts
import {
  differenceInDays,
  parseISO,
  isValid,
  differenceInWeeks,
} from "date-fns";
import type { BreedingRecord, Calving } from "./types";
import type { Animal } from "./actions/animals";

// ============================================
// PREGNANCY STATUS
// Tracks reproductive cycle
// ============================================
export type PregnancyStatus =
  | "Open" // Ready for breeding
  | "Empty" // Recently bred/not pregnant, recovery period before can breed again
  | "Waiting for PD" // Bred but not yet confirmed for pregnancy
  | "Pregnant" // Confirmed pregnant
  | "Sold"
  | "Deceased"
  | "Culled";

// ============================================
// MILKING STATUS
// Tracks milk production capability
// ============================================
export type MilkingStatus =
  | "Milking" // Can be milked
  | "Dry"; // 7+ months pregnant, can't be milked

// ============================================
// STATUS INFO INTERFACES
// ============================================
export interface PregnancyStatusInfo {
  status: PregnancyStatus;
  label: string;
  variant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning";
  priority: number;
  details?: string;
}

export interface MilkingStatusInfo {
  status: MilkingStatus;
  label: string;
  variant:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning";
  weeksPregnant?: number;
}

export interface AnimalStatusInfo {
  pregnancy: PregnancyStatusInfo;
  milking: MilkingStatusInfo;
}

// Legacy types for backward compatibility
export type CombinedStatus = PregnancyStatus;
export type StatusInfo = PregnancyStatusInfo;

/**
 * Gets pregnancy-related information from breeding records
 */
function getPregnancyInfo(animal: Animal): {
  isPregnant: boolean;
  weeksPregnant: number;
  breedingRecord?: BreedingRecord;
  lastCalvingDate: Date | null;
  recentBreeding?: BreedingRecord;
} {
  const breedingRecords = (animal as any).breeding_records as
    | BreedingRecord[]
    | undefined;
  const calvings = (animal as any).calvings as Calving[] | undefined;

  // Find last calving date
  let lastCalvingDate: Date | null = null;
  if (calvings && calvings.length > 0) {
    const validCalvings = calvings
      .map((c) => {
        try {
          const d = parseISO(c.calving_date);
          return isValid(d) ? d : null;
        } catch {
          return null;
        }
      })
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime());

    if (validCalvings.length > 0) lastCalvingDate = validCalvings[0];
  }

  if (!breedingRecords || breedingRecords.length === 0) {
    return { isPregnant: false, weeksPregnant: 0, lastCalvingDate };
  }

  // Find relevant breeding records (after last calving)
  const relevantBreedingRecords = breedingRecords
    .filter((r) => {
      if (!r?.breeding_date) return false;
      try {
        const bd = parseISO(r.breeding_date);
        if (!isValid(bd)) return false;
        if (lastCalvingDate) return bd.getTime() > lastCalvingDate.getTime();
        return true;
      } catch {
        return false;
      }
    })
    .sort(
      (a, b) =>
        new Date(b.breeding_date).getTime() -
        new Date(a.breeding_date).getTime()
    );

  if (relevantBreedingRecords.length === 0) {
    return { isPregnant: false, weeksPregnant: 0, lastCalvingDate };
  }

  const recentBreeding = relevantBreedingRecords[0];
  const isPregnant =
    recentBreeding.confirmed_pregnant ||
    recentBreeding.pd_result === "Pregnant";

  let weeksPregnant = 0;
  if (isPregnant) {
    try {
      const breedingDate = parseISO(recentBreeding.breeding_date);
      if (isValid(breedingDate)) {
        weeksPregnant = differenceInWeeks(new Date(), breedingDate);
      }
    } catch {
      // ignore
    }
  }

  return {
    isPregnant,
    weeksPregnant,
    breedingRecord: recentBreeding,
    lastCalvingDate,
    recentBreeding,
  };
}

/**
 * Determines the PREGNANCY STATUS of an animal
 *
 * - Open: Ready for breeding
 * - Empty: Recently bred/not pregnant, in recovery
 * - Waiting for PD: Bred but awaiting pregnancy confirmation
 * - Pregnant: Confirmed pregnant
 */
export function getPregnancyStatus(animal: Animal): PregnancyStatusInfo {
  // Handle non-breeding statuses first
  // Check pregnancy_status first (new field), fall back to status (legacy field)
  const dbStatus =
    (animal.pregnancy_status && animal.pregnancy_status.trim()) ||
    (animal.status && animal.status.trim()) ||
    "";

  if (["Sold", "Deceased", "Culled"].includes(dbStatus)) {
    return {
      status: dbStatus as PregnancyStatus,
      label: dbStatus,
      variant: dbStatus === "Deceased" ? "destructive" : "outline",
      priority: 0,
    };
  }

  // If pregnancy_status is explicitly set to a known value, use it
  if (
    ["Pregnant", "Open", "Empty", "Waiting for PD", "Dry"].includes(dbStatus)
  ) {
    const statusMap: Record<string, PregnancyStatusInfo> = {
      Pregnant: {
        status: "Pregnant",
        label: "Pregnant",
        variant: "success",
        priority: 6,
      },
      "Waiting for PD": {
        status: "Waiting for PD",
        label: "Waiting for PD",
        variant: "warning",
        priority: 4,
      },
      Empty: {
        status: "Empty",
        label: "Empty",
        variant: "secondary",
        priority: 2,
      },
      Open: {
        status: "Open",
        label: "Open",
        variant: "outline",
        priority: 3,
      },
      Dry: {
        status: "Open",
        label: "Dry",
        variant: "outline",
        priority: 3,
      },
    };

    if (statusMap[dbStatus]) {
      return statusMap[dbStatus];
    }
  }

  // Only females have pregnancy status tracking
  if (animal.sex !== "Female") {
    return {
      status: "Open",
      label: "N/A",
      variant: "default",
      priority: 0,
    };
  }

  const pregnancyInfo = getPregnancyInfo(animal);

  // Check if recently calved (within 30 days) - considered "Empty" (recovery)
  if (pregnancyInfo.lastCalvingDate) {
    const daysSinceCalving = differenceInDays(
      new Date(),
      pregnancyInfo.lastCalvingDate
    );
    if (daysSinceCalving <= 30) {
      return {
        status: "Empty",
        label: "Empty",
        variant: "secondary",
        priority: 2,
        details: `Fresh - ${daysSinceCalving}d since calving`,
      };
    }
  }

  // Check breeding records for active cycle
  if (pregnancyInfo.recentBreeding) {
    const recentBreeding = pregnancyInfo.recentBreeding;

    // Confirmed Pregnant
    if (
      recentBreeding.confirmed_pregnant ||
      recentBreeding.pd_result === "Pregnant"
    ) {
      return {
        status: "Pregnant",
        label: "Pregnant",
        variant: "success",
        priority: 6,
        details: `${pregnancyInfo.weeksPregnant} weeks`,
      };
    }

    // Waiting for PD (bred but not confirmed)
    if (recentBreeding.pd_result === "Unchecked") {
      return {
        status: "Waiting for PD",
        label: "Waiting for PD",
        variant: "warning",
        priority: 4,
      };
    }

    // Empty (pd_result is "Empty" - not pregnant after check)
    if (recentBreeding.pd_result === "Empty") {
      return {
        status: "Empty",
        label: "Empty",
        variant: "secondary",
        priority: 2,
        details: "Not pregnant - recovery period",
      };
    }
  }

  // Default to Open (ready for breeding)
  return {
    status: "Open",
    label: "Open",
    variant: "outline",
    priority: 3,
  };
}

/**
 * Determines the MILKING STATUS of an animal
 *
 * Smart Hybrid Logic:
 * - Respects manual "Dry" setting only if animal is still pregnant
 * - Auto-resets after calving (fresh cows can be milked)
 * - Falls back to auto-calculation if no manual setting
 */
export function getMilkingStatus(animal: Animal): MilkingStatusInfo {
  // Only females can be milked
  if (animal.sex !== "Female") {
    return {
      status: "Dry",
      label: "N/A",
      variant: "default",
    };
  }

  const pregnancyInfo = getPregnancyInfo(animal);
  const dbMilkingStatus = animal.milking_status?.trim();

  // Check if recently calved (within 60 days) - auto-reset to Milking
  // Fresh cows should be milked regardless of previous manual "Dry" setting
  if (pregnancyInfo.lastCalvingDate) {
    const daysSinceCalving = differenceInDays(
      new Date(),
      pregnancyInfo.lastCalvingDate
    );
    // If calved recently and not pregnant again, they should be milking
    if (daysSinceCalving <= 60 && !pregnancyInfo.isPregnant) {
      return {
        status: "Milking",
        label: "Milking",
        variant: "success",
      };
    }
  }

  // Respect manual "Dry" only if animal is still pregnant
  // This prevents stale "Dry" status after calving
  if (dbMilkingStatus === "Dry" && pregnancyInfo.isPregnant) {
    return {
      status: "Dry",
      label: "Dry",
      variant: "warning",
      weeksPregnant: pregnancyInfo.weeksPregnant,
    };
  }

  // Respect manual "Milking" setting
  if (dbMilkingStatus === "Milking") {
    return {
      status: "Milking",
      label: "Milking",
      variant: "success",
    };
  }

  // Auto-calculate: If pregnant and 30+ weeks, animal should be dry
  if (pregnancyInfo.isPregnant && pregnancyInfo.weeksPregnant >= 30) {
    return {
      status: "Dry",
      label: "Dry",
      variant: "warning",
      weeksPregnant: pregnancyInfo.weeksPregnant,
    };
  }

  // Default: animal can be milked
  return {
    status: "Milking",
    label: "Milking",
    variant: "success",
  };
}

/**
 * Gets both pregnancy and milking status for an animal
 */
export function getAnimalStatus(animal: Animal): AnimalStatusInfo {
  return {
    pregnancy: getPregnancyStatus(animal),
    milking: getMilkingStatus(animal),
  };
}

/**
 * Legacy function for backward compatibility
 * Returns the pregnancy status in the old format
 */
export function getCombinedStatus(animal: Animal): StatusInfo {
  return getPregnancyStatus(animal);
}

/**
 * Check if an animal is dry (7+ months pregnant)
 */
export function isDryAnimal(animal: Animal): {
  isDry: boolean;
  weeksPregnant?: number;
} {
  const milkingStatus = getMilkingStatus(animal);
  return {
    isDry: milkingStatus.status === "Dry",
    weeksPregnant: milkingStatus.weeksPregnant,
  };
}
