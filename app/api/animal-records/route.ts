// app/api/animal-records/route.ts
import { NextResponse } from "next/server";
import { getCalvingsByAnimalId } from "@/lib/actions/calvings";
import { getHealthRecordsByAnimalId } from "@/lib/actions/health-records";
import { getBreedingRecordsByAnimalId } from "@/lib/actions/breeding";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const animalId = Number(url.searchParams.get("animalId"));
    if (!animalId) {
      return NextResponse.json(
        { error: "animalId query required" },
        { status: 400 }
      );
    }
    const [calvings, healthRecords, breedingRecords] = await Promise.all([
      getCalvingsByAnimalId(animalId),
      getHealthRecordsByAnimalId(animalId),
      getBreedingRecordsByAnimalId(animalId),
    ]);

    return NextResponse.json({ calvings, healthRecords, breedingRecords });
  } catch (err: any) {
    console.error("API /api/animal-records error:", err);
    return NextResponse.json(
      { error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
