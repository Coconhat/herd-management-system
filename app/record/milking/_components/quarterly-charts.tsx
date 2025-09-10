"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MilkingRecord } from "@/lib/types";
import { Animal } from "@/lib/actions/animals";
import {
  startOfQuarter,
  endOfQuarter,
  format,
  isWithinInterval,
  eachMonthOfInterval,
  startOfMonth,
  endOfMonth,
  subQuarters,
  addQuarters,
} from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuarterlyChartsProps {
  milkingRecords: MilkingRecord[];
  animals: Animal[];
  onQuarterChange?: (quarter: Date) => void;
  selectedQuarter?: Date;
}

export function QuarterlyCharts({
  milkingRecords,
  animals,
  onQuarterChange,
  selectedQuarter: propSelectedQuarter,
}: QuarterlyChartsProps) {
  const [internalSelectedQuarter, setInternalSelectedQuarter] = useState<Date>(new Date());
  const [chartType, setChartType] = useState<"production" | "animals">(
    "production"
  );

  // Use prop if provided, otherwise use internal state
  const selectedQuarter = propSelectedQuarter || internalSelectedQuarter;
  const setSelectedQuarter = onQuarterChange || setInternalSelectedQuarter;

  const quarterStart = startOfQuarter(selectedQuarter);
  const quarterEnd = endOfQuarter(selectedQuarter);

  // Get records for the selected quarter
  const quarterRecords = milkingRecords.filter((record) =>
    isWithinInterval(new Date(record.milking_date), {
      start: quarterStart,
      end: quarterEnd,
    })
  );

  // Get months in the quarter
  const monthsInQuarter = eachMonthOfInterval({
    start: quarterStart,
    end: quarterEnd,
  });

  // Calculate monthly totals
  const monthlyData = monthsInQuarter.map((month) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const monthRecords = quarterRecords.filter((record) =>
      isWithinInterval(new Date(record.milking_date), {
        start: monthStart,
        end: monthEnd,
      })
    );

    const totalProduction = monthRecords.reduce(
      (sum, record) => sum + (record.milk_yield || 0),
      0
    );

    const uniqueAnimals = new Set(monthRecords.map((r) => r.animal_id)).size;
    const averagePerAnimal =
      uniqueAnimals > 0 ? totalProduction / uniqueAnimals : 0;

    return {
      month,
      totalProduction,
      recordCount: monthRecords.length,
      uniqueAnimals,
      averagePerAnimal,
    };
  });

  // Calculate quarter totals
  const quarterTotals = {
    totalProduction: quarterRecords.reduce(
      (sum, record) => sum + (record.milk_yield || 0),
      0
    ),
    recordCount: quarterRecords.length,
    uniqueAnimals: new Set(quarterRecords.map((r) => r.animal_id)).size,
  };

  // Find max production for scaling
  const maxProduction = Math.max(
    ...monthlyData.map((m) => m.totalProduction),
    1
  );

  // Get animal performance data
  const animalPerformance = animals
    .map((animal) => {
      const animalRecords = quarterRecords.filter(
        (r) => r.animal_id === animal.id
      );
      const totalProduction = animalRecords.reduce(
        (sum, record) => sum + (record.milk_yield || 0),
        0
      );
      const recordCount = animalRecords.length;
      const averagePerRecord =
        recordCount > 0 ? totalProduction / recordCount : 0;

      return {
        animal,
        totalProduction,
        recordCount,
        averagePerRecord,
      };
    })
    .filter((item) => item.totalProduction > 0)
    .sort((a, b) => b.totalProduction - a.totalProduction);

  const navigateQuarter = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setSelectedQuarter(subQuarters(selectedQuarter, 1));
    } else {
      setSelectedQuarter(addQuarters(selectedQuarter, 1));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>
                Quarterly Analysis - Q
                {Math.ceil((quarterStart.getMonth() + 1) / 3)}{" "}
                {quarterStart.getFullYear()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={chartType}
                onValueChange={(value: "production" | "animals") =>
                  setChartType(value)
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="animals">Animals</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateQuarter("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedQuarter(new Date())}
              >
                Current
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateQuarter("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {quarterTotals.totalProduction.toFixed(1)}L
              </div>
              <div className="text-sm text-muted-foreground">
                Total Production
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {quarterTotals.uniqueAnimals}
              </div>
              <div className="text-sm text-muted-foreground">
                Active Animals
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {quarterTotals.recordCount}
              </div>
              <div className="text-sm text-muted-foreground">Total Records</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Production Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Monthly Production Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data, index) => (
                <div key={data.month.toISOString()} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {format(data.month, "MMMM yyyy")}
                    </span>
                    <Badge variant="secondary">
                      {data.totalProduction.toFixed(1)}L
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (data.totalProduction / maxProduction) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{data.recordCount} records</span>
                    <span>{data.uniqueAnimals} animals</span>
                    <span>Avg: {data.averagePerAnimal.toFixed(1)}L/animal</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Animal Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Top Performers This Quarter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {animalPerformance.slice(0, 10).map((item, index) => (
                <div
                  key={item.animal.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? "bg-yellow-500 text-white"
                          : index === 1
                          ? "bg-gray-400 text-white"
                          : index === 2
                          ? "bg-amber-600 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">
                        {item.animal.ear_tag} - {item.animal.name || "Unnamed"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {item.recordCount} records • Avg:{" "}
                        {item.averagePerRecord.toFixed(1)}L
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {item.totalProduction.toFixed(1)}L
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparative Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Month</th>
                  <th className="text-right p-2 font-medium">Production (L)</th>
                  <th className="text-right p-2 font-medium">Records</th>
                  <th className="text-right p-2 font-medium">Animals</th>
                  <th className="text-right p-2 font-medium">Avg/Animal</th>
                  <th className="text-right p-2 font-medium">Avg/Record</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((data) => (
                  <tr
                    key={data.month.toISOString()}
                    className="border-b hover:bg-muted/30"
                  >
                    <td className="p-2 font-medium">
                      {format(data.month, "MMMM")}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {data.totalProduction.toFixed(1)}
                    </td>
                    <td className="p-2 text-right">{data.recordCount}</td>
                    <td className="p-2 text-right">{data.uniqueAnimals}</td>
                    <td className="p-2 text-right font-mono">
                      {data.averagePerAnimal.toFixed(1)}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {data.recordCount > 0
                        ? (data.totalProduction / data.recordCount).toFixed(1)
                        : "0.0"}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 bg-muted/50 font-bold">
                  <td className="p-2">Quarter Total</td>
                  <td className="p-2 text-right font-mono">
                    {quarterTotals.totalProduction.toFixed(1)}
                  </td>
                  <td className="p-2 text-right">
                    {quarterTotals.recordCount}
                  </td>
                  <td className="p-2 text-right">
                    {quarterTotals.uniqueAnimals}
                  </td>
                  <td className="p-2 text-right font-mono">
                    {quarterTotals.uniqueAnimals > 0
                      ? (
                          quarterTotals.totalProduction /
                          quarterTotals.uniqueAnimals
                        ).toFixed(1)
                      : "0.0"}
                  </td>
                  <td className="p-2 text-right font-mono">
                    {quarterTotals.recordCount > 0
                      ? (
                          quarterTotals.totalProduction /
                          quarterTotals.recordCount
                        ).toFixed(1)
                      : "0.0"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
