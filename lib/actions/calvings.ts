"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CalvingWithDetails = Calving & {
  animals: {
    ear_tag: string;
    name: string | null;
  } | null;
};

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

export async function createCalvingFromPregnancy(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");
  // --- 1. GATHER DATA FROM THE FORM ---
  const damId = Number(formData.get("animal_id"));
  const sireId = Number(formData.get("sire_ear_tag")) || null;
  const breedingRecordId = Number(formData.get("breeding_record_id"));
  const calvingDate = formData.get("calving_date") as string;
  const calfEarTag = formData.get("calf_ear_tag") as string;
  if (!damId || !breedingRecordId || !calvingDate || !calfEarTag) {
    throw new Error("Missing required information to record calving.");
  }
  // --- 2. CREATE THE CALF as a new animal ---
  const newAnimalData = {
    user_id: user.id,
    ear_tag: calfEarTag.trim(),
    name: (formData.get("calf_name") as string) || null,
    sex: formData.get("calf_sex") as "Male" | "Female",
    birth_date: calvingDate,
    dam_id: damId,
    sire_ear_tag: sireId,
    status: "Active" as const,
  };
  const { data: newAnimal, error: animalError } = await supabase
    .from("animals")
    .insert(newAnimalData)
    .select("id")
    .single();
  if (animalError) {
    console.error("Error creating new calf animal:", animalError);
    throw new Error(
      `Failed to create new calf in inventory: ${animalError.message}`
    );
  }
  // --- 3. CREATE THE CALVING event record ---
  const outcome = (formData.get("complications") as string) || "Live Birth";
  const calvingData = {
    user_id: user.id,
    animal_id: damId, // The mother
    breeding_id: breedingRecordId, // Link to the pregnancy record
    calving_date: calvingDate,
    calf_ear_tag: calfEarTag.trim(),
    calf_sex: newAnimalData.sex,
    birth_weight: Number(formData.get("birth_weight")) || null,
    complications: outcome === "Live Birth" ? null : outcome,
    assistance_required: outcome === "Assisted",
  };
  const { error: calvingError } = await supabase
    .from("calvings")
    .insert(calvingData);
  if (calvingError) {
    console.error("Error creating calving record:", calvingError);
    // You might want to delete the calf that was just created to avoid orphaned records.
    // await supabase.from('animals').delete().eq('id', newAnimal.id);
    throw new Error(`Failed to create calving event: ${calvingError.message}`);
  }
  // --- 4. (OPTIONAL BUT RECOMMENDED) UPDATE the original breeding record ---
  // This helps "close the loop" on the pregnancy. You could mark it as 'Completed'.
  // For now, we will leave it, as the presence of a linked calving record implies completion.
  // --- 5. REVALIDATE paths to refresh the UI ---
  revalidatePath("/record/breeding", "layout");
  revalidatePath(`/animal/${damId}`);
}

export async function getCalvingsWithDetails(): Promise<CalvingWithDetails[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("calvings")
    .select(
      `
            *,
            animals ( ear_tag, name )
        `
    )
    .eq("user_id", user.id)
    .order("calving_date", { ascending: false });

  if (error) {
    console.error("Error fetching detailed calvings:", error);
    return [];
  }

  return data as CalvingWithDetails[];
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
  const sireIdString = formData.get("sire_ear_tag") as string;
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
    // ✨ FIX: Convert the sireIdString from the form into a number or null.
    const sireId =
      sireIdString && sireIdString !== "none"
        ? Number.parseInt(sireIdString)
        : null;

    // Prepare the data for the new animal record in the 'animals' table.
    const newAnimalData = {
      ear_tag: calfEarTag.trim(),
      name: calfName?.trim() || null,
      sex: (formData.get("calf_sex") as "Male" | "Female") || null,
      birth_date: calvingDate,
      status: "Active" as const,
      dam_id: damId,
      sire_ear_tag: sireId, // ✨ FIX: Use the processed sireId variable here.
      notes: `Born from calving event #${newCalvingRecord.id}.`,
      user_id: user.id,
    };

    // Insert the new calf into the 'animals' table.
    const { error: animalError } = await supabase
      .from("animals")
      .insert(newAnimalData);

    if (animalError) {
      console.error("Error creating calf as a new animal:", animalError);
      throw new Error(
        "Calving event was recorded, but failed to add the new calf to the inventory. Please add it manually."
      );
    }
  }

  // --- Step 4: Revalidate paths to update the UI ---
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
