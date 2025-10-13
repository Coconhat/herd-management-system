"use client";

import { useState, useMemo } from "react";
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
import { differenceInDays, format, differenceInCalendarDays } from "date-fns";
import type { BreedingRecord } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  CalendarCheck,
  Clock,
  User,
  ArrowUpDown,
} from "lucide-react";

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

const clamp = (v: number, a = 0, b = 100) => Math.max(a, Math.min(b, v));

export function PregnancyClient({ animals }: PregnancyClientProps) {
  const [calvingModalOpen, setCalvingModalOpen] = useState(false);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PregnantRecord | null>(
    null
  );
  const [query, setQuery] = useState("");
  const [sortByNearest, setSortByNearest] = useState(true); // default: nearest calving first

  // Flatten + compute derived fields
  const pregnantRecords: PregnantRecord[] = useMemo(() => {
    return animals
      .flatMap((animal) =>
        animal.breeding_records
          .filter(
            (rec) =>
              rec.pd_result === "Pregnant" || rec.confirmed_pregnant === true
          )
          .map((rec) => ({
            ...rec,
            dam_ear_tag: animal.ear_tag,
            dam_id: animal.id,
            dam_name: animal.name,
          }))
      )
      .map((rec) => {
        // protect dates
        const expected = rec.expected_calving_date
          ? new Date(rec.expected_calving_date)
          : null;
        const bred = rec.breeding_date ? new Date(rec.breeding_date) : null;
        return { ...rec, __expected: expected, __bred: bred } as any;
      });
  }, [animals]);

  // Derived counters
  const totalPregnant = pregnantRecords.length;
  const dueSoonCount = pregnantRecords.filter((r) => {
    const expected = new Date(r.expected_calving_date);
    const days = differenceInCalendarDays(expected, new Date());
    return days <= 7;
  }).length;

  // Filter + sort
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let results = pregnantRecords.filter((r) => {
      if (!q) return true;
      return (
        r.dam_ear_tag.toLowerCase().includes(q) ||
        (r.dam_name && r.dam_name.toLowerCase().includes(q))
      );
    });

    results.sort((a, b) => {
      const aDays = differenceInCalendarDays(
        new Date(a.expected_calving_date),
        new Date()
      );
      const bDays = differenceInCalendarDays(
        new Date(b.expected_calving_date),
        new Date()
      );
      return sortByNearest ? aDays - bDays : bDays - aDays;
    });

    return results;
  }, [pregnantRecords, query, sortByNearest]);

  // Function to handle the calving button click
  const handleCalvingClick = (record: PregnantRecord) => {
    setSelectedRecord(record);

    // Check if the expected calving date has passed or is close
    const today = new Date();
    const expectedDate = new Date(record.expected_calving_date);
    const daysToCalving = differenceInCalendarDays(expectedDate, today);

    // If the expected date is more than 7 days in the future, show warning
    if (daysToCalving > 7) {
      setWarningModalOpen(true);
    } else {
      // Otherwise, directly open the calving modal
      setCalvingModalOpen(true);
    }
  };

  // percent of pregnancy progress roughly (assuming 283 days gestation)
  const pregnancyProgress = (rec: PregnantRecord) => {
    const bred = new Date(rec.breeding_date);
    const expected = new Date(rec.expected_calving_date);
    const totalDays = Math.max(1, differenceInCalendarDays(expected, bred));
    const passed = Math.max(0, differenceInCalendarDays(new Date(), bred));
    return clamp(Math.round((passed / totalDays) * 100), 0, 100);
  };

  // UI helpers
  const formatShortDate = (d?: string | Date) =>
    d ? format(new Date(d), "MMM d, yyyy") : "—";

  return (
    <Card className="w-full">
      {/* Header / Search / Stats */}
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Pregnant Animals</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Track expected calving dates and record births.
              </CardDescription>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-[320px]">
            <Input
              placeholder="Search ear tag or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search pregnant animals"
              className="w-full"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                title="Clear search"
              >
                <ChevronDown className="h-4 w-4 transform rotate-180 opacity-70" />
              </Button>
            )}
          </div>

          {/* stats chips */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-muted/40 px-3 py-1 rounded-lg">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">{totalPregnant}</div>
                <div className="text-xs text-muted-foreground">pregnant</div>
              </div>
            </div>

            <div
              className="flex items-center gap-2 px-3 py-1 rounded-lg"
              title={`${dueSoonCount} animals due within 7 days`}
            >
              <Clock className="h-4 w-4 text-amber-600" />
              <div className="text-sm">
                <div className="font-medium">{dueSoonCount}</div>
                <div className="text-xs text-muted-foreground">due soon</div>
              </div>
            </div>

            {/* sort toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortByNearest((s) => !s)}
              className="flex items-center gap-2"
              aria-pressed={sortByNearest}
              title="Toggle sort (nearest / furthest)"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span className="text-sm">
                {sortByNearest ? "Nearest" : "Furthest"}
              </span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop / Table view */}
        <div className="hidden md:block overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Dam</TableHead>
                <TableHead>Breed Date</TableHead>
                <TableHead>Expected Calving</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((rec) => {
                  const days = differenceInCalendarDays(
                    new Date(rec.expected_calving_date),
                    new Date()
                  );
                  const urgent = days <= 7;
                  const progress = pregnancyProgress(rec);

                  return (
                    <TableRow
                      key={rec.id}
                      className="odd:bg-background even:bg-muted/5 hover:bg-muted/10 transition-colors"
                    >
                      <TableCell>
                        <div className="font-medium">{rec.dam_ear_tag}</div>
                        <div className="text-sm text-muted-foreground">
                          {rec.dam_name || "Unnamed"}
                        </div>
                      </TableCell>

                      <TableCell>
                        {formatShortDate(rec.breeding_date)}
                      </TableCell>
                      <TableCell>
                        {formatShortDate(rec.expected_calving_date)}
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary">Pregnant</Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{days}</div>
                          <div className="text-sm text-muted-foreground">
                            days
                          </div>
                          {urgent && (
                            <Badge variant="destructive" className="ml-2">
                              Due soon
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="w-40">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-2 rounded-full ${
                                progress >= 90 ? "bg-emerald-500" : "bg-primary"
                              }`}
                              style={{ width: `${progress}%` }}
                              aria-hidden
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {progress}%
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleCalvingClick(rec)}
                            aria-label={`Record calving for ${rec.dam_ear_tag}`}
                          >
                            Record Calving
                          </Button>

                          <Link href={`/animal/${rec.dam_ear_tag}`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`View ${rec.dam_ear_tag}`}
                            >
                              View
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No pregnant animals found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile: card list */}
        <div className="md:hidden p-3 space-y-3">
          {filtered.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No pregnant animals found.
            </div>
          )}

          {filtered.map((rec) => {
            const days = differenceInCalendarDays(
              new Date(rec.expected_calving_date),
              new Date()
            );
            const urgent = days <= 7;
            const progress = pregnancyProgress(rec);

            return (
              <article
                key={rec.id}
                className="relative rounded-xl border bg-gradient-to-br from-background/60 to-muted/10 p-4 shadow-sm hover:shadow-md transition-shadow"
                aria-labelledby={`preg-${rec.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3
                      id={`preg-${rec.id}`}
                      className="flex items-center gap-2 text-base font-semibold truncate"
                    >
                      <CalendarCheck className="h-4 w-4 text-primary" />
                      <span>{rec.dam_ear_tag}</span>
                    </h3>
                    <div className="mt-1 text-sm text-muted-foreground truncate">
                      {rec.dam_name || "Unnamed"}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                      <div>
                        <div className="text-xs">Breed</div>
                        <div className="font-medium">
                          {formatShortDate(rec.breeding_date)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs">Expected</div>
                        <div className="font-medium">
                          {formatShortDate(rec.expected_calving_date)}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs">Status</div>
                        <div className="mt-1">
                          <Badge variant="secondary">Pregnant</Badge>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs">Days</div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="font-medium">{days}</div>
                          <div className="text-xs text-muted-foreground">
                            days
                          </div>
                          {urgent && (
                            <Badge variant="destructive" className="ml-2">
                              Due soon
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex flex-col items-end gap-3">
                    <div className="w-28">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-2 rounded-full ${
                            progress >= 90 ? "bg-emerald-500" : "bg-primary"
                          }`}
                          style={{ width: `${progress}%` }}
                          aria-hidden
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 text-right">
                        {progress}%
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleCalvingClick(rec)}
                        aria-label={`Record calving for ${rec.dam_ear_tag}`}
                        className="whitespace-nowrap"
                      >
                        Record
                      </Button>

                      <Link href={`/animal/${rec.dam_ear_tag}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
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
              status: "Active",
              created_at: "",
              updated_at: "",
            },
          ]}
        />
      )}
    </Card>
  );
}

export default PregnancyClient;
