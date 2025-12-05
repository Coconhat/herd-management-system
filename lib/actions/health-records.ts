"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface HealthRecord {
  id: number;
  animal_id: number;
  record_date: string;
  record_type: string;
  description?: string;
  treatment?: string;
  veterinarian?: string;
  ml: number;
  medication?: string;
  notes?: string;
  user_id: string;
  created_at: string;
}

export async function getHealthRecordsByAnimalId(
  animalId: number
): Promise<HealthRecord[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("health_records")
    .select("*")
    .eq("animal_id", animalId)
    .order("record_date", { ascending: false });

  if (error) {
    console.error("Error fetching health records:", error);
    return [];
  }

  return data || [];
}

export async function createHealthRecord(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const healthData = {
    animal_id: Number.parseInt(formData.get("animal_id") as string),
    record_date: formData.get("record_date") as string,
    record_type: formData.get("record_type") as string,
    description: (formData.get("description") as string) || null,
    treatment: (formData.get("treatment") as string) || null,
    veterinarian: (formData.get("veterinarian") as string) || null,
    ml: Number.parseInt(formData.get("ml") as string),
    medication: (formData.get("medication") as string) || null,
    notes: (formData.get("notes") as string) || null,
    user_id: user.id,
  };

  const { error } = await supabase.from("health_records").insert(healthData);

  if (error) {
    console.error("Error creating health record:", error);
    throw new Error("Failed to create health record");
  }

  revalidatePath(`/`);
}
