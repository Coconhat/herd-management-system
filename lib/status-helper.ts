// status-helper.ts
import {
  differenceInDays,
  parseISO,
  isValid,
  differenceInWeeks,
} from "date-fns";
import type { BreedingRecord, Calving } from "./types";
import type { Animal } from "./actions/animals";

export type CombinedStatus =
  | "Pregnant"
  | "Dry"
  | "Fresh"
  | "Empty"
  | "Open"
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
 * Checks if an animal should be considered "dry" (7+ months pregnant)
 * Returns breeding record if animal is dry, null otherwise
 */
function getDryStatusInfo(animal: Animal): {
  isDry: boolean;
  breedingRecord?: BreedingRecord;
  weeksPregnant?: number;
} {
  if (animal.sex !== "Female") return { isDry: false };

  const breedingRecords = (animal as any).breeding_records as
    | BreedingRecord[]
    | undefined;
  const calvings = (animal as any).calvings as Calving[] | undefined;

  if (!breedingRecords || breedingRecords.length === 0) return { isDry: false };

  // Find last calving date to filter relevant breeding records
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

  if (relevantBreedingRecords.length === 0) return { isDry: false };

  const recentBreeding = relevantBreedingRecords[0];

  // Check if animal is confirmed pregnant or has positive PD result
  const isPregnant =
    recentBreeding.confirmed_pregnant ||
    recentBreeding.pd_result === "Pregnant";

  if (!isPregnant) return { isDry: false };

  // Calculate weeks since breeding
  try {
    const breedingDate = parseISO(recentBreeding.breeding_date);
    if (!isValid(breedingDate)) return { isDry: false };

    const weeksPregnant = differenceInWeeks(new Date(), breedingDate);

    // Dry period starts at 30 weeks (approximately 7 months)
    const isDry = weeksPregnant >= 30;

    return {
      isDry,
      breedingRecord: isDry ? recentBreeding : undefined,
      weeksPregnant: isDry ? weeksPregnant : undefined,
    };
  } catch {
    return { isDry: false };
  }
}

/**
 * Determines the combined, dynamic status of an animal.
 * Uses nested arrays on the animal object if available:
 *   - animal.breeding_records?: BreedingRecord[]
 *   - animal.calvings?: Calving[]
 *
 * Important behavior:
 *  - Empty/blank DB status is normalized to "Empty"
 *  - Breeding records that occurred on or before the most recent calving are ignored
 *    (so old breedings do not incorrectly mark an animal as "Awaiting PD Check")
 */
export function getCombinedStatus(animal: Animal): StatusInfo {
  // Defensive normalization of the base DB status (empty string -> "Empty")
  const normalizedStatus = (animal.status && animal.status.trim()) || "Empty";

  // 1) Immediate non-breeding statuses
  if (["Sold", "Deceased", "Culled"].includes(normalizedStatus)) {
    return {
      status: normalizedStatus as CombinedStatus,
      label: normalizedStatus,
      variant: normalizedStatus === "Deceased" ? "destructive" : "outline",
      priority: 0,
    };
  }

  const breedingRecords = (animal as any).breeding_records as
    | BreedingRecord[]
    | undefined;
  const calvings = (animal as any).calvings as Calving[] | undefined;

  // Determine last calving date (if any) so we ignore breedings prior to it
  let lastCalvingDate: Date | null = null;
  if (calvings && calvings.length > 0) {
    // sort desc and take the most recent valid calving_date
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

  // 2) Fresh status (calved within 30d)
  if (lastCalvingDate) {
    const daysSinceLastCalving = differenceInDays(new Date(), lastCalvingDate);
    if (daysSinceLastCalving <= 30) {
      return {
        status: "Fresh",
        label: `Fresh (${daysSinceLastCalving}d)`,
        variant: "success",
        priority: 7,
      };
    }
  }

  // 3) Active breeding cycle detection (for females)
  if (
    animal.sex === "Female" &&
    breedingRecords &&
    breedingRecords.length > 0
  ) {
    // Filter to only breeding records that happened AFTER the last calving (if a last calving exists)
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

    if (relevantBreedingRecords.length > 0) {
      const recentBreeding = relevantBreedingRecords[0];

      const isActiveCycle =
        Boolean(recentBreeding.confirmed_pregnant) ||
        recentBreeding.pd_result === "Unchecked";

      if (isActiveCycle) {
        if (
          recentBreeding.confirmed_pregnant ||
          recentBreeding.pd_result === "Pregnant"
        ) {
          // Check if animal should be dry (7+ months pregnant)
          const dryInfo = getDryStatusInfo(animal);
          if (dryInfo.isDry) {
            return {
              status: "Dry",
              label: `Dry (${dryInfo.weeksPregnant}w pregnant)`,
              variant: "warning",
              priority: 7,
            };
          }

          return {
            status: "Pregnant",
            label: "Pregnant",
            variant: "success",
            priority: 6,
          };
        }

        if (recentBreeding.pd_result === "Unchecked") {
          const checkDueRaw = recentBreeding.pregnancy_check_due_date;
          try {
            const checkDue = checkDueRaw ? parseISO(checkDueRaw) : null;
            const today = new Date();
            if (checkDue && isValid(checkDue) && today > checkDue) {
              return {
                status: "Check Due",
                label: "Check Due",
                variant: "warning",
                priority: 5,
              };
            }
          } catch {
            /* date parse failed — fallthrough to Awaiting PD Check */
          }

          return {
            status: "Awaiting PD Check",
            label: "Awaiting PD Check",
            variant: "secondary",
            priority: 4,
          };
        }
      }
    }
  }

  // 4) Fall back to DB status mapping
  const statusMap: Record<string, StatusInfo> = {
    Active: {
      status: "Active",
      label: "Active",
      variant: "default",
      priority: 3,
    },
    Open: { status: "Open", label: "Open", variant: "outline", priority: 4 },
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
    Dry: {
      status: "Dry",
      label: "Dry",
      variant: "warning",
      priority: 7,
    },
  };

  return (
    statusMap[normalizedStatus] || {
      status: "Active",
      label: "Active",
      variant: "default",
      priority: 3,
    }
  );
}

/**
 * Export function to check if an animal is dry (for use in other components)
 */
export function isDryAnimal(animal: Animal): {
  isDry: boolean;
  weeksPregnant?: number;
} {
  const dryInfo = getDryStatusInfo(animal);
  return {
    isDry: dryInfo.isDry,
    weeksPregnant: dryInfo.weeksPregnant,
  };
}
