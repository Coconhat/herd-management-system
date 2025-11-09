"use server";
import { createClient } from "../supabase/server";
import { redirect } from "next/navigation";

export type Diesel = {
  id: string;
  event_date: string;
  volume_liters: number;
  reference: string | null;
  recorded_by: string | null;
  type: "addition" | "consumption" | "correction";
};

export type AddDieselInput = {
  event_date: string;
  volume_liters: number;
  type: Diesel["type"];
  reference?: string;
  recorded_by?: string;
};

const getDiesel = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("diesel")
    .select("*")
    .order("event_date", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data as Diesel[];
};

const addDiesel = async ({
  event_date,
  volume_liters,
  type,
  reference,
  recorded_by,
}: AddDieselInput) => {
  const supabase = await createClient();

  const dieselData = {
    event_date,
    volume_liters,
    type,
    reference: reference?.trim() || null,
    recorded_by: recorded_by?.trim() || null,
  };

  const { error } = await supabase.from("diesel").insert([dieselData]);
  if (error) {
    throw new Error(error.message);
  }
};

export { getDiesel, addDiesel };
