import type {
  Animal,
  Calving,
  HealthRecord,
  BreedingRecord,
  AnimalWithDetails,
} from "./types";

export const mockAnimals: Animal[] = [
  {
    id: 1,
    ear_tag: "001",
    name: "Bessie",
    breed: "Holstein",
    birth_date: "2020-03-15",
    sex: "Female",
    status: "Active",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: 2,
    ear_tag: "002",
    name: "Daisy",
    breed: "Jersey",
    birth_date: "2019-05-22",
    sex: "Female",
    status: "Active",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: 3,
    ear_tag: "003",
    name: "Thunder",
    breed: "Angus",
    birth_date: "2018-08-10",
    sex: "Male",
    status: "Active",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: 4,
    ear_tag: "004",
    name: "Rosie",
    breed: "Holstein",
    birth_date: "2021-01-30",
    sex: "Female",
    status: "Active",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: 5,
    ear_tag: "005",
    name: "Bella",
    breed: "Hereford",
    birth_date: "2020-11-12",
    sex: "Female",
    status: "Active",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: 6,
    ear_tag: "006",
    name: "Duke",
    breed: "Charolais",
    birth_date: "2019-04-18",
    sex: "Male",
    status: "Active",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: 7,
    ear_tag: "007",
    name: "Luna",
    breed: "Jersey",
    birth_date: "2021-07-25",
    sex: "Female",
    status: "Active",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
  {
    id: 8,
    ear_tag: "008",
    name: "Max",
    breed: "Angus",
    birth_date: "2020-09-03",
    sex: "Male",
    status: "Active",
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
];

export const mockCalvings: Calving[] = [
  {
    id: 1,
    animal_id: 1,
    calving_date: "2023-03-20",
    calf_ear_tag: "101",
    calf_sex: "Female",
    birth_weight: 35.5,
    assistance_required: false,
    created_at: "2023-03-20T00:00:00Z",
  },
  {
    id: 2,
    animal_id: 2,
    calving_date: "2023-05-15",
    calf_ear_tag: "102",
    calf_sex: "Male",
    birth_weight: 38.2,
    assistance_required: false,
    created_at: "2023-05-15T00:00:00Z",
  },
  {
    id: 3,
    animal_id: 4,
    calving_date: "2023-01-10",
    calf_ear_tag: "103",
    calf_sex: "Female",
    birth_weight: 33.8,
    assistance_required: true,
    created_at: "2023-01-10T00:00:00Z",
  },
  {
    id: 4,
    animal_id: 5,
    calving_date: "2023-08-22",
    calf_ear_tag: "104",
    calf_sex: "Male",
    birth_weight: 40.1,
    assistance_required: false,
    created_at: "2023-08-22T00:00:00Z",
  },
  {
    id: 5,
    animal_id: 7,
    calving_date: "2023-06-30",
    calf_ear_tag: "105",
    calf_sex: "Female",
    birth_weight: 31.9,
    assistance_required: false,
    created_at: "2023-06-30T00:00:00Z",
  },
];

export const mockHealthRecords: HealthRecord[] = [
  {
    id: 1,
    animal_id: 1,
    record_date: "2023-04-01",
    record_type: "Vaccination",
    description: "Annual vaccination",
    treatment: "BVDV, IBR, PI3, BRSV",
    cost: 25.0,
    created_at: "2023-04-01T00:00:00Z",
  },
  {
    id: 2,
    animal_id: 2,
    record_date: "2023-03-15",
    record_type: "Health Check",
    description: "Routine health examination",
    treatment: "General checkup",
    cost: 50.0,
    created_at: "2023-03-15T00:00:00Z",
  },
  {
    id: 3,
    animal_id: 3,
    record_date: "2023-02-20",
    record_type: "Treatment",
    description: "Hoof trimming",
    treatment: "Preventive hoof care",
    cost: 35.0,
    created_at: "2023-02-20T00:00:00Z",
  },
  {
    id: 4,
    animal_id: 4,
    record_date: "2023-05-10",
    record_type: "Vaccination",
    description: "Pregnancy vaccination",
    treatment: "Scour prevention",
    cost: 30.0,
    created_at: "2023-05-10T00:00:00Z",
  },
];

export const mockBreedingRecords: BreedingRecord[] = [
  {
    id: 1,
    animal_id: 1,
    breeding_date: "2023-06-15",
    sire_ear_tag: "003",
    breeding_method: "Natural",
    expected_calving_date: "2024-03-22",
    confirmed_pregnant: true,
    created_at: "2023-06-15T00:00:00Z",
  },
  {
    id: 2,
    animal_id: 2,
    breeding_date: "2023-07-20",
    sire_ear_tag: "006",
    breeding_method: "AI",
    expected_calving_date: "2024-04-26",
    confirmed_pregnant: true,
    created_at: "2023-07-20T00:00:00Z",
  },
  {
    id: 3,
    animal_id: 4,
    breeding_date: "2023-08-10",
    sire_ear_tag: "003",
    breeding_method: "Natural",
    expected_calving_date: "2024-05-17",
    confirmed_pregnant: false,
    created_at: "2023-08-10T00:00:00Z",
  },
  {
    id: 4,
    animal_id: 7,
    breeding_date: "2023-09-05",
    sire_ear_tag: "008",
    breeding_method: "Natural",
    expected_calving_date: "2024-06-12",
    confirmed_pregnant: true,
    created_at: "2023-09-05T00:00:00Z",
  },
];

// Helper function to get animal with all related data
export function getAnimalWithDetails(
  animalId: number
): AnimalWithDetails | undefined {
  const animal = mockAnimals.find((a) => a.id === animalId);
  if (!animal) return undefined;

  return {
    ...animal,
    calvings: mockCalvings.filter((c) => c.animal_id === animalId),
    health_records: mockHealthRecords.filter((h) => h.animal_id === animalId),
    breeding_records: mockBreedingRecords.filter(
      (b) => b.animal_id === animalId
    ),
    dam: animal.dam_id
      ? mockAnimals.find((a) => a.id === animal.dam_id)
      : undefined,
    sire: animal.sire_id
      ? mockAnimals.find((a) => a.id === animal.sire_id)
      : undefined,
  };
}

// Helper function to get herd statistics
export function getHerdStats() {
  const isActiveAnimal = (a: any) =>
    !["Sold", "Deceased", "Culled"].includes(a.pregnancy_status || a.status);
  const totalAnimals = mockAnimals.filter(isActiveAnimal).length;
  const totalFemales = mockAnimals.filter(
    (a) => isActiveAnimal(a) && a.sex === "Female"
  ).length;
  const totalMales = mockAnimals.filter(
    (a) => isActiveAnimal(a) && a.sex === "Male"
  ).length;
  const totalCalvings = mockCalvings.length;
  const calvingsThisYear = mockCalvings.filter(
    (c) => new Date(c.calving_date).getFullYear() === new Date().getFullYear()
  ).length;
  const pregnantCows = mockBreedingRecords.filter(
    (b) => b.confirmed_pregnant === true
  ).length;

  return {
    totalAnimals,
    totalFemales,
    totalMales,
    totalCalvings,
    calvingsThisYear,
    pregnantCows,
  };
}
