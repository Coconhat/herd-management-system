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
  weight?: number;
  health?: "Healthy" | "Unhealthy" | null;
  sex?: "Male" | "Female";
  dam_id?: number;
  sire_id?: number;
  farm_source?: string | null;
  // Legacy status field (kept for backward compatibility)
  status:
    | "Active"
    | "Sold"
    | "Deceased"
    | "Culled"
    | "Pregnant"
    | "Fresh"
    | "Open"
    | "Empty"
    | "Dry";
  // New dual status system
  pregnancy_status?:
    | "Open" // Ready for breeding
    | "Empty" // Recently bred, can't breed yet
    | "Waiting for PD" // Bred but not yet confirmed
    | "Pregnant" // Confirmed pregnant
    | "Sold"
    | "Deceased"
    | "Culled";
  milking_status?:
    | "Milking" // Can be milked
    | "Dry"; // 7+ months pregnant, can't be milked
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
    .select(
      `
      *,
      calvings ( * ),
      breeding_records ( * )
    `
    )
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

  const rawHealth = formData.get("health");
  const health: "Healthy" | "Unhealthy" =
    typeof rawHealth === "string" && rawHealth.trim().length > 0
      ? (rawHealth.trim() as "Healthy" | "Unhealthy")
      : "Healthy";

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
    farm_source:
      formData.get("farm_source") &&
      (formData.get("farm_source") as string).trim() !== ""
        ? (formData.get("farm_source") as string).trim()
        : null,
    status:
      (formData.get("status") as
        | "Active"
        | "Sold"
        | "Deceased"
        | "Culled"
        | "Empty"
        | "Dry") || "Active",
    notes: (formData.get("notes") as string) || null,
    user_id: user.id,
    health,
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

  const rawHealth = formData.get("health");
  let health: "Healthy" | "Unhealthy" | null | undefined = undefined;
  if (typeof rawHealth === "string") {
    const trimmed = rawHealth.trim();
    health = trimmed.length > 0 ? (trimmed as "Healthy" | "Unhealthy") : null;
  }

  // Get pregnancy_status (or fall back to status for backward compatibility)
  const pregnancyStatusValue =
    (formData.get("pregnancy_status") as string) ||
    (formData.get("status") as string) ||
    "Open";

  // Get weight value
  const weightValue = formData.get("weight");
  const weight = weightValue && weightValue !== "" ? Number(weightValue) : null;

  const animalData: {
    ear_tag: string;
    name: string | null;
    birth_date: string | null;
    sex: "Male" | "Female" | null;
    dam_id: number | null;
    sire_id: number | null;
    farm_source: string | null;
    pregnancy_status: string;
    milking_status: string | null;
    weight: number | null;
    notes: string | null;
    updated_at: string;
    health?: "Healthy" | "Unhealthy" | null;
  } = {
    ear_tag: formData.get("ear_tag") as string,
    name: (formData.get("name") as string) || null,
    birth_date: (formData.get("birth_date") as string) || null,
    sex: (formData.get("sex") as "Male" | "Female") || null,
    dam_id:
      formData.get("dam_id") &&
      formData.get("dam_id") !== "" &&
      formData.get("dam_id") !== "none"
        ? Number.parseInt(formData.get("dam_id") as string)
        : null,
    sire_id:
      formData.get("sire_id") &&
      formData.get("sire_id") !== "" &&
      formData.get("sire_id") !== "none"
        ? Number.parseInt(formData.get("sire_id") as string)
        : null,
    farm_source:
      formData.get("farm_source") &&
      (formData.get("farm_source") as string).trim() !== ""
        ? (formData.get("farm_source") as string).trim()
        : null,
    pregnancy_status: pregnancyStatusValue,
    milking_status: formData.get("milking_status") as string,
    weight: weight,
    notes: (formData.get("notes") as string) || null,
    updated_at: new Date().toISOString(),
  };

  if (health !== undefined) {
    animalData.health = health;
  }

  // Debug logging
  console.log("Updating animal with data:", animalData);

  const { data, error } = await supabase
    .from("animals")
    .update(animalData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) {
    console.error("Error updating animal:", error);
    throw new Error("Failed to update animal");
  }

  console.log("Animal updated successfully:", data);

  revalidatePath("/");
  revalidatePath("/inventory/animals");
  revalidatePath(`/animal/${animalData.ear_tag}`);
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
    .select("*", { count: "exact", head: true });

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
    .from("animals")
    .select("*", { count: "exact", head: true })
    .eq("status", "Pregnant");

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
    .in("status", ["Active", "Empty", "Pregnant", "Open"]) // Include Active, Empty, Open, and Pregnant animals for breeding management
    .order("ear_tag", { ascending: true });

  if (error) {
    console.error("Error fetching animals with breeding data:", error);
    throw new Error("Could not load breeding data. Please try again.");
  }

  return data || [];
}

export async function setAnimalHealth(
  id: number,
  health: "Healthy" | "Unhealthy"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { error } = await supabase
    .from("animals")
    .update({ health })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error)
    throw new Error("Failed to update health status: " + error.message);
  revalidatePath("/");
  revalidatePath("/inventory/animals");
}

export async function updateAnimalNotes(id: number, notes: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { error } = await supabase
    .from("animals")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error("Failed to update notes: " + error.message);

  revalidatePath("/");
  revalidatePath("/inventory/animals");
}
