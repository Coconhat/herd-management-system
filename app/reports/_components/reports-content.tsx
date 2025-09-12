"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  TrendingUp,
  Users,
  Milk,
  Heart,
  FileText,
  Download,
  Printer,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { Animal } from "@/lib/actions/animals";
import type { Calving, BreedingRecord, MilkingRecord } from "@/lib/types";

interface ReportsContentProps {
  animals: Animal[];
  calvings: Calving[];
  milkingRecords: MilkingRecord[];
  breedingRecords: BreedingRecord[];
}

const CHART_COLORS = [
  "#0EA5A4",
  "#7C3AED",
  "#F59E0B",
  "#EF4444",
  "#10B981",
  "#3B82F6",
];

export function ReportsContent({
  animals,
  calvings,
  milkingRecords,
  breedingRecords,
}: ReportsContentProps) {
  // CSV Export function for comprehensive farm data
  const exportToCSV = () => {
    const csvData: any[] = [];

    // Prepare comprehensive data for each animal
    animals.forEach((animal) => {
      const animalBreedings = breedingRecords.filter(
        (br) => br.animal_id === animal.id
      );
      const animalCalvings = calvings.filter((c) => c.animal_id === animal.id);
      const animalMilkings = milkingRecords.filter(
        (mr) => mr.animal_id === animal.id
      );

      // Calculate totals for this animal
      const totalMilkProduction = animalMilkings.reduce(
        (sum, mr) => sum + (mr.milk_yield || 0),
        0
      );
      const totalBreedings = animalBreedings.length;
      const totalCalvings = animalCalvings.length;
      const successfulBreedings = animalBreedings.filter(
        (br) => br.confirmed_pregnant || br.pd_result === "Pregnant"
      ).length;

      // Get latest breeding info
      const latestBreeding = animalBreedings.sort(
        (a, b) =>
          new Date(b.breeding_date).getTime() -
          new Date(a.breeding_date).getTime()
      )[0];

      // Get latest calving info
      const latestCalving = animalCalvings.sort(
        (a, b) =>
          new Date(b.calving_date).getTime() -
          new Date(a.calving_date).getTime()
      )[0];

      // Determine current status
      let currentStatus = "Open";
      if (
        latestBreeding?.confirmed_pregnant ||
        latestBreeding?.pd_result === "Pregnant"
      ) {
        currentStatus = "Pregnant";
      } else if (latestBreeding?.pd_result === "Unchecked") {
        currentStatus = "Bred (Unchecked)";
      }

      csvData.push({
        // Basic Animal Info
        "Ear Tag": animal.ear_tag || "",
        Name: animal.name || "",
        Sex: animal.sex || "",
        "Birth Date": animal.birth_date || "",
        "Age (days)": animal.birth_date
          ? Math.floor(
              (Date.now() - new Date(animal.birth_date).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : "",
        "Current Status": currentStatus,

        // Breeding Summary
        "Total Breedings": totalBreedings,
        "Successful Breedings": successfulBreedings,
        "Breeding Success Rate (%)":
          totalBreedings > 0
            ? Math.round((successfulBreedings / totalBreedings) * 100)
            : 0,
        "Latest Breeding Date": latestBreeding?.breeding_date || "",
        "Latest PD Result": latestBreeding?.pd_result || "",
        "Expected Calving Date": latestBreeding?.expected_calving_date || "",

        // Calving Summary
        "Total Calvings": totalCalvings,
        "Latest Calving Date": latestCalving?.calving_date || "",
        "Calf Sex": latestCalving?.calf_sex || "",
        "Calf Ear Tag": latestCalving?.calf_ear_tag || "",
        "Birth Weight (kg)": latestCalving?.birth_weight || "",
        Complications: latestCalving?.complications || "",

        // Milking Summary
        "Total Milk Production (L)": Math.round(totalMilkProduction * 10) / 10,
        "Total Milking Sessions": animalMilkings.length,
        "Average Milk Per Session (L)":
          animalMilkings.length > 0
            ? Math.round((totalMilkProduction / animalMilkings.length) * 10) /
              10
            : 0,
        "Last Milking Date":
          animalMilkings.length > 0
            ? animalMilkings.sort(
                (a, b) =>
                  new Date(b.milking_date).getTime() -
                  new Date(a.milking_date).getTime()
              )[0].milking_date
            : "",
      });
    });

    // Convert to CSV format
    if (csvData.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      ),
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `farm_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalAnimals = animals.length;
    const femaleAnimals = animals.filter((a) => a.sex === "Female").length;
    const totalCalvings = calvings.length;
    const totalMilkingSessions = milkingRecords.length;

    // Active pregnancies
    const activePregnancies = animals.filter((animal) => {
      const records = (animal as any)?.breeding_records || [];
      return records.some(
        (r: BreedingRecord) =>
          r.confirmed_pregnant || r.pd_result === "Pregnant"
      );
    }).length;

    // Total milk production
    const totalMilkProduction = milkingRecords.reduce(
      (sum, record) => sum + (record.milk_yield || 0),
      0
    );

    // Breeding success rate
    const totalBreedings = breedingRecords.length;
    const successfulBreedings = breedingRecords.filter(
      (r) => r.confirmed_pregnant || r.pd_result === "Pregnant"
    ).length;
    const breedingSuccessRate =
      totalBreedings > 0
        ? Math.round((successfulBreedings / totalBreedings) * 100)
        : 0;

    // Average milk per session
    const avgMilkPerSession =
      milkingRecords.length > 0
        ? Math.round((totalMilkProduction / milkingRecords.length) * 10) / 10
        : 0;

    return {
      totalAnimals,
      femaleAnimals,
      totalCalvings,
      totalMilkingSessions,
      activePregnancies,
      totalMilkProduction: Math.round(totalMilkProduction * 10) / 10,
      breedingSuccessRate,
      avgMilkPerSession,
    };
  }, [animals, calvings, milkingRecords, breedingRecords]);

  // Monthly trends
  const monthlyTrends = useMemo(() => {
    const now = new Date();
    const months: Record<string, any> = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      months[key] = {
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        calvings: 0,
        breedings: 0,
        milkingSessions: 0,
        milkProduction: 0,
      };
    }

    // Count calvings by month
    calvings.forEach((calving) => {
      const date = new Date(calving.calving_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      if (months[key]) {
        months[key].calvings++;
      }
    });

    // Count breedings by month
    breedingRecords.forEach((breeding) => {
      const date = new Date(breeding.breeding_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      if (months[key]) {
        months[key].breedings++;
      }
    });

    // Count milking sessions and production by month
    milkingRecords.forEach((record) => {
      const date = new Date(record.milking_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      if (months[key]) {
        months[key].milkingSessions++;
        months[key].milkProduction += record.milk_yield || 0;
      }
    });

    return Object.values(months);
  }, [calvings, breedingRecords, milkingRecords]);

  // Top producing animals
  const topProducers = useMemo(() => {
    const animalProduction: Record<
      number,
      { animal: Animal; totalMilk: number; sessions: number }
    > = {};

    milkingRecords.forEach((record) => {
      const animal = animals.find((a) => a.id === record.animal_id);
      if (animal) {
        if (!animalProduction[animal.id]) {
          animalProduction[animal.id] = {
            animal,
            totalMilk: 0,
            sessions: 0,
          };
        }
        animalProduction[animal.id].totalMilk += record.milk_yield || 0;
        animalProduction[animal.id].sessions++;
      }
    });

    return Object.values(animalProduction)
      .sort((a, b) => b.totalMilk - a.totalMilk)
      .slice(0, 10);
  }, [animals, milkingRecords]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const statusCounts = {
      Open: 0,
      Bred: 0,
      Pregnant: 0,
      Lactating: 0,
      Dry: 0,
    };

    animals
      .filter((a) => a.sex === "Female")
      .forEach((animal) => {
        const breedingRecords = (animal as any)?.breeding_records || [];

        if (
          breedingRecords.some(
            (r: BreedingRecord) =>
              r.confirmed_pregnant || r.pd_result === "Pregnant"
          )
        ) {
          statusCounts.Pregnant++;
        } else if (
          breedingRecords.some(
            (r: BreedingRecord) => r.pd_result === "Unchecked"
          )
        ) {
          statusCounts.Bred++;
        } else {
          statusCounts.Open++;
        }
      });

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [animals]);

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Animals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalAnimals}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.femaleAnimals} females
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Calvings
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalCalvings}</div>
            <p className="text-xs text-muted-foreground">All-time births</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Pregnancies
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.activePregnancies}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.breedingSuccessRate}% success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Milk Production
            </CardTitle>
            <Milk className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalMilkProduction}L
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.avgMilkPerSession}L avg/session
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>6-Month Activity Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="calvings"
                  stroke={CHART_COLORS[0]}
                  name="Calvings"
                />
                <Line
                  type="monotone"
                  dataKey="breedings"
                  stroke={CHART_COLORS[1]}
                  name="Breedings"
                />
                <Line
                  type="monotone"
                  dataKey="milkingSessions"
                  stroke={CHART_COLORS[2]}
                  name="Milking Sessions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Female Animal Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusDistribution.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Milk Production Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Milk Production Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="milkProduction"
                fill={CHART_COLORS[2]}
                name="Milk Production (L)"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Producers Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Milk Producers & Export Options</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export All Data (CSV)
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Ear Tag</TableHead>
                <TableHead>Total Production (L)</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Avg per Session</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducers.map((producer, index) => {
                const avgPerSession =
                  producer.sessions > 0
                    ? Math.round(
                        (producer.totalMilk / producer.sessions) * 10
                      ) / 10
                    : 0;

                return (
                  <TableRow key={producer.animal.id}>
                    <TableCell>
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {producer.animal.ear_tag}
                    </TableCell>
                    <TableCell>
                      {Math.round(producer.totalMilk * 10) / 10}
                    </TableCell>
                    <TableCell>{producer.sessions}</TableCell>
                    <TableCell>{avgPerSession}</TableCell>
                    <TableCell>
                      <Badge variant="outline">Active</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {topProducers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No milking records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Breeding Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <span className="font-bold">{metrics.breedingSuccessRate}%</span>
            </div>
            <div className="flex justify-between">
              <span>Total Breedings:</span>
              <span>{breedingRecords.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Pregnancies:</span>
              <span>{metrics.activePregnancies}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calving Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Total Calvings:</span>
              <span className="font-bold">{metrics.totalCalvings}</span>
            </div>
            <div className="flex justify-between">
              <span>Last 6 Months:</span>
              <span>
                {monthlyTrends.reduce((sum, month) => sum + month.calvings, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Calving Rate:</span>
              <span>
                {metrics.femaleAnimals > 0
                  ? Math.round(
                      (metrics.totalCalvings / metrics.femaleAnimals) * 100
                    )
                  : 0}
                %
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milk Production</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span>Total Production:</span>
              <span className="font-bold">{metrics.totalMilkProduction}L</span>
            </div>
            <div className="flex justify-between">
              <span>Total Sessions:</span>
              <span>{metrics.totalMilkingSessions}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg per Session:</span>
              <span>{metrics.avgMilkPerSession}L</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
