import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsContent } from "./_components/reports-content";
import { getAnimalsWithBreedingData } from "@/lib/actions/animals";
import { getCalvingsWithDetails } from "@/lib/actions/calvings";
import { getMilkingRecords } from "@/lib/actions/milking";
import { getBreedingRecordsWithAnimalInfo } from "@/lib/actions/breeding";

async function ReportsData() {
  const [animals, calvings, milkingRecords, breedingRecords] =
    await Promise.all([
      getAnimalsWithBreedingData(),
      getCalvingsWithDetails(),
      getMilkingRecords(),
      getBreedingRecordsWithAnimalInfo(),
    ]);

  return (
    <ReportsContent
      animals={animals}
      calvings={calvings}
      milkingRecords={milkingRecords}
      breedingRecords={breedingRecords}
    />
  );
}

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Farm Reports</h1>
            <p className="text-muted-foreground">
              Comprehensive analytics and insights for your herd management
            </p>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          }
        >
          <ReportsData />
        </Suspense>
      </div>
    </div>
  );
}
