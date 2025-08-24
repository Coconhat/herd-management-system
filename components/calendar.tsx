"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";

export function CalendarWidget() {
  const [date, setDate] = useState(new Date());

  return (
    <Card className="w-2xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          required
        />

        {/* Upcoming Events */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Upcoming Pregnancy</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-xs font-medium">Due: 2 weeks from now</p>
                <p className="text-xs text-muted-foreground">Jane - #A123</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-xs font-medium">Due: 2 weeks from now</p>
                <p className="text-xs text-muted-foreground">Ashley - #A124</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-xs font-medium">Due: 1 week from now</p>
                <p className="text-xs text-muted-foreground">Beb - #A144</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
