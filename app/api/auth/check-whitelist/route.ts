import { NextRequest, NextResponse } from "next/server";
import { checkEmailWhitelist } from "@/lib/actions/whitelist-simple";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        {
          isWhitelisted: false,
          message: "Email address is required.",
        },
        { status: 400 }
      );
    }

    // Check if email is whitelisted and not yet registered
    const result = await checkEmailWhitelist(email);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in whitelist check API:", error);
    return NextResponse.json(
      {
        isWhitelisted: false,
        message: "Unable to verify authorization. Please try again later.",
      },
      { status: 500 }
    );
  }
}
