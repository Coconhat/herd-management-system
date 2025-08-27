"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Calving } from "../types";

export interface Animal {
  id: number;
  ear_tag: string;
  name?: string;
  birth_date?: string;
  sex?: "Male" | "Female";
  dam_id?: number;
  sire_id?: number;
  status: "Active" | "Sold" | "Deceased" | "Culled";
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  calvings: Calving[];
}

export async function getAnimals(): Promise<Animal[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("animals")
    .select("*, calvings(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching animals:", error);
    return [];
  }

  return (data as Animal[]) || [];
}

export async function getAnimalById(id: number): Promise<Animal | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("animals")
    .select("*, calvings(*)")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching animal:", error);
    return null;
  }

  return data;
}

export async function createAnimal(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const animalData = {
    ear_tag: formData.get("ear_tag") as string,
    name: (formData.get("name") as string) || null,
    birth_date: (formData.get("birth_date") as string) || null,
    sex: (formData.get("sex") as "Male" | "Female") || null,
    dam_id: formData.get("dam_id")
      ? Number.parseInt(formData.get("dam_id") as string)
      : null,
    sire_id: formData.get("sire_id")
      ? Number.parseInt(formData.get("sire_id") as string)
      : null,
    status:
      (formData.get("status") as "Active" | "Sold" | "Deceased" | "Culled") ||
      "Active",
    notes: (formData.get("notes") as string) || null,
    user_id: user.id,
  };

  const { error } = await supabase.from("animals").insert(animalData);

  if (error) {
    console.error("Error creating animal:", error);
    throw new Error("Failed to create animal");
  }

  revalidatePath("/");
}

export async function updateAnimal(id: number, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const animalData = {
    ear_tag: formData.get("ear_tag") as string,
    name: (formData.get("name") as string) || null,
    birth_date: (formData.get("birth_date") as string) || null,
    sex: (formData.get("sex") as "Male" | "Female") || null,
    dam_id: formData.get("dam_id")
      ? Number.parseInt(formData.get("dam_id") as string)
      : null,
    sire_id: formData.get("sire_id")
      ? Number.parseInt(formData.get("sire_id") as string)
      : null,
    status:
      (formData.get("status") as "Active" | "Sold" | "Deceased" | "Culled") ||
      "Active",
    notes: (formData.get("notes") as string) || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("animals")
    .update(animalData)
    .eq("id", id);

  if (error) {
    console.error("Error updating animal:", error);
    throw new Error("Failed to update animal");
  }

  revalidatePath("/");
  revalidatePath(`/animal/${id}`);
}

export async function deleteAnimal(id: number) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { error } = await supabase.from("animals").delete().eq("id", id);

  if (error) {
    console.error("Error deleting animal:", error);
    throw new Error("Failed to delete animal");
  }

  revalidatePath("/");
}

export async function getAnimalStats() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Get total animals
  const { count: totalAnimals } = await supabase
    .from("animals")
    .select("*", { count: "exact", head: true })
    .eq("status", "Active");

  // Get female animals for breeding
  const { count: femaleAnimals } = await supabase
    .from("animals")
    .select("*", { count: "exact", head: true })
    .eq("status", "Active")
    .eq("sex", "Female");

  // Get recent calvings (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: recentCalvings } = await supabase
    .from("calvings")
    .select("*", { count: "exact", head: true })
    .gte("calving_date", thirtyDaysAgo.toISOString().split("T")[0]);

  // Get pregnant cows (confirmed pregnant in breeding records)
  const { count: pregnantCows } = await supabase
    .from("breeding_records")
    .select("*", { count: "exact", head: true })
    .eq("confirmed_pregnant", true);

  return {
    totalAnimals: totalAnimals || 0,
    femaleAnimals: femaleAnimals || 0,
    recentCalvings: recentCalvings || 0,
    pregnantCows: pregnantCows || 0,
  };
}

export async function getClassification(animals: Animal[]) {
  return animals.map((animal) => {
    if (animal.birth_date) {
      const age =
        new Date().getFullYear() - new Date(animal.birth_date).getFullYear();
      if (age < 1) return "Calf";
      if (age < 3) return "Heifer";
      return "Cow";
    }
    return "Unknown";
  });
}
