import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all in-app notifications for the user
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select(
        `
        id,
        title,
        body,
        scheduled_for,
        read,
        created_at,
        metadata,
        animal_id,
        animals:animal_id (
          ear_tag,
          name
        )
      `
      )
      .eq("user_id", user.id)
      .eq("channel", "in_app")
      .order("scheduled_for", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json(notifications || []);
  } catch (error) {
    console.error("Error in notifications API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId, read } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    // Mark notification as read/unread
    const { error } = await supabase
      .from("notifications")
      .update({ read: read ?? true })
      .eq("id", notificationId)
      .eq("user_id", user.id); // Ensure user owns this notification

    if (error) {
      console.error("Error updating notification:", error);
      return NextResponse.json(
        { error: "Failed to update notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in notifications PATCH:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Mark all as read
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark all unread notifications as read
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("channel", "in_app")
      .eq("read", false);

    if (error) {
      console.error("Error marking all as read:", error);
      return NextResponse.json(
        { error: "Failed to mark all as read" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in notifications POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
