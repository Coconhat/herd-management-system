"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { getAllBreedingRecords } from "@/lib/actions/breeding";
import {
  format,
  parseISO,
  isWithinInterval,
  addDays,
  isSameDay,
} from "date-fns";
import Link from "next/link"; // Import Link for navigation

// Step 1: Update the interface to match the actual data from the server
interface BreedingRecordWithAnimal {
  id: number;
  animal_id: number;
  breeding_date: string;
  pregnancy_check_due_date: string;
  expected_calving_date: string;
  pd_result: "Pregnant" | "Empty" | "Unchecked";
  confirmed_pregnant: boolean; // This is crucial for tracking completed pregnancies
  animals: {
    ear_tag: string;
    name: string | null;
  } | null;
}

interface CalendarEvent {
  date: Date;
  type: "breeding" | "heat_check" | "pregnancy_check" | "expected_calving";
  animal_id: number;
  ear_tag: string;
  title: string;
  color: string;
}

export function CalendarWidget() {
  // Removed animalId prop as it wasn't used for fetching
  const [date, setDate] = useState<Date | undefined>(new Date());
  // Step 2: Use the correct, more descriptive interface for your state
  const [breedingRecords, setBreedingRecords] = useState<
    BreedingRecordWithAnimal[]
  >([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBreedingRecords = async () => {
      try {
        setLoading(true);
        const records = await getAllBreedingRecords();

        const events: CalendarEvent[] = [];
        (records as BreedingRecordWithAnimal[]).forEach((record) => {
          const earTag = record.animals?.ear_tag || `ID #${record.animal_id}`;

          // Event 1: Breeding Date (Always show this as it's a historical fact)
          events.push({
            date: parseISO(record.breeding_date),
            type: "breeding",
            ear_tag: earTag,
            title: `Bred: ${earTag}`,
            animal_id: record.animal_id,
            color: "blue",
          });

          // **THE FIX for PD Checks**:
          // Only show the pregnancy check event if the status is still "Unchecked".
          if (
            record.pregnancy_check_due_date &&
            record.pd_result === "Unchecked"
          ) {
            events.push({
              date: parseISO(record.pregnancy_check_due_date),
              type: "pregnancy_check",
              ear_tag: earTag,
              title: `PD Check Due: ${earTag}`,
              animal_id: record.animal_id,
              color: "purple",
            });
          }

          // **THE FIX for Calving**:
          // Only show the expected calving event if the animal is currently confirmed pregnant.
          // Your server action sets `confirmed_pregnant` to `false` after a calving.
          if (record.expected_calving_date && record.confirmed_pregnant) {
            events.push({
              date: parseISO(record.expected_calving_date),
              type: "expected_calving",
              ear_tag: earTag,
              title: `Expected Calving: ${earTag}`,
              animal_id: record.animal_id,
              color: "green",
            });
          }
        });

        setCalendarEvents(events);
      } catch (error) {
        console.error("Error fetching breeding records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBreedingRecords();
  }, []);

  const hasEvents = (checkDate: Date) =>
    calendarEvents.some((event) => isSameDay(event.date, checkDate));
  const getEventsForDate = (selectedDate: Date) =>
    calendarEvents.filter((event) => isSameDay(event.date, selectedDate));

  const getUpcomingEvents = () => {
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    return calendarEvents
      .filter((event) =>
        isWithinInterval(event.date, { start: today, end: thirtyDaysFromNow })
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  };
  const getEventColor = (type: string) => {
    switch (type) {
      case "breeding":
        return "bg-blue-50 border-l-blue-500";
      case "heat_check":
        return "bg-orange-50 border-l-orange-500";
      case "pregnancy_check":
        return "bg-purple-50 border-l-purple-500";
      case "expected_calving":
        return "bg-green-50 border-l-green-500";
      default:
        return "bg-gray-50 border-l-gray-500";
    }
  };

  const getDotColor = (type: string) => {
    switch (type) {
      case "breeding":
        return "bg-blue-500";
      case "heat_check":
        return "bg-orange-500";
      case "pregnancy_check":
        return "bg-purple-500";
      case "expected_calving":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 rounded-md"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm">
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
          modifiers={{
            hasEvents: (date) => hasEvents(date),
          }}
          modifiersStyles={{
            hasEvents: {
              backgroundColor: "#dbeafe",
              fontWeight: "bold",
            },
          }}
        />

        {/* Events for selected date */}
        {date && getEventsForDate(date).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              Events on {format(date, "MMM dd, yyyy")}
            </h4>
            <div className="space-y-2">
              {getEventsForDate(date).map((event, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-md border-l-4 ${getEventColor(
                    event.type
                  )}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${getDotColor(
                      event.type
                    )}`}
                  ></div>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(event.date, "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Upcoming Events</h4>
          <div className="space-y-2">
            {getUpcomingEvents().length > 0 ? (
              getUpcomingEvents().map((event, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-md border-l-4 ${getEventColor(
                    event.type
                  )}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${getDotColor(
                      event.type
                    )}`}
                  ></div>
                  <div className="flex-1">
                    <p className="text-xs font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(event.date, "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No upcoming events
              </p>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Legend</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Breeding</span>
            </div>

            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>PD Check</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Calving</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
