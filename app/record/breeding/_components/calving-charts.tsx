"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data, this would come from another server action
const monthlyData = [
  { name: "Jan", calvings: 4 },
  { name: "Feb", calvings: 3 },
  { name: "Mar", calvings: 8 },
  { name: "Apr", calvings: 6 },
  { name: "May", calvings: 5 },
  { name: "Jun", calvings: 10 },
];
const sireData = [
  { name: "POTTER", calves: 12 },
  { name: "RIZAL", calves: 9 },
  { name: "CYRUS", calves: 7 },
  { name: "RAMON", calves: 5 },
  { name: "WALT", calves: 4 },
];

export function CalvingsByMonthChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calvings by Month</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="name" stroke="#888888" fontSize={12} />
            <YAxis stroke="#888888" fontSize={12} />
            <Tooltip />
            <Bar dataKey="calvings" fill="#8884d8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SirePerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sire Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={sireData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={60}
              stroke="#888888"
              fontSize={12}
            />
            <Tooltip />
            <Bar dataKey="calves" fill="#82ca9d" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
