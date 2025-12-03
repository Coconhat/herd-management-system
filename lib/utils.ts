import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { BreedingRecord } from "./types";
import { addDays, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function validateEarTag(earTag: string): boolean {
  return earTag.trim().length > 0 && /^[A-Za-z0-9]+$/.test(earTag.trim());
}

export function formatWeight(weight: number | string): string {
  if (!weight) return "N/A";
  const numWeight =
    typeof weight === "string" ? Number.parseFloat(weight) : weight;
  return isNaN(numWeight) ? "N/A" : `${numWeight.toFixed(1)} kgs`;
}

export function calculateAge(birthDate: string): {
  years: number;
  months: number;
} {
  if (!birthDate) return { years: 0, months: 0 };

  const birth = new Date(birthDate);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months };
}

export function formatAge(birthDate: string): string {
  const { years, months } = calculateAge(birthDate);

  if (years === 0 && months === 0) return "Less than 1 month";
  if (years === 0) return `${months} mo${months !== 1 ? "s" : ""}`;
  if (months === 0) return `${years} yr${years !== 1 ? "s" : ""}`;

  return `${years} yr${years !== 1 ? "s" : ""}, ${months} mo${
    months !== 1 ? "s" : ""
  }`;
}

// helper for pregnancy check due date (prefer stored value, else +29)
export function getPregnancyCheckDueDate(rec: BreedingRecord) {
  if (rec.pregnancy_check_due_date) {
    try {
      return parseISO(rec.pregnancy_check_due_date);
    } catch {
      /* fallthrough */
    }
  }
  try {
    return addDays(parseISO(rec.breeding_date), 29);
  } catch {
    return null;
  }
}
