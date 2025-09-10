"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { MilkingRecord } from "../types";

export async function getMilkingRecords(
  animalId?: number
): Promise<MilkingRecord[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  let query = supabase
    .from("milking_records")
    .select("*")
    .order("milking_date", { ascending: false });

  if (animalId) {
    query = query.eq("animal_id", animalId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching milking records:", error);
    return [];
  }

  return data as MilkingRecord[];
}

export async function getAnimalWithMilkingRecords(animalId: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("animals")
    .select("*, milking_records(*)")
    .eq("id", animalId)
    .single();

  if (error) {
    console.error("Error fetching animal with milking records:", error);
    return null;
  }

  return data;
}

export async function getFemaleCattleWithMilkingRecords() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("animals")
    .select("*, milking_records(*), breeding_records(*), calvings(*)")
    .eq("sex", "Female")
    .neq("status", "Sold")
    .neq("status", "Deceased")
    .neq("status", "Culled")
    .order("ear_tag", { ascending: true });

  if (error) {
    console.error("Error fetching female cattle with milking records:", error);
    return [];
  }

  return data;
}

export async function addMilkingRecord(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Parse and validate the form data
  const animalId = parseInt(formData.get("animal_id") as string);
  const milkingDate = formData.get("milking_date") as string;

  // Optional fields may be empty
  const milkYield = formData.get("milk_yield")
    ? parseFloat(formData.get("milk_yield") as string)
    : null;

  const notes = formData.get("notes") as string;

  // Validate required fields
  if (!animalId || !milkingDate) {
    throw new Error("Animal ID and milking date are required");
  }

  // Validate milk yield is provided
  if (milkYield === null) {
    throw new Error("Milk yield must be provided");
  }

  const { data, error } = await supabase.from("milking_records").insert({
    animal_id: animalId,
    milking_date: milkingDate,
    milk_yield: milkYield,
    notes,
    user_id: user.id,
  });

  if (error) {
    console.error("Error creating milking record:", error);
    throw new Error("Failed to create milking record");
  }

  revalidatePath("/record/milking");
  return { success: true };
}

export async function updateMilkingRecord(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Parse and validate the form data
  const recordId = parseInt(formData.get("record_id") as string);
  const milkingDate = formData.get("milking_date") as string;

  // Optional fields may be empty
  const milkYield = formData.get("milk_yield")
    ? parseFloat(formData.get("milk_yield") as string)
    : null;

  const fatPercentage = formData.get("fat_percentage")
    ? parseFloat(formData.get("fat_percentage") as string)
    : null;

  const proteinPercentage = formData.get("protein_percentage")
    ? parseFloat(formData.get("protein_percentage") as string)
    : null;

  const somaticCellCount = formData.get("somatic_cell_count")
    ? parseInt(formData.get("somatic_cell_count") as string)
    : null;

  const notes = formData.get("notes") as string;

  // Validate required fields
  if (!recordId || !milkingDate) {
    throw new Error("Record ID and milking date are required");
  }

  // Check if milk yield is provided
  if (milkYield === null) {
    throw new Error("Milk yield must be provided");
  }

  const { data, error } = await supabase
    .from("milking_records")
    .update({
      milking_date: milkingDate,
      milk_yield: milkYield,
      fat_percentage: fatPercentage,
      protein_percentage: proteinPercentage,
      somatic_cell_count: somaticCellCount,
      notes,
    })
    .eq("id", recordId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating milking record:", error);
    throw new Error("Failed to update milking record");
  }

  revalidatePath("/record/milking");
  return { success: true };
}

export async function deleteMilkingRecord(recordId: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase
    .from("milking_records")
    .delete()
    .eq("id", recordId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting milking record:", error);
    throw new Error("Failed to delete milking record");
  }

  revalidatePath("/record/milking");
  return { success: true };
}
