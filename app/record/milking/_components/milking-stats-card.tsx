"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MilkingRecord } from "@/lib/types";
import { format, subDays, isWithinInterval } from "date-fns";

interface MilkingStatsCardProps {
  milkingRecords: MilkingRecord[];
}

export function MilkingStatsCard({ milkingRecords }: MilkingStatsCardProps) {
  const today = new Date();

  // Filter records for current week (last 7 days)
  const currentWeekRecords = milkingRecords.filter((record) =>
    isWithinInterval(new Date(record.milking_date), {
      start: subDays(today, 7),
      end: today,
    })
  );

  // Calculate total milk production for current week
  const totalWeekProduction = currentWeekRecords.reduce(
    (total, record) => total + (record.milk_yield || 0),
    0
  );

  // Calculate average daily production for the week
  const uniqueDaysThisWeek = new Set(
    currentWeekRecords.map((r) => r.milking_date)
  ).size;
  const avgDailyProduction =
    uniqueDaysThisWeek > 0 ? totalWeekProduction / uniqueDaysThisWeek : 0;

  // Calculate total production for all time
  const totalProduction = milkingRecords.reduce(
    (total, record) => total + (record.milk_yield || 0),
    0
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Week Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalWeekProduction.toFixed(1)} L
          </div>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {avgDailyProduction.toFixed(1)} L
          </div>
          <p className="text-xs text-muted-foreground">Per day this week</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Total Production
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalProduction.toFixed(1)} L
          </div>
          <p className="text-xs text-muted-foreground">All time</p>
        </CardContent>
      </Card>
    </div>
  );
}
