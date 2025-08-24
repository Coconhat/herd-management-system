"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export interface Calving {
  id: number
  animal_id: number
  calving_date: string
  calf_ear_tag?: string
  calf_sex?: "Male" | "Female"
  birth_weight?: number
  complications?: string
  assistance_required: boolean
  notes?: string
  user_id: string
  created_at: string
}

export async function getCalvingsByAnimalId(animalId: number): Promise<Calving[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data, error } = await supabase
    .from("calvings")
    .select("*")
    .eq("animal_id", animalId)
    .order("calving_date", { ascending: false })

  if (error) {
    console.error("Error fetching calvings:", error)
    return []
  }

  return data || []
}

export async function createCalving(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const calvingData = {
    animal_id: Number.parseInt(formData.get("animal_id") as string),
    calving_date: formData.get("calving_date") as string,
    calf_ear_tag: (formData.get("calf_ear_tag") as string) || null,
    calf_sex: (formData.get("calf_sex") as "Male" | "Female") || null,
    birth_weight: formData.get("birth_weight") ? Number.parseFloat(formData.get("birth_weight") as string) : null,
    complications: (formData.get("complications") as string) || null,
    assistance_required: formData.get("assistance_required") === "on",
    notes: (formData.get("notes") as string) || null,
    user_id: user.id,
  }

  const { error } = await supabase.from("calvings").insert(calvingData)

  if (error) {
    console.error("Error creating calving:", error)
    throw new Error("Failed to create calving record")
  }

  revalidatePath("/")
  revalidatePath(`/animal/${calvingData.animal_id}`)
}

export async function getPregnantAnimals() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  // Get animals that have confirmed pregnancies
  const { data, error } = await supabase
    .from("animals")
    .select(`
      id,
      ear_tag,
      name,
      breeding_records!inner(confirmed_pregnant)
    `)
    .eq("status", "Active")
    .eq("sex", "Female")
    .eq("breeding_records.confirmed_pregnant", true)

  if (error) {
    console.error("Error fetching pregnant animals:", error)
    return []
  }

  return data || []
}
