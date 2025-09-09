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
import Link from "next/link";
import { differenceInDays, parseISO, isAfter } from "date-fns";
import type { Animal } from "@/lib/actions/animals";
import type { BreedingRecord } from "@/lib/types";
import { updateBreedingPDResult } from "@/lib/actions/breeding";
import { useToast } from "@/components/ui/use-toast";
import { RecordMedicineModal } from "@/components/record-medicine-modal";
import { AlertTriangle, Check, X, Syringe } from "lucide-react";

type AnimalWithBreeding = Animal & { breeding_records: BreedingRecord[] };

interface BreedingActionDashboardProps {
  animals: AnimalWithBreeding[];
}

export function BreedingActionDashboard({
  animals,
}: BreedingActionDashboardProps) {
  const { toast } = useToast();
  const today = new Date();

  const [medicineModalOpen, setMedicineModalOpen] = useState(false);
  const [activeRecordForMedicine, setActiveRecordForMedicine] = useState<{
    animalId: number;
    breedingRecordId: number;
    animalEarTag: string;
  } | null>(null);

  // Find animals that need PD checks
  const needsPDCheck = animals.filter((a) =>
    a.breeding_records.some(
      (br) =>
        br.pd_result === "Unchecked" &&
        differenceInDays(today, parseISO(br.pregnancy_check_due_date)) >= 0
    )
  );

  // Find animals that are marked as empty and need treatment
  const needsTreatment = animals.filter((a) =>
    a.breeding_records.some((br) => {
      if (br.pd_result !== "Empty") return false;

      // Check if treatment is still needed (within the treatment period)
      const treatmentDueDate = br.post_pd_treatment_due_date
        ? parseISO(br.post_pd_treatment_due_date)
        : null;

      return treatmentDueDate && isAfter(treatmentDueDate, today);
    })
  );

  // If there are no actions required, don't render anything
  if (needsPDCheck.length === 0 && needsTreatment.length === 0) {
    return null;
  }

  const handleUpdatePD = async (
    breedingRecordId: number,
    animalId: number,
    animalEarTag: string,
    result: "Pregnant" | "Empty"
  ) => {
    try {
      await updateBreedingPDResult(breedingRecordId, result);
      toast({
        title: "Success",
        description: "Pregnancy status has been updated.",
      });

      if (result === "Empty") {
        toast({
          title: "Marked Not Pregnant",
          description: "You can now provide Post-PD Treatment if needed.",
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Could not update status.",
        variant: "destructive",
      });
    }
  };

  const openMedicineModal = (
    animalId: number,
    breedingRecordId: number,
    animalEarTag: string
  ) => {
    setActiveRecordForMedicine({ animalId, breedingRecordId, animalEarTag });
    setMedicineModalOpen(true);
  };

  return (
    <>
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="text-yellow-500" /> Action Required
          </CardTitle>
          <CardDescription>
            Animals that require immediate attention in their breeding cycle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Needs Pregnancy Diagnosis Section */}
          {needsPDCheck.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">
                Needs Pregnancy Diagnosis ({needsPDCheck.length})
              </h3>
              <div className="space-y-2">
                {needsPDCheck.map((animal) => {
                  const record = animal.breeding_records.find(
                    (br) => br.pd_result === "Unchecked"
                  );
                  if (!record) return null;

                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-yellow-100 rounded-md border border-yellow-200"
                    >
                      <div className="flex-1">
                        <Link
                          href={`/animal/${animal.ear_tag}`}
                          className="font-medium hover:underline text-blue-600"
                        >
                          {animal.ear_tag}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          Bred on:{" "}
                          {new Date(record.breeding_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due:{" "}
                          {new Date(
                            record.pregnancy_check_due_date
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            handleUpdatePD(
                              record.id,
                              animal.id,
                              animal.ear_tag,
                              "Pregnant"
                            )
                          }
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Pregnant
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleUpdatePD(
                              record.id,
                              animal.id,
                              animal.ear_tag,
                              "Empty"
                            )
                          }
                        >
                          <X className="mr-2 h-4 w-4" />
                          Empty
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Needs Treatment Section */}
          {needsTreatment.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">
                Needs Post-PD Treatment ({needsTreatment.length})
              </h3>
              <div className="space-y-2">
                {needsTreatment.map((animal) => {
                  const record = animal.breeding_records.find(
                    (br) => br.pd_result === "Empty"
                  );
                  if (!record) return null;

                  return (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-blue-100 rounded-md border border-blue-200"
                    >
                      <div className="flex-1">
                        <Link
                          href={`/animal/${animal.ear_tag}`}
                          className="font-medium hover:underline text-blue-600"
                        >
                          {animal.ear_tag}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          Marked empty on:{" "}
                          {record.pregnancy_check_date
                            ? new Date(
                                record.pregnancy_check_date
                              ).toLocaleDateString()
                            : "Unknown date"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Treatment due:{" "}
                          {record.post_pd_treatment_due_date
                            ? new Date(
                                record.post_pd_treatment_due_date
                              ).toLocaleDateString()
                            : "Unknown date"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            openMedicineModal(
                              animal.id,
                              record.id,
                              animal.ear_tag
                            )
                          }
                          className="gap-1"
                        >
                          <Syringe className="h-4 w-4" />
                          Add Treatment
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <RecordMedicineModal
        open={medicineModalOpen}
        onOpenChange={setMedicineModalOpen}
        animalId={activeRecordForMedicine?.animalId || 0}
        breedingRecordId={activeRecordForMedicine?.breedingRecordId}
      />
    </>
  );
}
