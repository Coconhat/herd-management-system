"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalvingRecordModal } from "@/components/calving-record-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { differenceInDays } from "date-fns";
import type { BreedingRecord } from "@/lib/types";

interface AnimalWithBreeding {
  id: number;
  ear_tag: string;
  name?: string;
  breeding_records: BreedingRecord[];
}

interface PregnancyClientProps {
  animals: AnimalWithBreeding[];
}

type PregnantRecord = BreedingRecord & {
  dam_ear_tag: string;
  dam_id: number;
  dam_name?: string;
};

export function PregnancyClient({ animals }: PregnancyClientProps) {
  const [calvingModalOpen, setCalvingModalOpen] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PregnantRecord | null>(
    null
  );

  const pregnantRecords: PregnantRecord[] = animals
    .flatMap((animal) =>
      animal.breeding_records
        .filter((rec) => rec.pd_result === "Pregnant")
        .map((rec) => ({
          ...rec,
          dam_ear_tag: animal.ear_tag,
          dam_id: animal.id,
          dam_name: animal.name,
        }))
    )
    .sort(
      (a, b) =>
        new Date(a.expected_calving_date).getTime() -
        new Date(b.expected_calving_date).getTime()
    );

  // Function to handle the calving button click
  const handleCalvingClick = (record: PregnantRecord) => {
    setSelectedRecord(record);

    // Check if the expected calving date has passed or is close
    const today = new Date();
    const expectedDate = new Date(record.expected_calving_date);
    const daysToCalving = differenceInDays(expectedDate, today);

    // If the expected date is more than 7 days in the future, show warning
    if (daysToCalving > 7) {
      setWarningModalOpen(true);
    } else {
      // Otherwise, directly open the calving modal
      setCalvingModalOpen(true);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pregnant Animals</CardTitle>
          <CardDescription>
            Track expected calving dates and record births.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dam</TableHead>
              <TableHead>Breed Date</TableHead>
              <TableHead>Expected Calving</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pregnantRecords.length > 0 ? (
              pregnantRecords.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>
                    <Link
                      href={`/animal/${rec.dam_ear_tag}`}
                      className="hover:underline"
                    >
                      {rec.dam_ear_tag}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {new Date(rec.breeding_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(rec.expected_calving_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Pregnant</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCalvingClick(rec)}
                    >
                      Record Calving
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground"
                >
                  No pregnant animals found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Warning Dialog for Early Calving */}
      <AlertDialog open={warningModalOpen} onOpenChange={setWarningModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Early Calving Warning</AlertDialogTitle>
            <AlertDialogDescription>
              The expected calving date for this animal is{" "}
              {selectedRecord &&
                new Date(
                  selectedRecord.expected_calving_date
                ).toLocaleDateString()}
              , which is still more than a week away. Recording a calving now
              may be premature.
              <br />
              <br />
              Are you sure you want to record this calving as happening early?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setWarningModalOpen(false);
                setCalvingModalOpen(true);
              }}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Calving Record Modal */}
      {selectedRecord && (
        <CalvingRecordModal
          open={calvingModalOpen}
          onOpenChange={setCalvingModalOpen}
          pregnantAnimals={[
            {
              id: selectedRecord.dam_id,
              ear_tag: selectedRecord.dam_ear_tag,
              name: selectedRecord.dam_name,
              breeding_records: [selectedRecord],
              status: "Active", // Using "Active" as it's one of the allowed status values
              created_at: "",
              updated_at: "",
            },
          ]}
        />
      )}
    </Card>
  );
}
