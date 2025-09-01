import { Suspense } from "react";
import { getCalvingStats } from "@/lib/actions/stats";
import { CalvingHistoryTable } from "@/app/record/breeding/_components/history-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDriveDownload, Heart, BarChart3, PieChart } from "lucide-react";
import {
  CalvingsByMonthChart,
  SirePerformanceChart,
} from "@/app/record/breeding/_components/calving-charts";

// Server Component to fetch and display the KPI cards
async function StatCards() {
  const stats = await getCalvingStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Calvings (This Year)
          </CardTitle>
          <Heart className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {stats.totalCalvingsThisYear}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.calvingsLast30Days} in the last 30 days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Live Birth Rate
          </CardTitle>
          <PieChart className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            {stats.liveBirthRate}%
          </div>
          <p className="text-xs text-muted-foreground">
            Based on all recorded outcomes
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            M/F Ratio (This Year)
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <span className="text-blue-500">{stats.maleCalves}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-pink-500">{stats.femaleCalves}</span>
          </div>
          <p className="text-xs text-muted-foreground">Male / Female calves</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg. Calving Interval
          </CardTitle>
          <HardDriveDownload className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-500">
            {stats.avgCalvingInterval} days
          </div>
          <p className="text-xs text-muted-foreground">
            Average time between births
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CalvingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Calving Performance Center
        </h1>
        <p className="text-muted-foreground">
          Analyze reproductive performance and view all calving events in your
          herd.
        </p>
      </div>

      <Suspense fallback={<div>Loading stats...</div>}>
        <StatCards />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <CalvingHistoryTable />
        </div>
        <div className="lg:col-span-2 space-y-8">
          <CalvingsByMonthChart />
          <SirePerformanceChart />
        </div>
      </div>
    </div>
  );
}
