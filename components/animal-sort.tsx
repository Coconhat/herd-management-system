"use client";

import React, { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, Filter } from "lucide-react";
import { Animal } from "@/lib/actions/animals";
import { getClassification } from "@/lib/get-classification";
import { getCombinedStatus, getMilkingStatus } from "@/lib/status-helper";

// Primary sort categories
export type SortCategory =
  | "default"
  | "classification"
  | "sex"
  | "pregnancy_status"
  | "milking_status"
  | "age";

// Sub-sort options for each category
export type SubSortOption = string;

export interface SortConfig {
  category: SortCategory;
  subOption: SubSortOption;
}

// Sub-options for each category
const SUB_OPTIONS: Record<SortCategory, { value: string; label: string }[]> = {
  default: [
    { value: "asc", label: "A → Z" },
    { value: "desc", label: "Z → A" },
  ],
  classification: [
    { value: "all", label: "All (Default Order)" },
    { value: "Pregnant Cow", label: "Pregnant Cows First" },
    { value: "Dry", label: "Dry Cows First" },
    { value: "Milking", label: "Milking First" },
    { value: "Adult Cow", label: "Adult Cows First" },
    { value: "Heifer", label: "Heifers First" },
    { value: "Nursery", label: "Nursery First" },
  ],
  sex: [
    { value: "female_first", label: "Female First" },
    { value: "male_first", label: "Male First" },
  ],
  pregnancy_status: [
    { value: "all", label: "All (Default Order)" },
    { value: "Pregnant", label: "Pregnant First" },
    { value: "Waiting for PD", label: "Waiting for PD First" },
    { value: "Empty", label: "Empty First" },
    { value: "Open", label: "Open First" },
  ],
  milking_status: [
    { value: "all", label: "All (Default Order)" },
    { value: "Milking", label: "Milking First" },
    { value: "Dry", label: "Dry First" },
    { value: "N/A", label: "N/A First" },
  ],
  age: [
    { value: "youngest", label: "Youngest First" },
    { value: "oldest", label: "Oldest First" },
  ],
};

interface AnimalSortProps {
  value: SortConfig;
  onChange: (value: SortConfig) => void;
  className?: string;
}

