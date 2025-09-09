// components/pd-check-calendar.tsx
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  parseISO,
  isSameDay,
  addDays,
  startOfToday,
  isWithinInterval,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Animal, BreedingRecord } from "@/lib/types";
import { getPregnancyCheckDueDate } from "@/lib/utils";

interface PDCheckCalendarProps {
  animals: Animal[];
}

export function PDCheckCalendar({ animals }: PDCheckCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // Extract all upcoming PD checks
  const pdCheckEvents = useMemo(() => {
    const events: {
      date: Date;
      animal: Animal;
      record: BreedingRecord;
      dueDate: Date;
    }[] = [];

    const today = startOfToday();
    const thirtyDaysFromNow = addDays(today, 30);

    animals.forEach((animal) => {
      animal.breeding_records?.forEach((record) => {
        if (record.pd_result === "Unchecked") {
          const dueDate = getPregnancyCheckDueDate(record);
          if (
            dueDate &&
            isWithinInterval(dueDate, { start: today, end: thirtyDaysFromNow })
          ) {
            events.push({
              date: dueDate,
              animal,
              record,
              dueDate,
            });
          }
        }
      });
    });

    // Sort by date
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [animals]);

  const hasPDCheck = (checkDate: Date) =>
    pdCheckEvents.some((event) => isSameDay(event.date, checkDate));

  const getPDChecksForDate = (selectedDate: Date) =>
    pdCheckEvents.filter((event) => isSameDay(event.date, selectedDate));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Upcoming PD Checks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          modifiers={{
            hasPDCheck,
          }}
          modifiersStyles={{
            hasPDCheck: {
              backgroundColor: "#e0e7ff",
              fontWeight: "bold",
            },
          }}
        />

        {/* PD Checks for selected date */}
        {date && getPDChecksForDate(date).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              PD Checks on {format(date, "MMM dd, yyyy")}
            </h4>
            <div className="space-y-2">
              {getPDChecksForDate(date).map((event, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-md border-l-4 border-blue-500 bg-blue-50"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1">
                    <p className="text-xs font-medium">
                      {event.animal.ear_tag} - {event.animal.name || "Unnamed"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PD Check Due
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming PD Checks List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Next 30 Days</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {pdCheckEvents.length > 0 ? (
              pdCheckEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-md border"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium">
                      {event.animal.ear_tag}
                      {event.animal.name && ` - ${event.animal.name}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(event.date, "MMM dd, yyyy")}
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    PD Check
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No PD checks scheduled in the next 30 days
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
