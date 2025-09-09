"use client";
import { useState, useEffect } from "react";
import { addDays, isAfter, parseISO, startOfToday, isValid } from "date-fns";
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
import { PlusCircle } from "lucide-react";
import { RecordBreedingModal } from "./breeding-history-table";
import { RecordMedicineModal } from "@/components/record-medicine-modal";
import { getPregnancyCheckDueDate } from "@/lib/utils";
import { updateBreedingPDResult } from "@/lib/actions/breeding";
import { useToast } from "@/hooks/use-toast";
import type { Animal } from "@/lib/actions/animals";
import type { BreedingRecord } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";

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

  // optimistic overrides (partial fields)
  const [localOverrides, setLocalOverrides] = useState<
    Record<number, Partial<BreedingRecord>>
  >({});
  // pinnedRecords hold full records that might be removed by server fetches — keep them visible
  const [pinnedRecords, setPinnedRecords] = useState<
    Record<number, BreedingRecord>
  >({});

  // medicine modal state
  const [recordMedicineModalOpen, setRecordMedicineModalOpen] = useState(false);
  const [selectedBreedingRecordId, setSelectedBreedingRecordId] = useState<
    number | null
  >(null);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);

  // early warning
  const [warnEarlyDialog, setWarnEarlyDialog] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<BreedingRecord | null>(
    null
  );

  const { toast } = useToast();

  const openConfirmPD = (rec: BreedingRecord) => {
    const pdDueDate = getPregnancyCheckDueDate(rec);
    const today = new Date();

    // if not due yet, warn user
    if (pdDueDate !== null && isAfter(pdDueDate, today)) {
      setPendingRecord(rec);
      setWarnEarlyDialog(true);
      return;
    }
    // otherwise open confirm directly
    setActiveRecord(rec);
    setDialogOpen(true);
  };

  // Build flattened list, apply local overrides
  const baseBreedingRecords = animals
    .flatMap((animal) =>
      animal.breeding_records.map((record) => ({
        ...record,
        dam_ear_tag: animal.ear_tag,
        dam_id: animal.id,
      }))
    )
    .map((r) => {
      const override = localOverrides[r.id];
      return override ? ({ ...r, ...override } as BreedingRecord) : r;
    })
    .sort(
      (a, b) =>
        new Date(b.breeding_date).getTime() -
        new Date(a.breeding_date).getTime()
    );

  // Combine with pinnedRecords that are not present in baseBreedingRecords
  const combinedBreedingRecords = [
    ...baseBreedingRecords,
    ...Object.values(pinnedRecords).filter(
      (p) => !baseBreedingRecords.some((r) => r.id === p.id)
    ),
  ];

  // Clean up pinnedRecords when server returns the record (present in baseBreedingRecords)
  useEffect(() => {
    if (!Object.keys(pinnedRecords).length) return;
    const presentIds = new Set(baseBreedingRecords.map((r) => r.id));
    const nextPinned = { ...pinnedRecords };
    let changed = false;
    for (const idStr of Object.keys(pinnedRecords)) {
      const id = Number(idStr);
      // If server returned the record, and the returned record has a post_pd_treatment_due_date,
      // we can stop pinning. If server returned the record but without the helper date, keep pinned
      const returned = baseBreedingRecords.find((r) => r.id === id);
      if (returned) {
        const hasHelper =
          (returned as any).post_pd_treatment_due_date ||
          (returned as any).keep_in_breeding_until;
        if (hasHelper) {
          delete nextPinned[id];
          changed = true;
        } else {
          // If server returned it and it's already Pregnant (or not Empty), unpin
          if (returned.pd_result !== "Empty") {
            delete nextPinned[id];
            changed = true;
          }
        }
      } else {
        // if not returned, check if pinned record expired (past its own keep date)
        const p = pinnedRecords[id];
        const keepStr =
          (p as any).keep_in_breeding_until ||
          (p as any).post_pd_treatment_due_date;
        if (keepStr) {
          const keep = parseISO(keepStr);
          if (isValid(keep) && startOfToday() > keep) {
            delete nextPinned[id];
            changed = true;
          }
        }
      }
    }
    if (changed) setPinnedRecords(nextPinned);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    baseBreedingRecords.map((r) => r.id).join(","),
    JSON.stringify(pinnedRecords),
  ]);

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

  const today = startOfToday();

  // Updated: optimistic update + pinning to avoid disappearance
  const handleConfirm = async (result: "Pregnant" | "Empty") => {
    if (!activeRecord) return;
    setIsProcessing(true);

    // optimistic local override so UI updates immediately (pre-server)
    const todayISO = new Date().toISOString().split("T")[0];

    if (result === "Pregnant") {
      const expectedCalving = addDays(parseISO(activeRecord.breeding_date), 283)
        .toISOString()
        .split("T")[0];

      setLocalOverrides((prev) => ({
        ...prev,
        [activeRecord.id]: {
          pd_result: "Pregnant",
          pregnancy_check_date: todayISO,
          expected_calving_date: expectedCalving,
        },
      }));

      // remove any pinned copy if exists
      setPinnedRecords((p) => {
        if (!p[activeRecord.id]) return p;
        const copy = { ...p };
        delete copy[activeRecord.id];
        return copy;
      });
    } else {
      // Empty: keep in breeding list for 29 days and show post-PD button
      const postPdDate = addDays(new Date(), 29).toISOString().split("T")[0];

      // partial override for server-synced cases
      setLocalOverrides((prev) => ({
        ...prev,
        [activeRecord.id]: {
          pd_result: "Empty",
          pregnancy_check_date: todayISO,
          expected_calving_date: null,
          post_pd_treatment_due_date: postPdDate,
          keep_in_breeding_until: postPdDate,
        } as Partial<BreedingRecord>,
      }));

      // Pin a *full* record copy so it won't vanish if server fetch excludes it temporarily
      setPinnedRecords((prev) => ({
        ...prev,
        [activeRecord.id]: {
          ...activeRecord,
          pd_result: "Empty",
          pregnancy_check_date: todayISO,
          expected_calving_date: null,
          post_pd_treatment_due_date: postPdDate,
          keep_in_breeding_until: postPdDate,
        } as unknown as BreedingRecord,
      }));
    }

    try {
      await updateBreedingPDResult(activeRecord.id, result);

      // success toasts
      if (result === "Pregnant") {
        toast({
          title: "Success",
          description: `Record ${activeRecord.id} marked as Pregnant.`,
        });
        toast({
          title: "Reminder scheduled",
          description:
            "A reminder for expected calving (≈9 months) has been scheduled.",
        });
      } else {
        // Immediately open the medicine modal for the newly marked Empty record
        setSelectedBreedingRecordId(activeRecord.id);
        setSelectedAnimalId(activeRecord.animal_id ?? activeRecord.animal_id);
        setRecordMedicineModalOpen(true);

        toast({
          title: "Marked Not Pregnant",
          description:
            "This breeding was marked Not Pregnant. You can provide Post-PD Treatment within 29 days.",
        });
      }
    } catch (err) {
      // revert optimistic update on error
      setLocalOverrides((prev) => {
        const copy = { ...prev };
        delete copy[activeRecord.id];
        return copy;
      });
      setPinnedRecords((p) => {
        const copy = { ...p };
        delete copy[activeRecord.id];
        return copy;
      });

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
      setPendingRecord(null);
    }
  };

  // Determine visibility and whether to show Post-PD Treatment button
  const isRecordVisible = (rec: BreedingRecord) => {
    // If not an Empty record, always visible
    if (rec.pd_result !== "Empty") return true;

    const keepUntilStr =
      (rec as any).keep_in_breeding_until ||
      (rec as any).post_pd_treatment_due_date;

    if (!keepUntilStr) return true; // fallback: keep visible

    const keepUntil = parseISO(keepUntilStr);
    if (!isValid(keepUntil)) return true; // fallback: keep visible on parse errors

    // Keep visible while today <= keepUntil (inclusive)
    return today <= keepUntil;
  };

  const isPostPdButtonVisible = (rec: BreedingRecord) => {
    if (rec.pd_result !== "Empty") return false;
    const dueStr = (rec as any).post_pd_treatment_due_date;
    if (!dueStr) return false;
    const due = parseISO(dueStr);
    if (!isValid(due)) return false;
    // Show button while today <= due (inclusive)
    return today <= due;
  };

  return (
    <>
      <RecordBreedingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        animals={animals}
      />

      {/* medicine modal */}
      <RecordMedicineModal
        open={recordMedicineModalOpen}
        onOpenChange={setRecordMedicineModalOpen}
        animalId={selectedAnimalId ?? 0}
        breedingRecordId={selectedBreedingRecordId ?? undefined}
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
              {combinedBreedingRecords.map((rec) => {
                // apply visibility rule
                if (!isRecordVisible(rec)) return null;

                const pdDueDate = getPregnancyCheckDueDate(rec);
                const expectedCalving = getExpectedCalvingDate(rec);
                const dueForPD =
                  rec.pd_result === "Unchecked" &&
                  pdDueDate !== null &&
                  !isAfter(pdDueDate, today); // pdDueDate <= today

                return (
                  <TableRow key={rec.id}>
                    <TableCell>
                      {new Date(rec.breeding_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`/animal/${rec.dam_ear_tag}`}
                        className="hover:underline"
                      >
                        {rec.dam_ear_tag}
                      </a>
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
                    <TableCell className="flex gap-2">
                      <Button size="sm" onClick={() => openConfirmPD(rec)}>
                        Confirm PD
                      </Button>

                      {isPostPdButtonVisible(rec) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedBreedingRecordId(rec.id);
                            setSelectedAnimalId(rec.dam_id ?? rec.animal_id);
                            setRecordMedicineModalOpen(true);
                          }}
                        >
                          Post-PD Treatment
                        </Button>
                      )}
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
