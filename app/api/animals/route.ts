import { NextResponse } from "next/server";
import { getAnimals } from "@/lib/actions/animals";

export async function GET(req: Request) {
  try {
    const animals = await getAnimals();
    return NextResponse.json(animals);
  } catch (err: any) {
    console.error("GET /api/animals error:", err);
    return NextResponse.json(
      { error: err?.message || "Unknown" },
      { status: 500 }
    );
  }
}
