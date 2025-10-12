"use client";

import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import Link from "next/link";

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();

    // Refresh every 5 minutes
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      const unread = data.filter((n: any) => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  return (
    <Link href="/notifications">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}
