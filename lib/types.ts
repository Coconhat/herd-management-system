export interface Animal {
  id: number;
  ear_tag: string;
  name?: string;
  breed?: string;
  birth_date?: string;
  sex?: "Male" | "Female";
  dam_id?: number;
  sire_id?: number;
  status: "Active" | "Sold" | "Deceased" | "Culled";
  notes?: string;
  created_at: string;
  updated_at: string;
}

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

export interface BreedingRecord {
  id: number;
  animal_id: number;
  breeding_date: string;
  sire_ear_tag?: string;
  breeding_method: "Natural" | "AI";
  expected_calving_date?: string;
  confirmed_pregnant?: boolean;
  pregnancy_check_date?: string;
  notes?: string;
  created_at: string;
}

export interface AnimalWithDetails extends Animal {
  calvings?: Calving[];
  health_records?: HealthRecord[];
  breeding_records?: BreedingRecord[];
  dam?: Animal;
  sire?: Animal;
}
