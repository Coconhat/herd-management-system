"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddAnimalModal } from "@/components/add-animal-modal";
import { Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  LabelList,
} from "recharts";

import { getAnimalStats, type Animal } from "@/lib/actions/animals";
import type { Calving, BreedingRecord } from "@/lib/types";
import { getCombinedStatus } from "@/lib/status-helper";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "./ui/chart";

const CHART_COLORS = ["#1F2937", "#0EA5A4", "#7C3AED", "#F59E0B", "#EF4444"];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface Props {
  animals?: Animal[];
  calvings?: Calving[];
  stats?: Awaited<ReturnType<typeof getAnimalStats>>;
  pregnantAnimals?: Animal[];
  breedingRecords?: BreedingRecord[];
}

export default function InventoryAnimalsPage({
  animals = [],
  calvings = [],
  stats,
  pregnantAnimals = [],
  breedingRecords = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  // Helper function to get combined status for an animal
  const getCombinedStatusFor = (animal: Animal) => {
    const breedingRecords = (animal as any)?.breeding_records || [];
    return getCombinedStatus(animal, breedingRecords);
  };

  // Updated status counts using combined status
  const statusCounts = useMemo(() => {
    const map = new Map<string, number>();

    (animals || []).forEach((animal) => {
      if (animal?.sex !== "Female") return; // Dashboard only shows status for females

      const statusInfo = getCombinedStatusFor(animal);
      const statusLabel = statusInfo.label;

      map.set(statusLabel, (map.get(statusLabel) || 0) + 1);
    });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [animals]);

  // Derived stats (defensive)
  const sexDistribution = useMemo(() => {
    const male = (animals || []).filter((a) => a?.sex === "Male").length;
    const female = (animals || []).filter((a) => a?.sex === "Female").length;
    const unknown = Math.max(0, (animals || []).length - male - female);
    return [
      { name: "Female", value: female },
      { name: "Male", value: male },
      { name: "Unknown", value: unknown },
    ];
  }, [animals]);

  const calvingTrend = useMemo(() => {
    const now = new Date();
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      months[key] = 0;
    }
    (calvings || []).forEach((c) => {
      if (!c?.calving_date) return;
      const dt = new Date(c.calving_date);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      if (Object.prototype.hasOwnProperty.call(months, key)) months[key]++;
    });
    return Object.entries(months).map(([k, v]) => ({ month: k, count: v }));
  }, [calvings]);

  const inseminated = useMemo(() => {
    return (animals || []).filter((animal) => {
      const breedingRecords = (animal as any)?.breeding_records as
        | BreedingRecord[]
        | undefined;

      if (!Array.isArray(breedingRecords) || breedingRecords.length === 0) {
        return false;
      }

      return breedingRecords.some((br) => br.pd_result === "Unchecked");
    });
  }, [animals]);

  const filtered = (animals || []).filter(
    (a) =>
      (a?.ear_tag || "").toLowerCase().includes(search.toLowerCase()) ||
      (a?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center gap-4 ml-3 mt-6">
        <Link href="/">
          <Button>Back</Button>
        </Link>
        <h1 className="text-2xl font-semibold">Animal Inventory</h1>
        <div className="flex justify-end flex-1 mr-5">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search by tag or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Animal
            </Button>
          </div>
        </div>
      </div>

      {/* top cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Animals</CardTitle>
            <CardDescription>Overview of herd size</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalAnimals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pregnant</CardTitle>
            <CardDescription>Currently confirmed pregnant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pregnantCows}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calvings (last 6 months)</CardTitle>
            <CardDescription>Recent productivity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.recentCalvings}</div>
          </CardContent>
        </Card>
      </div>

      {/* charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* sex distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sex distribution</CardTitle>
            <CardDescription>Female vs Male</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sexDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  fill="#8884d8"
                  label
                >
                  {sexDistribution.map((_, i) => (
                    <Cell
                      key={i}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <ReTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* status counts */}
        <Card>
          <CardHeader>
            <CardTitle>Status counts</CardTitle>
            <CardDescription>Counts by status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart
                accessibilityLayer
                data={statusCounts}
                margin={{
                  top: 20,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="value" fill={CHART_COLORS[1]} radius={8}>
                  <LabelList
                    position="top"
                    offset={12}
                    className="fill-foreground"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="text-muted-foreground leading-none">
              Showing combined status for female animals
            </div>
          </CardFooter>
        </Card>

        {/* calving trend */}
        <Card>
          <CardHeader>
            <CardTitle>Calvings (6m)</CardTitle>
            <CardDescription>Monthly calving trend</CardDescription>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={calvingTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <ReTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_COLORS[2]}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pregnant list & inseminated */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pregnant cows</CardTitle>
            <CardDescription>
              Expected calving dates and days left
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ear Tag</TableHead>
                  <TableHead>Expected Calving</TableHead>
                  <TableHead>Days Until Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pregnantAnimals.map((animal) => {
                  const confirmedBreedingRecord = (
                    animal.breeding_records as BreedingRecord[] | undefined
                  )?.find(
                    (r) =>
                      (r.confirmed_pregnant || r.pd_result === "Pregnant") &&
                      r.expected_calving_date
                  );

                  let daysLeft = "—";
                  if (confirmedBreedingRecord?.expected_calving_date) {
                    const timeLeft =
                      new Date(
                        confirmedBreedingRecord.expected_calving_date
                      ).getTime() - Date.now();
                    const days = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
                    if (!isNaN(days)) {
                      daysLeft = days.toString();
                    }
                  }

                  return (
                    <TableRow key={animal.id}>
                      <TableCell>{animal.ear_tag}</TableCell>
                      <TableCell>
                        {confirmedBreedingRecord?.expected_calving_date
                          ? new Date(
                              confirmedBreedingRecord.expected_calving_date
                            ).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>{daysLeft}</TableCell>
                      <TableCell>
                        <Badge variant="default">Pregnant</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {pregnantAnimals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      No pregnant cows found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inseminated / In workflow</CardTitle>
            <CardDescription>Animals with breeding records</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ear Tag</TableHead>
                  <TableHead>Latest Record</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inseminated.map((a) => {
                  const statusInfo = getCombinedStatusFor(a);
                  const brs = (a as any).breeding_records || [];
                  const latest = brs.length ? brs[0] : null;
                  return (
                    <TableRow key={a.id}>
                      <TableCell>{a.ear_tag}</TableCell>
                      <TableCell>
                        {latest
                          ? new Date(latest.breeding_date).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {inseminated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6">
                      No insemination records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Full table */}
      <Card>
        <CardHeader>
          <CardTitle>Animals</CardTitle>
          <CardDescription>Full inventory</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>Birth Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => {
                  const statusInfo = getCombinedStatusFor(a);

                  // Calculate days until due for pregnant animals
                  let daysUntilDue = null;
                  if (statusInfo.status === "Pregnant") {
                    const breedingRecords = (a as any)?.breeding_records || [];
                    const latestBreeding = breedingRecords.sort(
                      (a: BreedingRecord, b: BreedingRecord) =>
                        new Date(b.breeding_date).getTime() -
                        new Date(a.breeding_date).getTime()
                    )[0];

                    if (latestBreeding?.expected_calving_date) {
                      const expectedDate = new Date(
                        latestBreeding.expected_calving_date
                      );
                      if (!isNaN(expectedDate.getTime())) {
                        daysUntilDue = Math.ceil(
                          (expectedDate.getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        );
                      }
                    }
                  }

                  return (
                    <TableRow key={a.id}>
                      <TableCell>{a.ear_tag}</TableCell>
                      <TableCell>
                        <Badge
                          variant={a.sex === "Female" ? "secondary" : "outline"}
                        >
                          {a.sex || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.birth_date
                          ? new Date(a.birth_date).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                          {daysUntilDue !== null ? ` — ${daysUntilDue}d` : ""}
                        </Badge>
                      </TableCell>
                      <TableCell>…actions…</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddAnimalModal
        open={addOpen}
        onOpenChange={setAddOpen}
        animals={animals}
      />
    </div>
  );
}
