import { NextRequest, NextResponse } from "next/server";
import {
  getWhitelistedEmails,
  addEmailToWhitelist,
  removeEmailFromWhitelist,
} from "@/lib/actions/email-whitelist";

// GET - Fetch all whitelisted emails
export async function GET() {
  try {
    const emails = await getWhitelistedEmails();
    return NextResponse.json(emails);
  } catch (error) {
    console.error("Error fetching whitelisted emails:", error);
    return NextResponse.json(
      { message: "Failed to fetch whitelisted emails" },
      { status: 500 }
    );
  }
}

// POST - Add email to whitelist
export async function POST(request: NextRequest) {
  try {
    const { email, notes } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email address is required" },
        { status: 400 }
      );
    }

    const result = await addEmailToWhitelist(email, notes);

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("Error adding email to whitelist:", error);
    return NextResponse.json(
      { message: "Failed to add email to whitelist" },
      { status: 500 }
    );
  }
}

// DELETE - Remove email from whitelist
export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email address is required" },
        { status: 400 }
      );
    }

    const result = await removeEmailFromWhitelist(email);

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("Error removing email from whitelist:", error);
    return NextResponse.json(
      { message: "Failed to remove email from whitelist" },
      { status: 500 }
    );
  }
}
