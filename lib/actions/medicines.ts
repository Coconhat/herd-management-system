"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { format, isBefore, parseISO } from "date-fns";
import { create } from "domain";

export interface Medicine {
  id: number;
  name: string;
  stock_quantity: number;
  unit: string;
  low_stock_threshold?: number;
  expiration_date?: string | null;
}

/**
 * Fetches all medicines from the inventory, ordered by expiration date.
 */
export async function getMedicines(): Promise<Medicine[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medicines")
    .select("*")
    .order("expiration_date", { ascending: true });

  if (error) {
    console.error("Error fetching medicines:", error);
    throw new Error("Could not fetch medicines.");
  }
  return data;
}

/**
 * Adds a new medicine to the inventory.
 */
export async function addMedicine(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const medicineData = {
    user_id: user.id,
    name: formData.get("name") as string,
    stock_quantity: Number(formData.get("stock_quantity")),
    unit: formData.get("unit") as string,
    low_stock_threshold: formData.get("low_stock_threshold")
      ? Number(formData.get("low_stock_threshold"))
      : null,
    expiration_date: formData.get("expiration_date") || null,
  };

  if (
    !medicineData.name ||
    !medicineData.stock_quantity ||
    !medicineData.unit
  ) {
    throw new Error("Name, Stock, and Unit are required fields.");
  }

  const { error } = await supabase.from("medicines").insert(medicineData);
  if (error) {
    console.error("Error adding medicine:", error);
    throw new Error("Failed to add new medicine.");
  }

  revalidatePath("/inventory/medicine");
}

/**
 * Records the usage of a medicine, validates expiration, and decrements stock.
 */
export async function recordMedicineUsage(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const medicineId = Number(formData.get("medicine_id"));
  const quantityUsed = Number(formData.get("quantity_used"));

  // 1. Fetch the medicine to check its expiration date and stock first
  const { data: currentMedicine, error: fetchError } = await supabase
    .from("medicines")
    .select("name, stock_quantity, expiration_date")
    .eq("id", medicineId)
    .single();

  if (fetchError || !currentMedicine) {
    throw new Error("Could not find the selected medicine to record usage.");
  }

  // 2. Validate expiration date
  if (currentMedicine.expiration_date) {
    const expirationDate = parseISO(currentMedicine.expiration_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Compare date part only

    if (isBefore(expirationDate, today)) {
      throw new Error(
        `Cannot use expired medicine. ${
          currentMedicine.name
        } expired on ${format(expirationDate, "MM/dd/yyyy")}.`
      );
    }
  }

  // 3. Create the usage log entry
  const usageData = {
    user_id: user.id,
    animal_id: Number(formData.get("animal_id")),
    medicine_id: medicineId,
    breeding_record_id: formData.get("breeding_record_id")
      ? Number(formData.get("breeding_record_id"))
      : null,
    date_administered: formData.get("date_administered") as string,
    quantity_used: quantityUsed,
    reason: formData.get("reason") as string,
  };

  const { error: usageError } = await supabase
    .from("medicine_usage_records")
    .insert(usageData);
  if (usageError) {
    console.error("Error creating usage record:", usageError);
    throw new Error("Failed to record medicine usage.");
  }

  // 4. Decrement the stock quantity in the inventory
  const newStock = currentMedicine.stock_quantity - quantityUsed;
  const { error: updateError } = await supabase
    .from("medicines")
    .update({ stock_quantity: newStock, updated_at: new Date().toISOString() })
    .eq("id", medicineId);

  if (updateError) {
    throw new Error("Usage recorded, but failed to update stock quantity.");
  }

  // 5. Create a health_record entry for this treatment
  const healthRecordType = usageData.breeding_record_id
    ? "Post-PD Treatment"
    : "Medicine Administration";

  const healthDescription = usageData.breeding_record_id
    ? `Post-pregnancy diagnosis vitamin/treatment protocol administered.`
    : usageData.reason || `${currentMedicine.name} administered.`;

  const healthTreatment = `${currentMedicine.name} - ${quantityUsed} dose(s)`;

  const { error: healthError } = await supabase.from("health_records").insert({
    animal_id: usageData.animal_id,
    record_date: usageData.date_administered,
    record_type: healthRecordType,
    description: healthDescription,
    treatment: healthTreatment,
    notes: usageData.reason || null,
    user_id: user.id,
    ml: Math.ceil(quantityUsed),
    medication: currentMedicine.name,
  });

  if (healthError) {
    console.warn("Could not create health record:", healthError);
    // Non-fatal: medicine usage is already recorded
  }

  // 6. If this is post-PD treatment for a breeding record, update the animal status
  // From "Empty" (not pregnant) to "Open" (ready for breeding after recovery)
  if (usageData.breeding_record_id) {
    // Get the animal's reopen_date to keep it
    const { data: animalData } = await supabase
      .from("animals")
      .select("reopen_date")
      .eq("id", usageData.animal_id)
      .single();

    // Change animal status from "Empty" to "Open" after treatment
    const { error: animalUpdateError } = await supabase
      .from("animals")
      .update({ pregnancy_status: "Open" })
      .eq("id", usageData.animal_id)
      .eq("pregnancy_status", "Empty"); // Only update if currently Empty

    if (animalUpdateError) {
      console.warn(
        "Could not update animal status after treatment:",
        animalUpdateError
      );
    }

    // Extend the keep_in_breeding_until date to the reopen_date so record stays visible
    // until the animal is ready for breeding again
    const keepUntilDate =
      animalData?.reopen_date ||
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]; // Default to 60 days if no reopen_date

    const { error: brUpdateError } = await supabase
      .from("breeding_records")
      .update({ keep_in_breeding_until: keepUntilDate })
      .eq("id", usageData.breeding_record_id);

    if (brUpdateError) {
      console.warn(
        "Could not extend breeding record visibility:",
        brUpdateError
      );
    }
  }

  revalidatePath("/inventory/medicine");
  revalidatePath(`/animal/${usageData.animal_id}`);
  revalidatePath("/record/breeding", "layout");
}

/**
 * Check if a breeding record has treatment recorded
 */
export async function hasBreedingRecordTreatment(
  breedingRecordId: number
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medicine_usage_records")
    .select("id")
    .eq("breeding_record_id", breedingRecordId)
    .limit(1);

  if (error) {
    console.error("Error checking breeding record treatment:", error);
    return false;
  }

  return data && data.length > 0;
}

export async function editMedicineQuantity(
  medicineId: number,
  formData: FormData
) {
  const supabase = await createClient();
  const newQuantity = Number(formData.get("stock_quantity"));

  const { error } = await supabase
    .from("medicines")
    .update({
      stock_quantity: newQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", medicineId);
  if (error) {
    console.error("Error updating medicine quantity:", error);
    throw new Error("Could not update medicine quantity.");
  }
}

export async function editMedicineExpiration(
  medicineId: number,
  formData: FormData
) {
  const supabase = await createClient();
  const newExpirationDate = formData.get("expiration_date") as string;

  const { error } = await supabase
    .from("medicines")
    .update({
      expiration_date: newExpirationDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", medicineId);
  if (error) {
    console.error("Error updating medicine expiration date:", error);
    throw new Error("Could not update medicine expiration date.");
  }
  revalidatePath("/inventory/medicine");
}

export async function deleteMedicine(medicineId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");

  const { error } = await supabase
    .from("medicines")
    .delete()
    .eq("id", medicineId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting medicine:", error);
    throw new Error("Could not delete medicine.");
  }

  revalidatePath("/inventory/medicine");
}
