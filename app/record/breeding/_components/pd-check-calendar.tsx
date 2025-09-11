// components/pd-check-calendar.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  parseISO,
  isSameDay,
  addDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
  isBefore,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import { BreedingRecord } from "@/lib/types";
import { CalendarEvent } from "@/components/calendar";
import type { Animal } from "@/lib/actions/animals";

interface BreedingRecordWithAnimal extends BreedingRecord {
  animals: { ear_tag: string; name: string | null } | null;
}

type AnimalWithBreeding = Animal & { breeding_records: BreedingRecord[] };

interface PDCheckCalendarProps {
  animals: AnimalWithBreeding[];
}

export function PDCheckCalendar({ animals }: PDCheckCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [pdEvents, setPdEvents] = useState<CalendarEvent[]>([]);

  // Extract PD check events using the same logic as the main calendar
  useEffect(() => {
    const events: CalendarEvent[] = [];
    const today = new Date();

    // Check if animals exists and is an array before processing
    if (!animals || !Array.isArray(animals)) {
      setPdEvents([]);
      return;
    }

    // Flatten animals and their breeding records to match the main calendar format
    animals.forEach((animal) => {
      if (!animal.breeding_records || !Array.isArray(animal.breeding_records)) {
        return;
      }

      animal.breeding_records.forEach((record) => {
        const earTag = animal.ear_tag || `ID #${animal.id}`;

        // Only extract PD Check events
        if (record.pregnancy_check_due_date) {
          const pdDate = parseISO(record.pregnancy_check_due_date);
          const pdCompleted = record.pd_result !== "Unchecked";

          events.push({
            date: pdDate,
            type: "pregnancy_check",
            ear_tag: earTag,
            title: `PD Check: ${earTag}`,
            animal_id: animal.id,
            color: "purple",
            completed: pdCompleted,
          });
        }
      });
    });

    setPdEvents(events);
  }, [animals]);
  const hasPDCheck = (checkDate: Date) =>
    pdEvents.some((event) => isSameDay(event.date, checkDate));

  const getPDChecksForDate = (selectedDate: Date) =>
    pdEvents.filter((event) => isSameDay(event.date, selectedDate));

  const getUpcomingPDChecks = () => {
    const today = startOfDay(new Date());
    const thirtyDaysFromNow = endOfDay(addDays(today, 30));

    // Show all PD checks within 30 days, prioritizing unchecked ones
    const allPDChecks = pdEvents
      .filter((event) =>
        isWithinInterval(event.date, {
          start: today,
          end: thirtyDaysFromNow,
        })
      )
      .sort((a, b) => {
        // Sort by completion status first (unchecked first), then by date
        if (a.completed === b.completed) {
          return a.date.getTime() - b.date.getTime();
        }
        return a.completed ? 1 : -1; // unchecked first
      });

    return allPDChecks;
  };

  const upcomingPDChecks = getUpcomingPDChecks();

  // Debug logging
  console.log("PD Events total:", pdEvents.length);
  console.log("Upcoming PD checks:", upcomingPDChecks.length);
  console.log("First few PD events:", pdEvents.slice(0, 3));

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
              backgroundColor: "#f3e8ff",
              color: "#7c3aed",
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
                  className="flex items-center gap-2 p-2 rounded-md border-l-4 border-purple-500 bg-purple-50"
                >
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{event.ear_tag}</p>
                    <p className="text-xs text-muted-foreground">
                      PD Check Due
                    </p>
                  </div>
                  <Badge
                    variant={event.completed ? "default" : "destructive"}
                    className="ml-2"
                  >
                    {event.completed ? "Completed" : "Due"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming PD Checks List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Next 30 Days</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {upcomingPDChecks.length > 0 ? (
              upcomingPDChecks.map((event, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-md border ${
                    event.completed
                      ? "bg-gray-50 border-gray-200"
                      : "bg-purple-50 border-purple-200"
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium">{event.ear_tag}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(event.date, "MMM dd, yyyy")}
                    </p>
                  </div>
                  <Badge
                    variant={event.completed ? "default" : "destructive"}
                    className="ml-2"
                  >
                    {event.completed ? "Checked" : "Due"}
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
