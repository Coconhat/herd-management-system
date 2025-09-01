"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

import { getCalvingsWithDetails } from "@/lib/actions/calvings";
import type { CalvingWithDetails } from "@/lib/actions/calvings";
import { getAnimals } from "@/lib/actions/animals";
import type { Animal } from "@/lib/actions/animals";
import { CalvingRecordModal } from "@/components/calving-record-modal";
import { formatWeight, getPregnancyCheckDueDate } from "@/lib/utils";
import type { BreedingRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { addDays, isAfter, parseISO, set } from "date-fns";
import { updateBreedingPDResult } from "@/lib/actions/breeding";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecordBreedingModal } from "./breeding-history-table";

export function CalvingHistoryTable() {
  const [records, setRecords] = useState<CalvingWithDetails[]>([]);
  const [allAnimals, setAllAnimals] = useState<Animal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [calvingModalOpen, setCalvingModalOpen] = useState(false);

  // fetch calvings + animals on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [calvingData, animalsData] = await Promise.all([
        getCalvingsWithDetails(),
        getAnimals(),
      ]);
      setRecords(calvingData);
      setAllAnimals(animalsData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredRecords = records.filter(
    (record) =>
      record.calf_ear_tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.animals?.ear_tag?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <CalvingRecordModal
        open={calvingModalOpen}
        onOpenChange={setCalvingModalOpen}
        animals={allAnimals}
      />

      <Card className="h-full">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Calving History</CardTitle>
              <CardDescription>
                Search and manage all calving events.
              </CardDescription>
            </div>
            <Button onClick={() => setCalvingModalOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Record New Calving
            </Button>
          </div>
          <Input
            placeholder="Search by calf or dam ear tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-4"
          />
        </CardHeader>
        <CardContent>
          <div className="overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Calving Date</TableHead>
                  <TableHead>Dam</TableHead>
                  <TableHead>Calf Ear Tag</TableHead>
                  <TableHead>Calf Sex</TableHead>
                  <TableHead>Birth Wt.</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading records...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell>{formatDate(rec.calving_date)}</TableCell>
                      <TableCell>
                        <Link
                          href={`/animal/${rec.animal_id}`}
                          className="hover:underline text-primary font-medium"
                        >
                          {rec.animals?.ear_tag}{" "}
                          {rec.animals?.name && `(${rec.animals.name})`}
                        </Link>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {rec.calf_ear_tag || "—"}
                      </TableCell>
                      <TableCell>{rec.calf_sex || "—"}</TableCell>
                      <TableCell>
                        {formatWeight(rec.birth_weight?.toString() || "")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            rec.complications ? "destructive" : "default"
                          }
                          className={!rec.complications ? "bg-green-600" : ""}
                        >
                          {rec.complications || "Live Birth"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------
   BREEDING HISTORY TABLE (updated with Confirm PD button & dialog)
   Drop-in replacement for your previous BreedingHistoryTable function.
------------------------------------------------------------------ */

type AnimalWithBreeding = Animal & { breeding_records: BreedingRecord[] };

interface BreedingHistoryTableProps {
  animals: AnimalWithBreeding[];
}

const statusVariantMap: Record<
  string,
  "success" | "destructive" | "secondary" | "warning"
> = {
  Pregnant: "success",
  Empty: "destructive",
  Unchecked: "secondary",
};

export function BreedingHistoryTable({ animals }: BreedingHistoryTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<BreedingRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  //state to warn user if click before due date

  const [warnEarlyDialog, setWarnEarlyDialog] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<BreedingRecord | null>(
    null
  );

  const { toast } = useToast();

  const openConfirmPD = (rec: BreedingRecord) => {
    const pdDueDate = getPregnancyCheckDueDate(rec);
    const today = new Date();

    //if not due yet, warn user
    if (pdDueDate !== null && isAfter(pdDueDate, today)) {
      setPendingRecord(rec);
      setWarnEarlyDialog(true);
      return;
    }
    // otherwise open confirm directly
    setActiveRecord(rec);
    setDialogOpen(true);
  };

  // Flatten all breeding records from all animals into one list
  const allBreedingRecords = animals
    .flatMap((animal) =>
      animal.breeding_records.map((record) => ({
        ...record,
        dam_ear_tag: animal.ear_tag, // Add dam info for display
      }))
    )
    .sort(
      (a, b) =>
        new Date(b.breeding_date).getTime() -
        new Date(a.breeding_date).getTime()
    );

  // helper for expected calving (prefer stored, else +283)
  const getExpectedCalvingDate = (rec: BreedingRecord) => {
    if (rec.expected_calving_date) {
      try {
        return parseISO(rec.expected_calving_date);
      } catch {
        /* fallthrough */
      }
    }
    try {
      return addDays(parseISO(rec.breeding_date), 283);
    } catch {
      return null;
    }
  };

  const today = new Date();

  const handleConfirm = async (result: "Pregnant" | "Empty") => {
    if (!activeRecord) return;
    setIsProcessing(true);

    try {
      await updateBreedingPDResult(activeRecord.id, result);

      // optimistic UI: update the local record's pd_result & dates in-memory
      // NOTE: this won't persist across full-page refreshes — server revalidation will handle that.
      allBreedingRecords.forEach((r) => {
        if (r.id === activeRecord.id) {
          r.pd_result = result;
          r.pregnancy_check_date = new Date().toISOString().split("T")[0];
          if (result === "Pregnant") {
            r.expected_calving_date = addDays(parseISO(r.breeding_date), 283)
              .toISOString()
              .split("T")[0];
          } else {
            r.expected_calving_date = null;
          }
        }
      });

      toast({
        title: "Success",
        description: `Record ${activeRecord.id} marked as ${result}.`,
      });

      // If pregnant, tell user we scheduled a 9-month reminder (server side)
      if (result === "Pregnant") {
        toast({
          title: "Reminder scheduled",
          description:
            "A reminder for expected calving (≈9 months) has been scheduled.",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Could not update pregnancy status.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setDialogOpen(false);
      setActiveRecord(null);
    }
  };

  return (
    <>
      <RecordBreedingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        animals={animals}
      />

      {/* Early warning dialog */}
      <Dialog open={warnEarlyDialog} onOpenChange={setWarnEarlyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Not Due Yet</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              This record is not yet due for pregnancy diagnosis. Are you sure
              you want to continue?
            </p>
          </DialogHeader>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => {
                if (pendingRecord) {
                  setActiveRecord(pendingRecord);
                  setDialogOpen(true); // open real confirm
                }
                setWarnEarlyDialog(false);
                setPendingRecord(null);
              }}
            >
              Yes, Continue
            </Button>
            <Button variant="outline" onClick={() => setWarnEarlyDialog(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm PD dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Pregnancy Diagnosis</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Choose whether this record is Pregnant or Not Pregnant (Empty).
            </p>
          </DialogHeader>

          <div className="mt-4 flex gap-2">
            <Button
              onClick={() => handleConfirm("Pregnant")}
              disabled={isProcessing}
            >
              Pregnant
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleConfirm("Empty")}
              disabled={isProcessing}
            >
              Not Pregnant (Empty)
            </Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>All Breeding Records</CardTitle>
            <CardDescription>
              A complete historical log of all breeding events.
            </CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Record Breeding
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Breed Date</TableHead>
                <TableHead>Dam</TableHead>
                <TableHead>Sire</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBreedingRecords.map((rec) => {
                const pdDueDate = getPregnancyCheckDueDate(rec);
                const expectedCalving = getExpectedCalvingDate(rec);
                const isDueForPD =
                  rec.pd_result === "Unchecked" &&
                  pdDueDate !== null &&
                  !isAfter(pdDueDate, today); // pdDueDate <= today

                return (
                  <TableRow key={rec.id}>
                    <TableCell>
                      {new Date(rec.breeding_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/animal/${rec.dam_ear_tag}`}
                        className="hover:underline"
                      >
                        {rec.dam_ear_tag}
                      </Link>
                    </TableCell>
                    <TableCell>{rec.sire_ear_tag || "N/A"}</TableCell>
                    <TableCell>{rec.breeding_method || "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariantMap[rec.pd_result] || "secondary"}
                      >
                        {rec.pd_result}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rec.pd_result === "Pregnant"
                        ? expectedCalving
                          ? expectedCalving.toLocaleDateString()
                          : "—"
                        : pdDueDate
                        ? pdDueDate.toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openConfirmPD(rec)}>
                        Confirm PD
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
