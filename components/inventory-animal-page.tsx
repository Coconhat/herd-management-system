"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
import { Plus } from "lucide-react";
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
} from "recharts";

import { getAnimalStats, type Animal } from "@/lib/actions/animals";
import type { Calving } from "@/lib/types";
import { getReproStatus } from "@/lib/repro-status";

const CHART_COLORS = ["#1F2937", "#0EA5A4", "#7C3AED", "#F59E0B", "#EF4444"];

interface Props {
  animals?: Animal[]; // optional and will default to []
  calvings?: Calving[];
  stats?: Awaited<ReturnType<typeof getAnimalStats>>;
  pregnantAnimals?: Animal[];
}

export default function InventoryAnimalsPage({
  animals = [],
  calvings = [],
  stats,
  pregnantAnimals = [],
}: Props) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

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

  const statusCounts = useMemo(() => {
    const map = new Map<string, number>();
    (animals || []).forEach((a) =>
      map.set(
        a?.status || "Unknown",
        (map.get(a?.status || "Unknown") || 0) + 1
      )
    );
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
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
    return (animals || []).filter(
      (a) =>
        Array.isArray((a as any)?.breeding_records) &&
        (a as any).breeding_records.length > 0
    );
  }, [animals]);

  const filtered = (animals || []).filter(
    (a) =>
      (a?.ear_tag || "").toLowerCase().includes(search.toLowerCase()) ||
      (a?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // Helper to get repro status per-animal (so we don't call with undefined)
  const getStatusFor = (a: Animal) =>
    getReproStatus(a as any, calvings || [], (a as any).breeding_records || []);

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center gap-4 justify-between">
        <h1 className="text-2xl font-semibold">Animal Inventory</h1>
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

      {/* top cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Animals</CardTitle>
            <CardDescription>Overview of herd size</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAnimals}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pregnant</CardTitle>
            <CardDescription>Currently confirmed pregnant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pregnantCows}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calvings (last 6 months)</CardTitle>
            <CardDescription>Recent productivity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.recentCalvings}</div>
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
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ReTooltip />
                <Bar dataKey="value" fill={CHART_COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Expected Calving</TableHead>
                  <TableHead>Days Until Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pregnantAnimals.map((p) => {
                  const expected =
                    p.breeding_records?.[0]?.expected_calving_date || null;
                  const days =
                    expected && !Number.isNaN(new Date(expected).getTime())
                      ? Math.ceil(
                          (new Date(expected).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )
                      : null;

                  return (
                    <TableRow key={p.id}>
                      <TableCell>{p.ear_tag}</TableCell>
                      <TableCell>{p.name || "—"}</TableCell>
                      <TableCell>
                        {expected
                          ? new Date(expected).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>{days !== null ? `${days}d` : "—"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Pregnant</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {pregnantAnimals.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
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
                  <TableHead>Name</TableHead>
                  <TableHead>Latest Record</TableHead>
                  <TableHead>PD Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inseminated.map((a) => {
                  const status = getStatusFor(a as Animal);
                  const brs = (a as any).breeding_records || [];
                  const latest = brs.length ? brs[0] : null;
                  return (
                    <TableRow key={a.id}>
                      <TableCell>{a.ear_tag}</TableCell>
                      <TableCell>{a.name || "—"}</TableCell>
                      <TableCell>
                        {latest
                          ? new Date(latest.breeding_date).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant as any}>
                          {status.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {inseminated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
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
                  <TableHead>Name</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>Birth Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((a) => {
                  const status = getStatusFor(a as Animal);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>{a.ear_tag}</TableCell>
                      <TableCell>{a.name || "—"}</TableCell>
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
                        <Badge variant={status.variant as any}>
                          {status.label}
                          {status.days_until_due != null
                            ? ` — ${status.days_until_due}d`
                            : ""}
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
