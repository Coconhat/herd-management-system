"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface Calving {
  id: number;
  animal_id: number;
  calving_date: string;
  calf_ear_tag?: string;
  calf_sex?: "Male" | "Female";
  birth_weight?: number;
  complications?: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

export async function getCalvingsByAnimalId(
  animalId: number
): Promise<Calving[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("calvings")
    .select("*")
    .eq("animal_id", animalId)
    .order("calving_date", { ascending: false });

  if (error) {
    console.error("Error fetching calvings:", error);
    return [];
  }

  return data || [];
}

export async function createCalving(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // --- Step 1: Extract all necessary data from the form ---
  const damId = Number.parseInt(formData.get("animal_id") as string);
  const calvingDate = formData.get("calving_date") as string;
  const calfEarTag = formData.get("calf_ear_tag") as string | null;
  const calfName = formData.get("calf_name") as string | null;

  // --- Step 2: Create the calving event record (your existing logic) ---
  const calvingData = {
    animal_id: damId,
    calving_date: calvingDate,
    calf_ear_tag: calfEarTag,
    calf_sex: (formData.get("calf_sex") as "Male" | "Female") || null,
    birth_weight: formData.get("birth_weight")
      ? Number.parseFloat(formData.get("birth_weight") as string)
      : null,
    complications: (formData.get("complications") as string) || null,
    notes: (formData.get("notes") as string) || null,
    user_id: user.id,
  };

  // Insert the calving record and use .select().single() to get the ID of the new record.
  // This is useful for creating a note in the new animal's record.
  const { data: newCalvingRecord, error: calvingError } = await supabase
    .from("calvings")
    .insert(calvingData)
    .select("id")
    .single();

  if (calvingError) {
    console.error("Error creating calving event:", calvingError);
    throw new Error("Failed to create calving record");
  }

  // --- Step 3: Conditionally create the calf as a new animal ---
  // This block only runs IF the user entered an ear tag for the calf.
  if (calfEarTag && calfEarTag.trim() !== "") {
    // Prepare the data for the new animal record in the 'animals' table.
    const newAnimalData = {
      ear_tag: calfEarTag.trim(),
      name: calfName?.trim() || null,
      sex: (formData.get("calf_sex") as "Male" | "Female") || null,
      birth_date: calvingDate, // The calf's birth date is the calving date
      status: "Active" as const, // New calves are active by default
      dam_id: damId, // The mother (dam) is the animal selected in the form
      sire_id: null, // Sire is unknown from this form
      notes: `Born from calving event #${newCalvingRecord.id}.`, // Adds a useful, traceable note
      user_id: user.id,
    };

    // Insert the new calf into the 'animals' table.
    const { error: animalError } = await supabase
      .from("animals")
      .insert(newAnimalData);

    if (animalError) {
      console.error("Error creating calf as a new animal:", animalError);
      // IMPORTANT: Even if this fails, the calving was recorded. We throw a specific error.
      throw new Error(
        "Calving event was recorded, but failed to add the new calf to the inventory. Please add it manually."
      );
    }
  }

  // --- Step 4: Revalidate paths to update the UI ---
  // Revalidating the root path will refresh the main animal inventory table.
  revalidatePath("/");
  revalidatePath(`/animal/${calvingData.animal_id}`);
}

export async function getPregnantAnimals() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Get animals that have confirmed pregnancies
  const { data, error } = await supabase
    .from("animals")
    .select(
      `
      id,
      ear_tag,
      name,
      breeding_records!inner(confirmed_pregnant)
    `
    )
    .eq("status", "Active")
    .eq("sex", "Female")
    .eq("breeding_records.confirmed_pregnant", true);

  if (error) {
    console.error("Error fetching pregnant animals:", error);
    return [];
  }

  return data || [];
}
