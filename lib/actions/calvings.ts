"use server";

import { createClient } from "@/lib/supabase/server";
import { addDays, parseISO } from "date-fns";
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
  assistance_required?: boolean | null;
  sire_id?: string | null;
  breeding_id?: string | null;
  notes?: string;
  health?: "Healthy" | "Unhealthy" | null;
  user_id: string;
  created_at: string;
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function resolveSireIdentifiers({
  supabase,
  userId,
  rawInput,
}: {
  supabase: SupabaseClient;
  userId: string;
  rawInput?: string | null;
}): Promise<{ earTag: string | null; animalId: number | null }> {
  const normalized = rawInput?.trim() ?? "";

  if (!normalized || normalized.toLowerCase() === "none") {
    return { earTag: null, animalId: null };
  }

  const numericCandidate = Number(normalized);
  if (!Number.isNaN(numericCandidate)) {
    const { data: byId, error: byIdError } = await supabase
      .from("animals")
      .select("id, ear_tag")
      .eq("id", numericCandidate)
      .eq("user_id", userId)
      .limit(1);

    if (byIdError) {
      console.error("Error resolving sire by id:", byIdError);
    }

    if (byId && byId.length > 0) {
      return { earTag: byId[0].ear_tag, animalId: byId[0].id };
    }
  }

  const { data: byTag, error: byTagError } = await supabase
    .from("animals")
    .select("id, ear_tag")
    .eq("ear_tag", normalized)
    .eq("user_id", userId)
    .limit(1);

  if (byTagError) {
    console.error("Error resolving sire by ear tag:", byTagError);
  }

  if (byTag && byTag.length > 0) {
    return { earTag: byTag[0].ear_tag, animalId: byTag[0].id };
  }

  return { earTag: normalized, animalId: null };
}

