"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MilkingRecord } from "@/lib/types";
import {
  format,
  subDays,
  isWithinInterval,
  subMonths,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
  Calendar,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  // Filter records for previous week for comparison
  const previousWeekRecords = milkingRecords.filter((record) =>
    isWithinInterval(new Date(record.milking_date), {
      start: subDays(today, 14),
      end: subDays(today, 7),
    })
  );

  // Current and previous month records
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);
  const currentMonthRecords = milkingRecords.filter((record) =>
    isWithinInterval(new Date(record.milking_date), {
      start: currentMonthStart,
      end: currentMonthEnd,
    })
  );

  const previousMonthStart = startOfMonth(subMonths(today, 1));
  const previousMonthEnd = endOfMonth(subMonths(today, 1));
  const previousMonthRecords = milkingRecords.filter((record) =>
    isWithinInterval(new Date(record.milking_date), {
      start: previousMonthStart,
      end: previousMonthEnd,
    })
  );

  // Calculate totals
  const totalWeekProduction = currentWeekRecords.reduce(
    (total, record) => total + (record.milk_yield || 0),
    0
  );

  const totalPreviousWeekProduction = previousWeekRecords.reduce(
    (total, record) => total + (record.milk_yield || 0),
    0
  );

  const totalMonthProduction = currentMonthRecords.reduce(
    (total, record) => total + (record.milk_yield || 0),
    0
  );

  const totalPreviousMonthProduction = previousMonthRecords.reduce(
    (total, record) => total + (record.milk_yield || 0),
    0
  );

  const totalProduction = milkingRecords.reduce(
    (total, record) => total + (record.milk_yield || 0),
    0
  );

  const peakStartDate = milkingRecords.length
    ? milkingRecords
        .map((record) => new Date(record.milking_date))
        .reduce((earliest, current) =>
          current < earliest ? current : earliest
        )
    : null;

  // Calculate averages
  const uniqueDaysThisWeek = new Set(
    currentWeekRecords.map((r) => r.milking_date)
  ).size;
  const avgDailyProduction =
    uniqueDaysThisWeek > 0 ? totalWeekProduction / uniqueDaysThisWeek : 0;

  const uniqueAnimalsThisWeek = new Set(
    currentWeekRecords.map((r) => r.animal_id)
  ).size;

  const uniqueAnimalsThisMonth = new Set(
    currentMonthRecords.map((r) => r.animal_id)
  ).size;

  // Calculate percentage changes
  const weeklyChange =
    totalPreviousWeekProduction > 0
      ? ((totalWeekProduction - totalPreviousWeekProduction) /
          totalPreviousWeekProduction) *
        100
      : 0;

  const monthlyChange =
    totalPreviousMonthProduction > 0
      ? ((totalMonthProduction - totalPreviousMonthProduction) /
          totalPreviousMonthProduction) *
        100
      : 0;

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {totalWeekProduction.toFixed(1)} L
          </div>
          <div className="flex items-center gap-1 text-xs">
            {getTrendIcon(weeklyChange)}
            <span className={getTrendColor(weeklyChange)}>
              {weeklyChange > 0 ? "+" : ""}
              {weeklyChange.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs last week</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-green-500" />
            Daily Average
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {avgDailyProduction.toFixed(1)} L
          </div>
          <p className="text-xs text-muted-foreground">
            {uniqueDaysThisWeek} days this week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-500" />
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {totalMonthProduction.toFixed(1)} L
          </div>
          <div className="flex items-center gap-1 text-xs">
            {getTrendIcon(monthlyChange)}
            <span className={getTrendColor(monthlyChange)}>
              {monthlyChange > 0 ? "+" : ""}
              {monthlyChange.toFixed(1)}%
            </span>
            <span className="text-muted-foreground">vs last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-orange-500" />
            Active Animals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {uniqueAnimalsThisWeek}
          </div>
          <p className="text-xs text-muted-foreground">
            {uniqueAnimalsThisMonth} this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            Peak Production
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">
            {totalProduction.toFixed(1)} L
          </div>
          <p className="text-xs text-muted-foreground">
            {milkingRecords.length} total records
            {peakStartDate
              ? ` · since ${format(peakStartDate, "MMM d, yyyy")}`
              : ""}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
