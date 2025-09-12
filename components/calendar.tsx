"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  parseISO,
  isWithinInterval,
  addDays,
  isSameDay,
  isBefore,
  startOfDay,
  endOfDay,
} from "date-fns";
import { BreedingRecord, Calving } from "@/lib/types";

interface BreedingRecordWithAnimal extends BreedingRecord {
  animals: { ear_tag: string; name: string | null } | null;
}

interface CalvingWithAnimal extends Calving {
  animals: { ear_tag: string; name: string | null } | null;
}

export interface CalendarEvent {
  date: Date;
  type:
    | "breeding"
    | "heat_check"
    | "pregnancy_check"
    | "expected_calving"
    | "actual_calving";
  animal_id: number;
  ear_tag: string;
  title: string;
  color: string;
  completed: boolean;
}

interface CalendarWidgetProps {
  records: BreedingRecordWithAnimal[];
  calvings?: CalvingWithAnimal[];
}

export function CalendarWidget({
  records,
  calvings = [],
}: CalendarWidgetProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const events: CalendarEvent[] = [];
    const today = new Date();

    records.forEach((record) => {
      const earTag = record.animals?.ear_tag || `ID #${record.animal_id}`;

      // 1. Breeding Date (Historical)
      const breedingDate = parseISO(record.breeding_date);
      events.push({
        date: breedingDate,
        type: "breeding",
        ear_tag: earTag,
        title: `Bred: ${earTag}`,
        animal_id: record.animal_id,
        color: "blue",
        completed: isBefore(breedingDate, today),
      });

      // 2. PD Check Due
      if (record.pregnancy_check_due_date) {
        const pdDate = parseISO(record.pregnancy_check_due_date);
        const pdCompleted = record.pd_result !== "Unchecked";

        events.push({
          date: pdDate,
          type: "pregnancy_check",
          ear_tag: earTag,
          title: `PD Check: ${earTag}`,
          animal_id: record.animal_id,
          color: "purple",
          completed: pdCompleted,
        });
      }

      // 3. Expected Calving - More robust pregnancy check
      if (record.expected_calving_date) {
        // Check if pregnant via multiple ways with better null handling
        const isConfirmedPregnant = Boolean(record.confirmed_pregnant);
        const isPDPositive =
          record.pd_result &&
          (record.pd_result.toLowerCase() === "pregnant" ||
            record.pd_result === "Pregnant");

        if (isConfirmedPregnant || isPDPositive) {
          const calvingDate = parseISO(record.expected_calving_date);
          events.push({
            date: calvingDate,
            type: "expected_calving",
            ear_tag: earTag,
            title: `Expected Calving: ${earTag}`,
            animal_id: record.animal_id,
            color: "green",
            completed: isBefore(calvingDate, today),
          });
        }
      }
    });

    // 4. Actual Calving Events (historical)
    calvings.forEach((calving) => {
      const earTag = calving.animals?.ear_tag || `ID #${calving.animal_id}`;
      const calvingDate = parseISO(calving.calving_date);

      events.push({
        date: calvingDate,
        type: "actual_calving",
        ear_tag: earTag,
        title: `Calved: ${earTag}`,
        animal_id: calving.animal_id,
        color: "blue",
        completed: true, // Calvings are always historical events
      });
    });

    setCalendarEvents(events);
  }, [records, calvings]);

  const hasEvents = (checkDate: Date) =>
    calendarEvents.some((event) => isSameDay(event.date, checkDate));

  const getEventsForDate = (selectedDate: Date) =>
    calendarEvents.filter((event) => isSameDay(event.date, selectedDate));

  const getUpcomingEvents = () => {
    const today = startOfDay(new Date());
    const thirtyDaysFromNow = endOfDay(addDays(today, 30));

    return calendarEvents
      .filter(
        (event) =>
          isWithinInterval(event.date, {
            start: today,
            end: thirtyDaysFromNow,
          }) && !event.completed
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
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
      case "actual_calving":
        return "bg-indigo-50 border-l-indigo-500";
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
      case "actual_calving":
        return "bg-indigo-500";
      default:
        return "bg-gray-500";
    }
  };

  const upcomingEvents = getUpcomingEvents();

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
                    <p
                      className={`text-xs font-medium ${
                        event.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(event.date, "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Events - Now shows all events for the next 30 days */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Upcoming Events (Next 30 Days)
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, index) => (
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
                No upcoming events in the next 30 days
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
              <span>Expected</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>Calved</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
