// status-helper.ts
import { differenceInDays, parseISO, isValid } from "date-fns";
import type { BreedingRecord, Calving } from "./types";
import type { Animal } from "./actions/animals";

export type CombinedStatus =
  | "Pregnant"
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
