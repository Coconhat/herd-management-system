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
import { differenceInDays, parseISO } from "date-fns";
import type { Animal } from "@/lib/actions/animals"; // Assuming Animal type is defined
import type { BreedingRecord } from "@/lib/types"; // Assuming BreedingRecord type is defined
import { updateBreedingPDResult } from "@/lib/actions/breeding";
import { useToast } from "@/components/ui/use-toast";
import { RecordMedicineModal } from "@/components/record-medicine-modal";
import { AlertTriangle, Check, X } from "lucide-react";

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
  } | null>(null);

  const needsPDCheck = animals.filter((a) =>
    a.breeding_records.some(
      (br) =>
        br.pd_result === "Unchecked" &&
        differenceInDays(today, parseISO(br.pregnancy_check_due_date)) >= 0
    )
  );

  const handleUpdatePD = async (
    breedingRecordId: number,
    animalId: number,
    result: "Pregnant" | "Empty"
  ) => {
    try {
      await updateBreedingPDResult(breedingRecordId, result);
      toast({
        title: "Success",
        description: "Pregnancy status has been updated.",
      });

      if (result === "Empty") {
        setActiveRecordForMedicine({ animalId, breedingRecordId });
        setMedicineModalOpen(true);
      }
    } catch (e) {
      toast({
        title: "Error",
        description: "Could not update status.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
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
                        Bred on:{" "}
                        {new Date(record.breeding_date).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            handleUpdatePD(record.id, animal.id, "Pregnant")
                          }
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Pregnant
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleUpdatePD(record.id, animal.id, "Empty")
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
            ) : (
              <p className="text-sm text-muted-foreground">
                No animals are due for a pregnancy diagnosis.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {activeRecordForMedicine && (
        <RecordMedicineModal
          open={medicineModalOpen}
          onOpenChange={setMedicineModalOpen}
          animalId={activeRecordForMedicine.animalId}
          breedingRecordId={activeRecordForMedicine.breedingRecordId}
        />
      )}
    </>
  );
}
