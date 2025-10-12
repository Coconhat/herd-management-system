import { NextRequest, NextResponse } from "next/server";
import { markEmailAsRegistered } from "@/lib/actions/whitelist-simple";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    const success = await markEmailAsRegistered(email);

    if (!success) {
      console.warn(`Failed to mark ${email} as registered`);
      // Don't fail the signup process, just log it
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in mark-registered API:", error);
    // Don't fail the signup process
    return NextResponse.json({ success: true });
  }
}
