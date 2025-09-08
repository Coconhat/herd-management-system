"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { format, isBefore, parseISO } from "date-fns";

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

  revalidatePath("/inventory/medicine");
  revalidatePath(`/animal/${usageData.animal_id}`);
}
