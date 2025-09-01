"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, parseISO } from "date-fns";
import { BreedingRecord } from "../types";

export async function getBreedingRecordsByAnimalId(
  animalId: number
): Promise<BreedingRecord[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("breeding_records")
    .select("*")
    .eq("animal_id", animalId)
    .order("breeding_date", { ascending: false });

  if (error) {
    console.error("Error fetching breeding records:", error);
    return [];
  }
  return (data as BreedingRecord[]) || [];
}

/**
 * Creates a new breeding record and automatically schedules future checks.
 * This is the starting point of the entire reproductive cycle.
 * @param formData The form data from the "Record Breeding" modal.
 */
export async function createBreedingRecord(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const breedingDateStr = formData.get("breeding_date") as string;
  if (!breedingDateStr) {
    throw new Error("Breeding date is required.");
  }

  const breedingDate = parseISO(breedingDateStr);
  const animalId = Number(formData.get("animal_id"));

  const breedingData = {
    user_id: user.id,
    animal_id: animalId,
    sire_ear_tag: Number(formData.get("sire_ear_tag")) || null,
    breeding_date: breedingDate.toISOString(),
    breeding_method:
      (formData.get("breeding_method") as "Natural" | "AI") || null,
    notes: (formData.get("notes") as string) || null,

    // Set default status to 'Unchecked'
    pd_result: "Unchecked" as const,

    // Automatically calculate and set all future workflow dates
    heat_check_date: addDays(breedingDate, 21).toISOString(),
    pregnancy_check_due_date: addDays(breedingDate, 60).toISOString(),
    expected_calving_date: addDays(breedingDate, 283).toISOString(),
  };

  const { error } = await supabase
    .from("breeding_records")
    .insert(breedingData);

  if (error) {
    console.error("Error creating breeding record:", error);
    throw new Error("Failed to create the breeding record.");
  }

  // Refresh the UI to show the new record and update animal stages
  revalidatePath("/record/breeding", "layout");
  revalidatePath(`/animal/${animalId}`);
}

/**
 * Updates the result of a Pregnancy Diagnosis (PD).
 * This action is called from the "Action Dashboard" on the breeding page.
 * @param breedingRecordId The ID of the breeding_records entry to update.
 * @param result The outcome of the check: 'Pregnant' or 'Empty'.
 */
export async function updateBreedingPDResult(
  breedingRecordId: number,
  result: "Pregnant" | "Empty"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const checkDateISO = new Date().toISOString().split("T")[0];

  // 1) Update breeding_records
  const { data: brData, error: brError } = await supabase
    .from("breeding_records")
    .update({
      pd_result: result,
      pregnancy_check_date: checkDateISO,
    })
    .eq("id", breedingRecordId)
    .eq("user_id", user.id)
    .select("id, animal_id, breeding_date")
    .single();

  if (brError) {
    console.error("Error updating PD result (breeding_records):", brError);
    throw new Error("Failed to update pregnancy diagnosis result.");
  }

  const animalId = brData?.animal_id;
  const breedingDateStr = brData?.breeding_date;
  if (!animalId) {
    console.error("No animal_id returned from breeding_records update");
    throw new Error("Updated PD result but missing animal reference.");
  }

  // 2) Update animals depending on result
  if (result === "Pregnant") {
    const breedingDate = breedingDateStr
      ? parseISO(breedingDateStr)
      : new Date();
    const expectedCalving = addDays(breedingDate, 283)
      .toISOString()
      .split("T")[0];

    const { error: animalErr } = await supabase
      .from("animals")
      .update({
        status: "Pregnant",
        expected_calving_date: expectedCalving,
        reopen_date: null,
      })
      .eq("id", animalId);

    if (animalErr) {
      console.error("Error updating animal to Pregnant:", animalErr);
      throw new Error("Updated PD result but failed to update animal status.");
    }

    // 3) Attempt to create a notification/reminder for expected calving.
    // This is wrapped in try/catch so it won't fail if you don't have a notifications table.
    try {
      await supabase.from("notifications").insert({
        user_id: user.id,
        animal_id: animalId,
        title: "Expected calving soon",
        body: `Expected calving for animal ${animalId} on ${expectedCalving}.`,
        scheduled_for: expectedCalving,
        created_at: new Date().toISOString(),
        read: false,
      });
    } catch (notifErr) {
      // If you don't have a notifications table or insert fails, just log it — don't throw.
      console.warn(
        "Could not create calving notification (table may not exist):",
        notifErr
      );
    }
  } else {
    // Empty -> set status to 'Empty' and reopen_date 60 days from now
    const reopenDate = addDays(new Date(), 60).toISOString().split("T")[0];

    const { error: animalErr } = await supabase
      .from("animals")
      .update({
        status: "Empty",
        reopen_date: reopenDate,
        expected_calving_date: null,
      })
      .eq("id", animalId);

    if (animalErr) {
      console.error("Error updating animal after Empty:", animalErr);
      throw new Error("Failed to update animal after Empty result.");
    }
  }

  // Revalidate UI
  revalidatePath("/record/breeding", "layout");
  if (animalId) revalidatePath(`/animal/${animalId}`);
}
export { BreedingRecord };