export function AnimalSort({ value, onChange, className }: AnimalSortProps) {
  const subOptions = SUB_OPTIONS[value.category] || [];

  const handleCategoryChange = (newCategory: SortCategory) => {
    // Set default sub-option for the new category
    const defaultSubOption = SUB_OPTIONS[newCategory]?.[0]?.value || "all";
    onChange({ category: newCategory, subOption: defaultSubOption });
  };

  const handleSubOptionChange = (newSubOption: string) => {
    onChange({ ...value, subOption: newSubOption });
  };

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <ArrowUpDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />

      {/* Primary Sort Category */}
      <Select
        value={value.category}
        onValueChange={(v) => handleCategoryChange(v as SortCategory)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Sort by..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Ear Tag</SelectItem>
          <SelectItem value="classification">Classification</SelectItem>
          <SelectItem value="sex">Gender</SelectItem>
          <SelectItem value="pregnancy_status">Pregnancy</SelectItem>
          <SelectItem value="milking_status">Milking</SelectItem>
          <SelectItem value="age">Age</SelectItem>
        </SelectContent>
      </Select>

      {/* Secondary Sub-Option */}
      {subOptions.length > 0 && (
        <Select value={value.subOption} onValueChange={handleSubOptionChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Option..." />
          </SelectTrigger>
          <SelectContent>
            {subOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

// Default sort config
export const DEFAULT_SORT_CONFIG: SortConfig = {
  category: "default",
  subOption: "asc",
};

// Classification priority order (default)
const CLASSIFICATION_ORDER: Record<string, number> = {
  "Pregnant Cow": 1,
  Dry: 2,
  Milking: 3,
  "Adult Cow": 4,
  Heifer: 5,
  Nursery: 6,
  "Not Born Yet": 7,
  Unknown: 8,
};

// Pregnancy status priority order (default)
const PREGNANCY_STATUS_ORDER: Record<string, number> = {
  Pregnant: 1,
  "Waiting for PD": 2,
  Empty: 3,
  Open: 4,
  Sold: 5,
  Deceased: 6,
  Culled: 7,
};

// Milking status priority order (default)
const MILKING_STATUS_ORDER: Record<string, number> = {
  Milking: 1,
  Dry: 2,
  "N/A": 3,
  Nursery: 4,
};

/**
 * Calculate age in days from birth date
 */
function getAgeInDays(animal: Animal): number {
  if (!animal.birth_date) return Infinity;
  const birth = new Date(animal.birth_date);
  const today = new Date();
  return Math.floor(
    (today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Sort animals by the specified config
 */
export function sortAnimals(animals: Animal[], config: SortConfig): Animal[] {
  const sorted = [...animals];
  const { category, subOption } = config;

  switch (category) {
    case "default":
      // Sort by ear tag
      return sorted.sort((a, b) => {
        const cmp = (a.ear_tag || "").localeCompare(
          b.ear_tag || "",
          undefined,
          { numeric: true }
        );
        return subOption === "desc" ? -cmp : cmp;
      });

    case "classification":
      return sorted.sort((a, b) => {
        const classA = getClassification(a).label;
        const classB = getClassification(b).label;

        if (subOption !== "all") {
          // Specific classification first
          const aIsTarget = classA === subOption;
          const bIsTarget = classB === subOption;
          if (aIsTarget && !bIsTarget) return -1;
          if (!aIsTarget && bIsTarget) return 1;
        }

        // Then by default order
        const orderA = CLASSIFICATION_ORDER[classA] ?? 99;
        const orderB = CLASSIFICATION_ORDER[classB] ?? 99;
        if (orderA !== orderB) return orderA - orderB;

        return (a.ear_tag || "").localeCompare(b.ear_tag || "", undefined, {
          numeric: true,
        });
      });

    case "sex":
      return sorted.sort((a, b) => {
        const aIsFemale = a.sex === "Female";
        const bIsFemale = b.sex === "Female";

        if (subOption === "female_first") {
          if (aIsFemale && !bIsFemale) return -1;
          if (!aIsFemale && bIsFemale) return 1;
        } else {
          // male_first
          if (!aIsFemale && bIsFemale) return -1;
          if (aIsFemale && !bIsFemale) return 1;
        }

        return (a.ear_tag || "").localeCompare(b.ear_tag || "", undefined, {
          numeric: true,
        });
      });

    case "pregnancy_status":
      return sorted.sort((a, b) => {
        const statusA = getCombinedStatus(a).status;
        const statusB = getCombinedStatus(b).status;

        if (subOption !== "all") {
          // Specific status first
          const aIsTarget = statusA === subOption;
          const bIsTarget = statusB === subOption;
          if (aIsTarget && !bIsTarget) return -1;
          if (!aIsTarget && bIsTarget) return 1;
        }

        // Then by default order
        const orderA = PREGNANCY_STATUS_ORDER[statusA] ?? 99;
        const orderB = PREGNANCY_STATUS_ORDER[statusB] ?? 99;
        if (orderA !== orderB) return orderA - orderB;

        return (a.ear_tag || "").localeCompare(b.ear_tag || "", undefined, {
          numeric: true,
        });
      });

    case "milking_status":
      return sorted.sort((a, b) => {
        const milkA = getMilkingStatus(a).status;
        const milkB = getMilkingStatus(b).status;

        if (subOption !== "all") {
          // Specific status first
          const aIsTarget = milkA === subOption;
          const bIsTarget = milkB === subOption;
          if (aIsTarget && !bIsTarget) return -1;
          if (!aIsTarget && bIsTarget) return 1;
        }

        // Then by default order
        const orderA = MILKING_STATUS_ORDER[milkA] ?? 99;
        const orderB = MILKING_STATUS_ORDER[milkB] ?? 99;
        if (orderA !== orderB) return orderA - orderB;

        return (a.ear_tag || "").localeCompare(b.ear_tag || "", undefined, {
          numeric: true,
        });
      });

    case "age":
      return sorted.sort((a, b) => {
        const ageA = getAgeInDays(a);
        const ageB = getAgeInDays(b);

        // Handle unknown ages
        if (ageA === Infinity && ageB === Infinity) return 0;
        if (ageA === Infinity) return 1;
        if (ageB === Infinity) return -1;

        if (subOption === "youngest") {
          if (ageA !== ageB) return ageA - ageB;
        } else {
          // oldest
          if (ageA !== ageB) return ageB - ageA;
        }

        return (a.ear_tag || "").localeCompare(b.ear_tag || "", undefined, {
          numeric: true,
        });
      });

    default:
      return sorted;
  }
}
