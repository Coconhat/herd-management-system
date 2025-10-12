import { Animal } from "./actions/animals";

export interface BreedingRecord {
  id: number;
  animal_id: number;
  breeding_date: string;
  sire_ear_tag?: string;
  breeding_method?: "Natural" | "AI";
  notes?: string;
  user_id: string;
  created_at: string;

  pd_result: "Pregnant" | "Empty" | "Unchecked";

  // Automatically calculated dates for reminders and workflow
  heat_check_date: string; // Approx. 21 days after breeding
  pregnancy_check_due_date: string; // Approx. 29 days after breeding
  expected_calving_date: string; // Approx. 283 days after breeding

  // Helper dates for post-PD workflow (added when pd_result is "Empty")
  post_pd_treatment_due_date?: string | null; // 29 days after marking Empty
  keep_in_breeding_until?: string | null; // Date to keep record visible in breeding history
  pregnancy_check_date?: string | null; // Actual date when PD check was performed

  // The final boolean status, derived from pd_result for easy querying
  confirmed_pregnant: boolean;

  // Extended fields added in components (not in database)
  dam_id?: number;
  dam_ear_tag?: string;
  dam_name?: string;
}

/**
 * Fetches all breeding records for a specific animal.
 * @param animalId The numeric ID of the animal.
 * @returns A promise that resolves to an array of BreedingRecord objects.
 */
export interface Calving {
  id: number;
  animal_id: number;
  calving_date: string;
  calf_ear_tag?: string;
  calf_sex?: "Male" | "Female";
  birth_weight?: number;
  complications?: string;
  notes?: string;
  created_at: string;
}

export interface HealthRecord {
  id: number;
  animal_id: number;
  record_date: string;
  record_type: string;
  description?: string;
  treatment?: string;
  veterinarian?: string;
  cost?: number;
  notes?: string;
  created_at: string;
}

export interface MilkingRecord {
  id: number;
  animal_id: number;
  milking_date: string;
  milk_yield?: number;
  notes?: string;
  created_at: string;
}

export interface AnimalWithDetails extends Animal {
  calvings?: Calving[];
  health_records?: HealthRecord[];
  breeding_records?: BreedingRecord[];
  milking_records?: MilkingRecord[];
  dam?: Animal;
  sire?: Animal;
  getClassification?: (animal: Animal) => {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  };
}
