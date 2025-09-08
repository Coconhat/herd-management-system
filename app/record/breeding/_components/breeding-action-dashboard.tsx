"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, X, CalendarCheck } from "lucide-react";
import type { BreedingRecord } from "@/lib/types";
import { differenceInDays, parseISO } from "date-fns";
import { updateBreedingPDResult } from "@/lib/actions/breeding";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Animal } from "@/lib/actions/animals";

// Animal type must include breeding_records for this to work
type AnimalWithBreeding = Animal & { breeding_records: BreedingRecord[] };

interface BreedingActionDashboardProps {
  animals: AnimalWithBreeding[];
}

export function BreedingActionDashboard({
  animals,
}: BreedingActionDashboardProps) {
  const { toast } = useToast();
  const today = new Date();

  const needsPDCheck = animals.filter((a) =>
    a.breeding_records.some(
      (br: any) =>
        br.pd_result === "Unchecked" &&
        differenceInDays(today, parseISO(br.pregnancy_check_due_date)) >= 0
    )
  );

  const needsHeatCheck = animals.filter((a) =>
    a.breeding_records.some(
      (br: any) =>
        br.returned_to_heat === null &&
        differenceInDays(today, parseISO(br.heat_check_date)) >= 0 &&
        br.pd_result === "Unchecked" // Only show if not yet checked for pregnancy
    )
  );

  const handleUpdatePD = async (
    breedingRecordId: number,
    result: "Pregnant" | "Empty"
  ) => {
    try {
      await updateBreedingPDResult(breedingRecordId, result);
      toast({
        title: "Success",
        description: "Pregnancy status has been updated.",
      });
    } catch (e) {
      toast({ title: "Error", description: "Could not update status." });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="text-yellow-500" /> Action Required
        </CardTitle>
        <CardDescription>
          Animals that require immediate attention in their breeding cycle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section for animals needing a pregnancy diagnosis */}
        <div>
          <h3 className="font-semibold mb-2">
            Needs Pregnancy Diagnosis ({needsPDCheck.length})
          </h3>
          {needsPDCheck.length > 0 ? (
            <div className="space-y-2">
              {needsPDCheck.map((animal) => {
                const record = animal.breeding_records.find(
                  (br) => br.pd_result === "Unchecked"
                );
                if (!record) return null;
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <Link
                      href={`/animal/${animal.ear_tag}`}
                      className="font-medium hover:underline"
                    >
                      {animal.ear_tag}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      Bred on: {formatDate(record.breeding_date)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleUpdatePD(record.id, "Pregnant")}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Pregnant
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdatePD(record.id, "Empty")}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Empty
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No animals are due for a pregnancy diagnosis.
            </p>
          )}
        </div>

        {/* You would add a similar section here for `needsHeatCheck` */}
      </CardContent>
    </Card>
  );
}

// Helper for date formatting
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString();
