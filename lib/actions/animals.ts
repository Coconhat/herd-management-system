"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Calving } from "../types";
import { BreedingRecord } from "../types";

export interface Animal {
  id: number;
  ear_tag: string;
  name?: string;
  birth_date?: string;
  sex?: "Male" | "Female";
  dam_id?: number;
  sire_id?: number;
  status: "Active" | "Sold" | "Deceased" | "Culled" | "Pregnant";
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  breed: string;
  calvings: Calving[];
  breeding_records: BreedingRecord[];
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
export async function getAnimalByEarTag(
  earTag: string
): Promise<Animal | null> {
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
    .eq("ear_tag", earTag)
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

  try {
    // 1) Delete calvings where this animal is the dam (calvings.animal_id)
    const { error: calvingError, data: deletedCalvings } = await supabase
      .from("calvings")
      .delete()
      .eq("animal_id", id)
      .eq("user_id", user.id)
      .select("id"); // return deleted ids for debugging

    if (calvingError) {
      console.error("Failed to delete calvings for animal:", calvingError);
      throw calvingError;
    }

    // 2) (Optional) Delete health_records for this animal
    const { error: healthError } = await supabase
      .from("health_records")
      .delete()
      .eq("animal_id", id)
      .eq("user_id", user.id);
    if (healthError) {
      console.error("Failed to delete health_records for animal:", healthError);
      throw healthError;
    }

    // 3) (Optional) Delete breeding_records for this animal
    const { error: breedingError } = await supabase
      .from("breeding_records")
      .delete()
      .eq("animal_id", id)
      .eq("user_id", user.id);
    if (breedingError) {
      console.error(
        "Failed to delete breeding_records for animal:",
        breedingError
      );
      throw breedingError;
    }

    // 4) Clear dam_id / sire_id from other animals that reference this animal
    const { error: clearDamError } = await supabase
      .from("animals")
      .update({ dam_id: null })
      .eq("dam_id", id)
      .eq("user_id", user.id);
    if (clearDamError) {
      console.error("Failed to clear dam_id refs:", clearDamError);
      throw clearDamError;
    }

    const { error: clearSireError } = await supabase
      .from("animals")
      .update({ sire_id: null })
      .eq("sire_id", id)
      .eq("user_id", user.id);
    if (clearSireError) {
      console.error("Failed to clear sire_id refs:", clearSireError);
      throw clearSireError;
    }

    // 5) Finally delete the animal itself
    const { error: animalError } = await supabase
      .from("animals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (animalError) {
      console.error("Error deleting animal:", animalError);
      throw animalError;
    }

    revalidatePath("/");
    return {
      deletedCalvings: deletedCalvings?.map((c: any) => c.id) ?? [],
      success: true,
    };
  } catch (err: any) {
    console.error("deleteAnimal failed:", err);
    throw new Error(
      err?.message || "Failed to delete animal and related records"
    );
  }
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

/**
 * Fetches all active animals and eagerly loads their breeding and calving records.
 * This is the primary data-fetching function for the Breeding Center page.
 * It provides all the necessary data for calculating statuses and displaying history.
 * @returns A promise that resolves to an array of Animal objects, each with its relations.
 */
export async function getAnimalsWithBreedingData(): Promise<Animal[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // The key is in the .select() statement.
  // It fetches all columns from `animals` (*), and for each animal,
  // it fetches all matching records from the `breeding_records` and `calvings` tables.
  const { data, error } = await supabase
    .from("animals")
    .select(
      `
      *,
      breeding_records ( * ),
      calvings ( * )
    `
    )
    .eq("user_id", user.id)
    .eq("status", "Active") // We typically only care about active animals for breeding
    .order("ear_tag", { ascending: true });

  if (error) {
    console.error("Error fetching animals with breeding data:", error);
    throw new Error("Could not load breeding data. Please try again.");
  }

  return data || [];
}
