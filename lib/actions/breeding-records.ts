"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export interface BreedingRecord {
  id: number
  animal_id: number
  breeding_date: string
  sire_ear_tag?: string
  breeding_method?: "Natural" | "AI"
  expected_calving_date?: string
  confirmed_pregnant?: boolean
  pregnancy_check_date?: string
  notes?: string
  user_id: string
  created_at: string
}

export async function getBreedingRecordsByAnimalId(animalId: number): Promise<BreedingRecord[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data, error } = await supabase
    .from("breeding_records")
    .select("*")
    .eq("animal_id", animalId)
    .order("breeding_date", { ascending: false })

  if (error) {
    console.error("Error fetching breeding records:", error)
    return []
  }

  return data || []
}

export async function createBreedingRecord(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const breedingData = {
    animal_id: Number.parseInt(formData.get("animal_id") as string),
    breeding_date: formData.get("breeding_date") as string,
    sire_ear_tag: (formData.get("sire_ear_tag") as string) || null,
    breeding_method: (formData.get("breeding_method") as "Natural" | "AI") || null,
    expected_calving_date: (formData.get("expected_calving_date") as string) || null,
    confirmed_pregnant: formData.get("confirmed_pregnant") === "on",
    pregnancy_check_date: (formData.get("pregnancy_check_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
    user_id: user.id,
  }

  const { error } = await supabase.from("breeding_records").insert(breedingData)

  if (error) {
    console.error("Error creating breeding record:", error)
    throw new Error("Failed to create breeding record")
  }

  revalidatePath(`/animal/${breedingData.animal_id}`)
  revalidatePath("/")
}
