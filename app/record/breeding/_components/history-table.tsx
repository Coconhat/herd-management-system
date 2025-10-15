// components/_components/history-table.tsx
"use client";
import { useState, useEffect } from "react";
import {
  addDays,
  isAfter,
  parseISO,
  startOfToday,
  isValid,
  format,
} from "date-fns";
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
import {
  PlusCircle,
  CheckCircle,
  Syringe,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { RecordBreedingModal } from "./breeding-history-table";
import { RecordMedicineModal } from "@/components/record-medicine-modal";
import { getPregnancyCheckDueDate } from "@/lib/utils";
import { updateBreedingPDResult } from "@/lib/actions/breeding";
import { hasBreedingRecordTreatment } from "@/lib/actions/medicines";
import { useToast } from "@/hooks/use-toast";
import type { Animal } from "@/lib/actions/animals";
import type { BreedingRecord } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";

type AnimalWithBreeding = Animal & { breeding_records: BreedingRecord[] };

interface BreedingHistoryTableProps {
  animals: AnimalWithBreeding[];
}

const statusVariantMap: Record<
  string,
  "success" | "destructive" | "secondary" | "warning" | "default"
> = {
  Pregnant: "success",
  Empty: "destructive",
  Unchecked: "warning",
};

export function BreedingHistoryTable({ animals }: BreedingHistoryTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<BreedingRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // optimistic overrides + pinned records
  const [localOverrides, setLocalOverrides] = useState<
    Record<number, Partial<BreedingRecord>>
  >({});
  const [pinnedRecords, setPinnedRecords] = useState<
    Record<number, BreedingRecord>
  >({});

  // medicine modal state
  const [recordMedicineModalOpen, setRecordMedicineModalOpen] = useState(false);
  const [selectedBreedingRecordId, setSelectedBreedingRecordId] = useState<
    number | null
  >(null);
  const [selectedAnimalId, setSelectedAnimalId] = useState<number | null>(null);

  const [recordsWithTreatment, setRecordsWithTreatment] = useState<Set<number>>(
    new Set()
  );
  const [treatmentCheckCounter, setTreatmentCheckCounter] = useState(0);

  // early warning
  const [warnEarlyDialog, setWarnEarlyDialog] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<BreedingRecord | null>(
    null
  );

  const { toast } = useToast();

  const openConfirmPD = (rec: BreedingRecord) => {
    const pdDueDate = getPregnancyCheckDueDate(rec);
    const today = new Date();

    if (pdDueDate !== null && isAfter(pdDueDate, today)) {
      setPendingRecord(rec);
      setWarnEarlyDialog(true);
      return;
    }
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
        dam_name: animal.name,
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

  const combinedBreedingRecords = [
    ...baseBreedingRecords,
    ...Object.values(pinnedRecords).filter(
      (p) => !baseBreedingRecords.some((r) => r.id === p.id)
    ),
  ];

  const filteredRecords = combinedBreedingRecords.filter((record) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      record.dam_ear_tag?.toLowerCase().includes(searchLower) ||
      (record.dam_name &&
        record.dam_name.toLowerCase().includes(searchLower)) ||
      record.sire_ear_tag?.toLowerCase().includes(searchLower) ||
      record.breeding_method?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination calculations
  const totalRecords = filteredRecords.length;
  const totalPages = Math.ceil(totalRecords / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const emptyRecords = combinedBreedingRecords.filter(
      (r) => r.pd_result === "Empty" && (r as any).post_pd_treatment_due_date
    );
    if (emptyRecords.length === 0) return;

    const checkTreatments = async () => {
      const results = await Promise.all(
        emptyRecords.map(async (rec) => {
          const hasTreatment = await hasBreedingRecordTreatment(rec.id);
          return { id: rec.id, hasTreatment };
        })
      );
      const newSet = new Set<number>();
      results.forEach(({ id, hasTreatment }) => {
        if (hasTreatment) newSet.add(id);
      });
      setRecordsWithTreatment(newSet);
    };

    checkTreatments();
  }, [combinedBreedingRecords.length, treatmentCheckCounter]);

  // pinnedRecords cleanup (same logic as before)
  useEffect(() => {
    if (!Object.keys(pinnedRecords).length) return;
    const presentIds = new Set(baseBreedingRecords.map((r) => r.id));
    const nextPinned = { ...pinnedRecords };
    let changed = false;
    for (const idStr of Object.keys(pinnedRecords)) {
      const id = Number(idStr);
      const returned = baseBreedingRecords.find((r) => r.id === id);
      if (returned) {
        const hasHelper =
          (returned as any).post_pd_treatment_due_date ||
          (returned as any).keep_in_breeding_until;
        if (hasHelper) {
          delete nextPinned[id];
          changed = true;
        } else {
          if (returned.pd_result !== "Empty") {
            delete nextPinned[id];
            changed = true;
          }
        }
      } else {
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

  const getExpectedCalvingDate = (rec: BreedingRecord) => {
    if (rec.expected_calving_date) {
      try {
        return parseISO(rec.expected_calving_date);
      } catch {}
    }
    try {
      return addDays(parseISO(rec.breeding_date), 283);
    } catch {
      return null;
    }
  };

  const today = startOfToday();

  const handleConfirm = async (result: "Pregnant" | "Empty") => {
    if (!activeRecord) return;
    setIsProcessing(true);
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

      setPinnedRecords((p) => {
        if (!p[activeRecord.id]) return p;
        const copy = { ...p };
        delete copy[activeRecord.id];
        return copy;
      });
    } else {
      const postPdDate = addDays(new Date(), 29).toISOString().split("T")[0];

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
        toast({
          title: "Marked Not Pregnant",
          description:
            "This breeding was marked Not Pregnant. Click 'Treatment' button to record Post-PD medication.",
        });
      }
    } catch (err) {
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

  const isRecordVisible = (rec: BreedingRecord) => {
    if (rec.pd_result !== "Empty") return true;
    if (recordsWithTreatment.has(rec.id)) return true;
    const keepUntilStr =
      (rec as any).keep_in_breeding_until ||
      (rec as any).post_pd_treatment_due_date;
    if (!keepUntilStr) return true;
    const keepUntil = parseISO(keepUntilStr);
    if (!isValid(keepUntil)) return true;
    return today <= keepUntil;
  };

  const isPostPdButtonVisible = (rec: BreedingRecord) => {
    if (rec.pd_result !== "Empty") return false;
    const dueStr = (rec as any).post_pd_treatment_due_date;
    if (!dueStr) return false;
    const due = parseISO(dueStr);
    if (!isValid(due)) return false;
    return today <= due;
  };

  return (
    <>
      <RecordBreedingModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        animals={animals}
      />

      <RecordMedicineModal
        open={recordMedicineModalOpen}
        onOpenChange={(open) => {
          setRecordMedicineModalOpen(open);
          if (!open) setTreatmentCheckCounter((c) => c + 1);
        }}
        animalId={selectedAnimalId ?? 0}
        breedingRecordId={selectedBreedingRecordId ?? undefined}
      />

      <Dialog open={warnEarlyDialog} onOpenChange={setWarnEarlyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle>Not Due Yet</DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              This record is not yet due for pregnancy diagnosis. Are you sure
              you want to continue?
            </p>
          </DialogHeader>
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setWarnEarlyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingRecord) {
                  setActiveRecord(pendingRecord);
                  setDialogOpen(true);
                }
                setWarnEarlyDialog(false);
                setPendingRecord(null);
              }}
            >
              Yes, Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-primary mb-2">
              <CheckCircle className="h-5 w-5" />
              <DialogTitle>Confirm Pregnancy Diagnosis</DialogTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose whether this record is Pregnant or Not Pregnant (Empty).
            </p>
          </DialogHeader>

          <div className="mt-6 flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleConfirm("Empty")}
              disabled={isProcessing}
            >
              Not Pregnant
            </Button>
            <Button
              onClick={() => handleConfirm("Pregnant")}
              disabled={isProcessing}
            >
              Pregnant
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border shadow-sm h-full">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/50 py-4 gap-3">
          <div>
            <CardTitle className="text-xl">Breeding History</CardTitle>
            <CardDescription>
              A complete historical log of all breeding events
            </CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {searchTerm ? (
              <>
                <Input
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 sm:w-64"
                  autoFocus
                />
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                  className="gap-1"
                >
                  Reset
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setSearchTerm(" ")}
                className="gap-1"
              >
                <Calendar className="h-4 w-4" /> Search
              </Button>
            )}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="gap-1 whitespace-nowrap"
            >
              <PlusCircle className="h-4 w-4" />{" "}
              <span className="hidden sm:inline">New Record</span>
            </Button>
          </div>
        </CardHeader>

        {/* DESKTOP / TABLET: show table on md+ */}
        <CardContent className="p-0">
          <div className="hidden md:block overflow-x-auto">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-medium">Breed Date</TableHead>
                    <TableHead className="font-medium">Dam</TableHead>
                    <TableHead className="font-medium">Sire</TableHead>
                    <TableHead className="font-medium">Method</TableHead>
                    <TableHead className="font-medium">Status</TableHead>
                    <TableHead className="font-medium">Due Date</TableHead>
                    <TableHead className="font-medium text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRecords.map((rec) => {
                    if (!isRecordVisible(rec)) return null;
                    const pdDueDate = getPregnancyCheckDueDate(rec);
                    const expectedCalving = getExpectedCalvingDate(rec);
                    const dueForPD =
                      rec.pd_result === "Unchecked" &&
                      pdDueDate !== null &&
                      !isAfter(pdDueDate, today);

                    return (
                      <TableRow
                        key={rec.id}
                        className="group hover:bg-muted/30"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(
                              new Date(rec.breeding_date),
                              "MMM dd, yyyy"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <a
                            href={`/animal/${rec.dam_ear_tag}`}
                            className="hover:underline font-medium"
                          >
                            {rec.dam_ear_tag}
                            {rec.dam_name && (
                              <span className="text-muted-foreground block text-xs">
                                {rec.dam_name}
                              </span>
                            )}
                          </a>
                        </TableCell>
                        <TableCell>{rec.sire_ear_tag || "N/A"}</TableCell>
                        <TableCell>{rec.breeding_method || "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              statusVariantMap[rec.pd_result] || "secondary"
                            }
                            className="gap-1"
                          >
                            {rec.pd_result === "Unchecked" && (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            {rec.pd_result === "Pregnant" && (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            {rec.pd_result}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {rec.pd_result === "Pregnant"
                            ? expectedCalving
                              ? format(expectedCalving, "MMM dd, yyyy")
                              : "—"
                            : pdDueDate
                            ? format(pdDueDate, "MMM dd, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {recordsWithTreatment.has(rec.id) ? (
                            <Badge
                              variant="outline"
                              className="gap-1 bg-green-50 text-green-700 border-green-200"
                            >
                              <CheckCircle className="h-3 w-3" /> Treatment
                              Completed
                            </Badge>
                          ) : (
                            <div className="flex gap-2 justify-end">
                              {rec.pd_result === "Unchecked" && (
                                <Button
                                  size="sm"
                                  onClick={() => openConfirmPD(rec)}
                                  variant={dueForPD ? "default" : "outline"}
                                  className="gap-1"
                                >
                                  <CheckCircle className="h-3 w-3" /> Confirm PD
                                </Button>
                              )}

                              {isPostPdButtonVisible(rec) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedBreedingRecordId(rec.id);
                                    setSelectedAnimalId(
                                      rec.dam_id ?? rec.animal_id
                                    );
                                    setRecordMedicineModalOpen(true);
                                  }}
                                  className="gap-1"
                                >
                                  <Syringe className="h-3 w-3" /> Treatment
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {filteredRecords.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                {searchTerm
                  ? "No records match your search"
                  : "No breeding records found"}
              </div>
            )}
          </div>

          {/* MOBILE: compact list view */}
          <div className="md:hidden">
            <div className="flex flex-col gap-3 p-2">
              {paginatedRecords.map((rec) => {
                if (!isRecordVisible(rec)) return null;
                const pdDueDate = getPregnancyCheckDueDate(rec);
                const expectedCalving = getExpectedCalvingDate(rec);
                const dueForPD =
                  rec.pd_result === "Unchecked" &&
                  pdDueDate !== null &&
                  !isAfter(pdDueDate, today);

                return (
                  <Card key={rec.id} className="shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm font-medium truncate">
                              {format(
                                new Date(rec.breeding_date),
                                "MMM dd, yyyy"
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground ml-2 truncate">
                              {rec.breeding_method || "—"}
                            </div>
                          </div>

                          <div className="mt-2 text-sm text-muted-foreground grid grid-cols-2 gap-2">
                            <div className="truncate">
                              <div className="text-xs">Dam</div>
                              <div className="font-medium truncate">
                                {rec.dam_ear_tag}{" "}
                                {rec.dam_name ? (
                                  <span className="text-xs text-muted-foreground">
                                    • {rec.dam_name}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="truncate">
                              <div className="text-xs">Sire</div>
                              <div className="truncate">
                                {rec.sire_ear_tag || "N/A"}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs">Status</div>
                              <div className="mt-1">
                                {
                                  <Badge
                                    variant={
                                      statusVariantMap[rec.pd_result] ||
                                      "secondary"
                                    }
                                    className="gap-1"
                                  >
                                    {rec.pd_result === "Unchecked" && (
                                      <AlertTriangle className="h-3 w-3" />
                                    )}
                                    {rec.pd_result === "Pregnant" && (
                                      <CheckCircle className="h-3 w-3" />
                                    )}
                                    {rec.pd_result}
                                  </Badge>
                                }
                              </div>
                            </div>

                            <div>
                              <div className="text-xs">Due</div>
                              <div className="mt-1 text-sm">
                                {rec.pd_result === "Pregnant"
                                  ? expectedCalving
                                    ? format(expectedCalving, "MMM dd, yyyy")
                                    : "—"
                                  : pdDueDate
                                  ? format(pdDueDate, "MMM dd, yyyy")
                                  : "—"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                          {recordsWithTreatment.has(rec.id) ? (
                            <Badge
                              variant="outline"
                              className="gap-1 bg-green-50 text-green-700 border-green-200"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Badge>
                          ) : (
                            <>
                              {rec.pd_result === "Unchecked" && (
                                <Button
                                  size="sm"
                                  onClick={() => openConfirmPD(rec)}
                                  variant={dueForPD ? "default" : "outline"}
                                  className="whitespace-nowrap"
                                >
                                  <CheckCircle className="h-4 w-4" />{" "}
                                  <span className="ml-1 text-xs">
                                    Confirm PD
                                  </span>
                                </Button>
                              )}

                              {isPostPdButtonVisible(rec) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedBreedingRecordId(rec.id);
                                    setSelectedAnimalId(
                                      rec.dam_id ?? rec.animal_id
                                    );
                                    setRecordMedicineModalOpen(true);
                                  }}
                                  className="whitespace-nowrap"
                                >
                                  <Syringe className="h-4 w-4" />{" "}
                                  <span className="ml-1 text-xs">
                                    Treatment
                                  </span>
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredRecords.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  {searchTerm
                    ? "No records match your search"
                    : "No breeding records found"}
                </div>
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalRecords > 0 && (
            <div className="flex flex-col gap-3 px-4 py-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalRecords)} of{" "}
                  {totalRecords} records
                </div>

                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page > 1) setPage((prev) => prev - 1);
                          }}
                          className={
                            page === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (pageNum) => {
                          // Show first page, last page, current page, and pages around current
                          const showPage =
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            (pageNum >= page - 1 && pageNum <= page + 1);

                          if (!showPage) {
                            // Show ellipsis only once before/after current page
                            if (pageNum === page - 2 || pageNum === page + 2) {
                              return (
                                <PaginationItem key={pageNum}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }
                            return null;
                          }

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPage(pageNum);
                                }}
                                isActive={page === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (page < totalPages) setPage((prev) => prev + 1);
                          }}
                          className={
                            page === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default BreedingHistoryTable;
