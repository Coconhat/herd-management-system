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
    pregnancy_check_due_date: addDays(breedingDate, 29).toISOString(),
    expected_calving_date: addDays(breedingDate, 283).toISOString(),
  };

  const { error } = await supabase
    .from("breeding_records")
    .insert(breedingData);

  if (error) {
    console.error("Error creating breeding record:", error);
    throw new Error("Failed to create the breeding record.");
  }

  try {
      await supabase.from("notifications").insert({
        user_id: user.id,
        animal_id: animalId,
        title: "Expected PD check soon",
        body: `Expected PD check for animal ${animalId} on ${breedingData.expected_calving_date}.`,
        scheduled_for: breedingData.expected_calving_date,
        created_at: new Date().toISOString(),
        read: false,
      });
    } catch (notifErr) {
      console.warn(
        "Could not create PD check notification (table may not exist):",
        notifErr
      );

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
// in your breeding actions file (server)
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

  // 1) Update the breeding_records pd_result/pregnancy_check_date first (and keep other fields for later)
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

  if (brError || !brData) {
    console.error("Error updating PD result (breeding_records):", brError);
    throw new Error("Failed to update pregnancy diagnosis result.");
  }

  const animalId = brData.animal_id;
  const breedingDateStr = brData.breeding_date;
  if (!animalId) {
    console.error("No animal_id returned from breeding_records update");
    throw new Error("Updated PD result but missing animal reference.");
  }

  // Branch: Pregnant
  if (result === "Pregnant") {
    const breedingDate = breedingDateStr
      ? parseISO(breedingDateStr)
      : new Date();
    const expectedCalving = addDays(breedingDate, 283)
      .toISOString()
      .split("T")[0];

    // Update animal to Pregnant and clear any post-PD helper dates on the breeding record
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

    // Clear post-PD helper dates on the breeding record (if any)
    const { error: brClearErr } = await supabase
      .from("breeding_records")
      .update({
        post_pd_treatment_due_date: null,
        keep_in_breeding_until: null,
        confirmed_pregnant: true,
      })
      .eq("id", breedingRecordId);

    if (brClearErr) {
      console.warn(
        "Failed to clear post-PD helper fields after Pregnant:",
        brClearErr
      );
      // non-fatal
    }

    // Attempt to create a notification/reminder for expected calving (non-fatal)
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
      console.warn(
        "Could not create calving notification (table may not exist):",
        notifErr
      );
    }
  } else {
    // Branch: Empty
    const reopenDate = addDays(new Date(), 60).toISOString().split("T")[0];
    const postPdDue = addDays(new Date(), 29).toISOString().split("T")[0];

    // Persist the post-PD helper dates to the breeding record
    const { error: brUpdateErr } = await supabase
      .from("breeding_records")
      .update({
        post_pd_treatment_due_date: postPdDue,
        keep_in_breeding_until: postPdDue,
        confirmed_pregnant: false,
      })
      .eq("id", breedingRecordId);

    if (brUpdateErr) {
      console.error(
        "Error updating breeding_record with post-PD dates:",
        brUpdateErr
      );
      // continue — not fatal
    }

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

  // Always revalidate affected pages so UI reflects the changes
  revalidatePath("/record/breeding", "layout");
  revalidatePath(`/animal/${animalId}`);
}

// for calendar

// Add this function to your breeding actions file

export async function getAllBreedingRecords(): Promise<BreedingRecord[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("breeding_records")
    .select(
      `
      *,
      animals (
        ear_tag,
        name
      )
    `
    )
    .eq("user_id", user.id)
    .order("breeding_date", { ascending: false });

  if (error) {
    console.error("Error fetching all breeding records:", error);
    return [];
  }
  return (data as BreedingRecord[]) || [];
}

export async function getBreedingRecordsWithAnimalInfo(): Promise<
  BreedingRecord[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data, error } = await supabase
    .from("breeding_records")
    .select(
      `
      *,
      animals (
        ear_tag,
        name
      )
    `
    )
    .eq("user_id", user.id)
    .order("expected_calving_date", { ascending: true });

  if (error) {
    console.error("Error fetching breeding records with animal info:", error);
    return [];
  }
  return (data as BreedingRecord[]) || [];
}
