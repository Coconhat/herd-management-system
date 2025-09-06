// app/api/breeding/route.ts
import { NextResponse } from "next/server";
import { createBreedingRecord } from "@/lib/actions/breeding"; // your server action

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    await createBreedingRecord(formData); // server action does auth + insert + revalidatePath
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("POST /api/breeding:", err);
    return NextResponse.json(
      { error: err?.message || "Failed" },
      { status: 500 }
    );
  }
}
