"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: number;
  title: string;
  body: string;
  scheduled_for: string;
  read: boolean;
  created_at: string;
  metadata: {
    type?: "pd_check" | "expected_calving" | "reopen_breeding";
    breeding_record_id?: number;
    calving_id?: number;
    dam_id?: number;
  };
  animal_id: number | null;
  animals: {
    ear_tag: string;
    name: string | null;
  } | null;
}

export default function NotificationButton() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch("/api/notifications");
        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }
        const data = await response.json();
        setNotifications(data || []);

        // Count unread notifications
        const unread = (data || []).filter((n: Notification) => !n.read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();

    // Optional: Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/notifications">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
        <span className="sr-only">
          Notifications {unreadCount > 0 ? `(${unreadCount} unread)` : ""}
        </span>
      </Button>
    </Link>
  );
}