export async function createCalvingFromPregnancy(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const farmSourceRaw = formData.get("calf_farm_source");
  const farmSource =
    typeof farmSourceRaw === "string" && farmSourceRaw.trim() !== ""
      ? farmSourceRaw.trim()
      : null;
  const damId = Number(formData.get("animal_id"));
  const breedingRecordId = Number(formData.get("breeding_record_id"));
  const calvingDateStr = formData.get("calving_date") as string;
  const calfEarTag = (formData.get("calf_ear_tag") as string) || "";
  const calfName = (formData.get("calf_name") as string) || null;
  const calfSex = (formData.get("calf_sex") as "Male" | "Female") || null;
  const birthWeight = formData.get("birth_weight")
    ? Number(formData.get("birth_weight"))
    : null;
  const rawComplications = (formData.get("complications") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const rawSireInput = (formData.get("sire_ear_tag") as string) || "";
  const healthRaw = formData.get("health");
  const health =
    typeof healthRaw === "string" && healthRaw.length > 0
      ? (healthRaw as "Healthy" | "Unhealthy")
      : null;
  if (!damId || !breedingRecordId || !calvingDateStr) {
    throw new Error("Missing required information to record calving.");
  }

  const assistanceRequired = rawComplications === "Assisted";
  const complicationsValue =
    rawComplications && rawComplications !== "Live Birth"
      ? rawComplications
      : null;
  const initialSireResolution = await resolveSireIdentifiers({
    supabase,
    userId: user.id,
    rawInput: rawSireInput,
  });

  let resolvedSireEarTag = initialSireResolution.earTag;
  let resolvedSireAnimalId = initialSireResolution.animalId;

  if (!resolvedSireEarTag) {
    const { data: breedingRecord, error: breedingLookupError } = await supabase
      .from("breeding_records")
      .select("sire_ear_tag")
      .eq("id", breedingRecordId)
      .eq("user_id", user.id)
      .single();

    if (breedingLookupError) {
      console.error(
        "Error fetching breeding record for sire fallback:",
        breedingLookupError
      );
    } else if (breedingRecord?.sire_ear_tag) {
      const fallbackResolution = await resolveSireIdentifiers({
        supabase,
        userId: user.id,
        rawInput: breedingRecord.sire_ear_tag,
      });

      resolvedSireEarTag = fallbackResolution.earTag;
      resolvedSireAnimalId = fallbackResolution.animalId;
    }
  }

  // Step 1: insert calving record
  const calvingData = {
    user_id: user.id,
    animal_id: damId,
    breeding_id: breedingRecordId.toString(),
    calving_date: calvingDateStr,
    calf_ear_tag: calfEarTag ? calfEarTag.trim() : null,
    calf_sex: calfSex,
    birth_weight: birthWeight,
    complications: complicationsValue,
    assistance_required: assistanceRequired,
    sire_id: resolvedSireEarTag,
    notes,
    health,
  };

  const { data: newCalving, error: calvingError } = await supabase
    .from("calvings")
    .insert(calvingData)
    .select("id")
    .single();

  if (calvingError) {
    console.error("Error creating calving record:", calvingError);
    throw new Error(`Failed to create calving event: ${calvingError.message}`);
  }

  // Step 2: optionally create the calf as a new animal (when ear tag provided)
  if (calfEarTag && calfEarTag.trim() !== "") {
    const newAnimalData = {
      user_id: user.id,
      farm_source: farmSource,
      ear_tag: calfEarTag.trim(),
      name: calfName?.trim() || null,
      sex: calfSex || null,
      birth_date: calvingDateStr,
      dam_id: damId,
      dam_fk_id: damId,
      sire_id: resolvedSireAnimalId,
      sire_fk_id: resolvedSireAnimalId,
      notes: `Born from calving event #${newCalving.id}`,
      status: "Active" as const,
      health: health ?? "Healthy",
    };

    const { error: animalError } = await supabase
      .from("animals")
      .insert(newAnimalData);
    if (animalError) {
      console.error("Error creating calf animal:", animalError);
      // Do not abort the entire operation — calving is recorded, but surface the error.
      throw new Error(
        "Calving recorded but failed to create calf in inventory."
      );
    }
  }

  // Step 3: update the dam's status to Empty and set reopen_date = calving_date + 60 days
  let reopenDateIso: string | null = null;
  try {
    const calvingDate = parseISO(calvingDateStr);
    const reopenDate = addDays(calvingDate, 60);
    reopenDateIso = reopenDate.toISOString().split("T")[0];
  } catch (err) {
    // fallback to now + 60 days if parsing fails (shouldn't normally)
    reopenDateIso = addDays(new Date(), 60).toISOString().split("T")[0];
  }

  const { error: updateAnimalErr } = await supabase
    .from("animals")
    .update({
      status: "Empty",
      reopen_date: reopenDateIso,
      expected_calving_date: null,
    })
    .eq("id", damId);

  if (updateAnimalErr) {
    console.error("Error updating dam after calving:", updateAnimalErr);
    throw new Error("Calving recorded but failed to update dam status.");
  }

  // Step 4: create BOTH email and in-app notification for breeding reopen
  try {
    const animalInfo = await supabase
      .from("animals")
      .select("ear_tag, name")
      .eq("id", damId)
      .single();

    const animalName = animalInfo.data
      ? `${animalInfo.data.ear_tag}${
          animalInfo.data.name ? " (" + animalInfo.data.name + ")" : ""
        }`
      : `Animal #${damId}`;

    const reopenDate = new Date(reopenDateIso);
    // Set to 7 AM Philippine Time (UTC+8)
    reopenDate.setHours(7 - 8, 0, 0, 0); // 7 AM PHT = -1 AM UTC

    const notificationData = {
      user_id: user.id,
      animal_id: damId,
      title: `Ready for Breeding: ${animalName}`,
      body: `<p><strong>${animalName}</strong> will be available for breeding again.</p>
             <p><strong>Reopen Date:</strong> ${new Date(
               reopenDateIso
             ).toLocaleDateString()}</p>
             <p>The voluntary waiting period has ended. The animal can now be bred.</p>`,
      scheduled_for: reopenDate.toISOString(),
      sent: false,
      read: false,
      metadata: {
        from: "DH-MAGPANTAY-FARM@resend.dev",
        type: "reopen_breeding",
        calving_id: newCalving.id,
        dam_id: damId,
      },
    };

    // Insert EMAIL notification (will trigger email sending)
    await supabase.from("notifications").insert({
      ...notificationData,
      channel: "email",
    });

    // Insert IN-APP notification (for /notifications page)
    await supabase.from("notifications").insert({
      ...notificationData,
      channel: "in_app",
      sent: true, // Not applicable for in-app
    });
  } catch (notifErr) {
    // If notifications table missing or insert fails, just log and continue.
    console.warn("Failed to create reopen notification (non-fatal):", notifErr);
  }

  // Step 5: Mark the breeding record as no longer pregnant after calving
  const { error: breedingUpdateErr } = await supabase
    .from("breeding_records")
    .update({
      confirmed_pregnant: false, // No longer pregnant after calving
      pd_result: "Empty", // Reset pregnancy diagnosis result
    })
    .eq("id", breedingRecordId);

  if (breedingUpdateErr) {
    console.error(
      "Error updating breeding record after calving:",
      breedingUpdateErr
    );
    // Non-fatal error, continue with the process
    console.warn("Breeding record may still show as active after calving");
  }

  // Step 6: revalidate UI paths
  revalidatePath("/"); // adjust as needed
  revalidatePath(`/animal/${damId}`);
  revalidatePath("/record/breeding", "layout");
  revalidatePath("/pregnancy");

  return { calvingId: newCalving.id, reopenDate: reopenDateIso };
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
  const rawSireInput = (formData.get("sire_ear_tag") as string) || "";
  const farmSourceRaw =
    formData.get("calf_farm_source") ?? formData.get("farm_source");
  const calvingDate = formData.get("calving_date") as string;
  const calfEarTag = formData.get("calf_ear_tag") as string | null;
  const calfName = formData.get("calf_name") as string | null;
  const rawComplications = (formData.get("complications") as string) || null;
  const notes = (formData.get("notes") as string) || null;
  const healthRaw = formData.get("health");
  const health =
    typeof healthRaw === "string" && healthRaw.trim().length > 0
      ? (healthRaw as "Healthy" | "Unhealthy")
      : null;
  const farmSource =
    typeof farmSourceRaw === "string" && farmSourceRaw.trim() !== ""
      ? farmSourceRaw.trim()
      : null;

  const assistanceRequired = rawComplications === "Assisted";
  const complicationsValue =
    rawComplications && rawComplications !== "Live Birth"
      ? rawComplications
      : null;
  const { earTag: resolvedSireEarTag, animalId: resolvedSireAnimalId } =
    await resolveSireIdentifiers({
      supabase,
      userId: user.id,
      rawInput: rawSireInput,
    });

  // --- Step 2: Create the calving event record (your existing logic) ---
  const calvingData = {
    animal_id: damId,
    calving_date: calvingDate,
    calf_ear_tag: calfEarTag,
    calf_sex: (formData.get("calf_sex") as "Male" | "Female") || null,
    birth_weight: formData.get("birth_weight")
      ? Number.parseFloat(formData.get("birth_weight") as string)
      : null,
    complications: complicationsValue,
    assistance_required: assistanceRequired,
    sire_id: resolvedSireEarTag,
    notes,
    health,
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
    // Prepare the data for the new animal record in the 'animals' table.
    const newAnimalData = {
      ear_tag: calfEarTag.trim(),
      name: calfName?.trim() || null,
      sex: (formData.get("calf_sex") as "Male" | "Female") || null,
      birth_date: calvingDate,
      status: "Active" as const,
      dam_id: damId,
      dam_fk_id: damId,
      sire_id: resolvedSireAnimalId,
      sire_fk_id: resolvedSireAnimalId,
      farm_source: farmSource,
      notes: `Born from calving event #${newCalvingRecord.id}.`,
      user_id: user.id,
      health: health ?? "Healthy",
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

  // --- Step 4: Update the dam's status to Empty and set reopen_date
  let reopenDateIso: string | null = null;
  try {
    const calvingDateObj = parseISO(calvingDate);
    const reopenDate = addDays(calvingDateObj, 60);
    reopenDateIso = reopenDate.toISOString().split("T")[0];
  } catch (err) {
    // fallback to now + 60 days if parsing fails
    reopenDateIso = addDays(new Date(), 60).toISOString().split("T")[0];
  }

  const { error: updateAnimalErr } = await supabase
    .from("animals")
    .update({
      status: "Empty",
      reopen_date: reopenDateIso,
      expected_calving_date: null,
    })
    .eq("id", damId);

  if (updateAnimalErr) {
    console.error("Error updating dam after calving:", updateAnimalErr);
    throw new Error("Calving recorded but failed to update dam status.");
  }

  // --- Step 5: If there's an active pregnancy, mark it as completed
  const { data: breedingRecords, error: brFetchError } = await supabase
    .from("breeding_records")
    .select("id")
    .eq("animal_id", damId)
    .eq("confirmed_pregnant", true)
    .limit(1);

  if (!brFetchError && breedingRecords && breedingRecords.length > 0) {
    const breedingRecordId = breedingRecords[0].id;

    const { error: breedingUpdateErr } = await supabase
      .from("breeding_records")
      .update({
        confirmed_pregnant: false,
        pd_result: "Empty",
      })
      .eq("id", breedingRecordId);

    if (breedingUpdateErr) {
      console.error(
        "Error updating breeding record after calving:",
        breedingUpdateErr
      );
      // Non-fatal error, continue with the process
      console.warn("Breeding record may still show as active after calving");
    }
  }

  // --- Step 6: Revalidate paths to update the UI ---
  revalidatePath("/");
  revalidatePath(`/animal/${damId}`);
  revalidatePath("/record/breeding", "layout");
  revalidatePath("/pregnancy"); // Make sure the pregnancy page is updated
}

export async function getPregnantAnimals() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // First, get all animals with status "Pregnant"
  const { data, error } = await supabase
    .from("animals")
    .select(
      `
        id,
        ear_tag,
        name,
        status,
        breeding_records ( id, breeding_date, expected_calving_date, pd_result, confirmed_pregnant )
      `
    )
    .eq("sex", "Female")
    .eq("status", "Pregnant") // Only include animals with status "Pregnant"
    .order("ear_tag", { ascending: true });

  if (error) {
    console.error("Error fetching pregnant animals:", error);
    return [];
  }

  // Filter to only include animals that have at least one qualifying breeding record
  const filteredData = (data || []).filter((animal) => {
    if (!animal.breeding_records || !Array.isArray(animal.breeding_records)) {
      return false;
    }

    return animal.breeding_records.some(
      (record) =>
        record.confirmed_pregnant === true || record.pd_result === "Pregnant"
    );
  });

  // Log message if no pregnant animals found (helpful for debugging)
  if (!filteredData || filteredData.length === 0) {
    console.info("No pregnant animals found in the system.");
  }

  return filteredData || [];
}
