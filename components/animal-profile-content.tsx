"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Heart, Stethoscope, FileText, Edit, Save, X } from "lucide-react";
import {
  getAnimals,
  updateAnimalNotes,
  type Animal,
} from "@/lib/actions/animals";
import type { Calving } from "@/lib/actions/calvings";
import type { HealthRecord } from "@/lib/actions/health-records";
import { getCalvingsByAnimalId } from "@/lib/actions/calvings";
import { getHealthRecordsByAnimalId } from "@/lib/actions/health-records";
import { formatAge, formatWeight } from "@/lib/utils";
import HealthRecordModal from "@/app/animal/[ear_tag]/health/_component/animal-health";
import { Textarea } from "./ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface AnimalProfileContentProps {
  animal: Animal;
}

export function AnimalProfileContent({ animal }: AnimalProfileContentProps) {
  const [calvings, setCalvings] = useState<Calving[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [allAnimals, setAllAnimals] = useState<Animal[]>([]);
  const [sireDisplayName, setSireDisplayName] = useState<string | null>(null);
  const [editNotesOpen, setEditNotesOpen] = useState(false);
  const [notesValue, setNotesValue] = useState(animal.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [calvingsData, healthData] = await Promise.all([
          getCalvingsByAnimalId(animal.id),
          getHealthRecordsByAnimalId(animal.id),
        ]);

        setCalvings(calvingsData);
        setHealthRecords(healthData);
      } catch (error) {
        console.error("Error loading animal data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [animal.id]);

  useEffect(() => {
    async function fetchAnimals() {
      try {
        const animals = await getAnimals();
        setAllAnimals(animals);

        const hasSireValue =
          animal.sire_id !== undefined && animal.sire_id !== null;

        if (hasSireValue) {
          const sireIdCandidate = Number(animal.sire_id);
          let display: string | null = null;

          if (!Number.isNaN(sireIdCandidate)) {
            const sire = animals.find((item) => item.id === sireIdCandidate);
            if (sire) {
              const namePart =
                sire.name && sire.name.trim().length > 0
                  ? sire.name.trim()
                  : null;
              display = namePart
                ? `${namePart} (${sire.ear_tag})`
                : sire.ear_tag;
            }
          }

          if (!display) {
            const fallbackTag = `${animal.sire_id}`.trim();
            display = fallbackTag.length > 0 ? fallbackTag : null;
          }

          setSireDisplayName(display);
        } else {
          setSireDisplayName(null);
        }
      } catch (error) {
        console.error("Error fetching animals for sire lookup:", error);
      }
    }

    fetchAnimals();
  }, [animal.sire_id]);

  const calfSireLabels = useMemo(() => {
    if (allAnimals.length === 0) return new Map<number, string>();

    const byEarTag = new Map<string, Animal>();
    const byId = new Map<number, Animal>();

    allAnimals.forEach((entry) => {
      byEarTag.set(entry.ear_tag, entry);
      byId.set(entry.id, entry);
    });

    const result = new Map<number, string>();

    calvings.forEach((calving) => {
      if (!calving.calf_ear_tag) {
        result.set(calving.id, "—");
        return;
      }

      const calfRecord = byEarTag.get(calving.calf_ear_tag);
      const calfSireRaw = calfRecord?.sire_id;

      if (calfSireRaw !== undefined && calfSireRaw !== null) {
        const numericCandidate = Number(calfSireRaw);

        if (!Number.isNaN(numericCandidate)) {
          const sire = byId.get(numericCandidate);
          if (sire) {
            result.set(calving.id, sire.ear_tag);
            return;
          }
        }

        const fallbackTag = `${calfSireRaw}`.trim();
        if (fallbackTag.length > 0) {
          result.set(calving.id, fallbackTag);
          return;
        }
      }

      if (calving.sire_id !== undefined && calving.sire_id !== null) {
        const numericCandidate = Number(calving.sire_id);
        if (!Number.isNaN(numericCandidate)) {
          const sire = byId.get(numericCandidate);
          if (sire) {
            result.set(calving.id, sire.ear_tag);
            return;
          }
        }

        if (typeof calving.sire_id === "string") {
          const fallback = calving.sire_id.trim();
          if (fallback.length > 0) {
            result.set(calving.id, fallback);
            return;
          }
        }
      }

      result.set(calving.id, "—");
    });

    return result;
  }, [allAnimals, calvings]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A";
    return `$${amount.toFixed(2)}`;
  };

  const formatAssistance = (value: Calving["assistance_required"]): string => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    const maybeString = value as unknown;
    if (typeof maybeString === "string") {
      const normalized = maybeString.trim().toLowerCase();
      if (normalized === "true") return "Yes";
      if (normalized === "false") return "No";
    }

    return "—";
  };

  return (
    <>
      {/* Animal Basic Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Animal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Ear Tag
              </label>
              <p className="text-lg font-semibold text-primary">
                {animal.ear_tag}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mr-4">
                Sex
              </label>
              <Badge
                variant={animal.sex === "Female" ? "secondary" : "outline"}
                className="mt-1"
              >
                {animal.sex || "—"}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Birth Date
              </label>
              <p className="text-lg font-semibold">
                {formatDate(animal.birth_date)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Age
              </label>
              <p className="text-lg font-semibold">
                {animal.birth_date ? formatAge(animal.birth_date) : "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mr-4">
                Status
              </label>
              <Badge
                variant={animal.sex === "Female" ? "secondary" : "outline"}
              >
                {animal.pregnancy_status}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mr-4">
                Milking Status
              </label>
              <Badge
                variant={animal.sex === "Female" ? "secondary" : "outline"}
              >
                {animal.milking_status}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Health
              </label>
              <p className="text-lg font-semibold">{animal.health ?? "N/A"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Sire / Father
              </label>
              <p className="text-lg font-semibold">
                {sireDisplayName ?? "N/A"}
              </p>
            </div>
          </div>
          {animal.notes && (
            <div className="mt-6">
              <label className="text-sm font-medium text-muted-foreground">
                Notes
              </label>
              <p className="mt-1 text-foreground">{animal.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="calving" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calving" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Calving History
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Health Records
          </TabsTrigger>

          <TabsTrigger value="notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Calving History Tab */}
        <TabsContent value="calving">
          <Card>
            <CardHeader>
              <CardTitle>Calving History</CardTitle>
              <CardDescription>
                {calvings.length} calving records
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      {[...Array(6)].map((_, j) => (
                        <div
                          key={j}
                          className="h-4 w-20 bg-muted animate-pulse rounded"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : calvings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Calving Date</TableHead>
                        <TableHead>Calf Ear Tag</TableHead>
                        <TableHead>Sire Ear Tag</TableHead>
                        <TableHead>Calf Sex</TableHead>
                        <TableHead>Calf Health</TableHead>
                        <TableHead>Birth Weight</TableHead>
                        <TableHead>Assistance Required</TableHead>
                        <TableHead>Complications</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calvings.map((calving) => (
                        <TableRow key={calving.id}>
                          <TableCell>
                            {formatDate(calving.calving_date)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {calving.calf_ear_tag || "—"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {calfSireLabels.get(calving.id) ?? "—"}
                          </TableCell>
                          <TableCell>
                            {calving.calf_sex ? (
                              <Badge
                                variant={
                                  calving.calf_sex === "Female"
                                    ? "secondary"
                                    : "outline"
                                }
                              >
                                {calving.calf_sex}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                calving.health === "Unhealthy"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {calving.health ?? "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatWeight(
                              calving.birth_weight?.toString() || ""
                            )}
                          </TableCell>

                          <TableCell>
                            {formatAssistance(calving.assistance_required)}
                          </TableCell>
                          <TableCell>
                            {calving.complications || "None"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No calving records found.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Records Tab */}
        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle>Health Records</CardTitle>

              <CardDescription className="flex space-x-2 items-center">
                {healthRecords.length} health records
              </CardDescription>
            </CardHeader>

            <div className="px-6 pb-4">
              <HealthRecordModal animal={animal} />
            </div>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      {[...Array(6)].map((_, j) => (
                        <div
                          key={j}
                          className="h-4 w-20 bg-muted animate-pulse rounded"
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ) : healthRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Treatment</TableHead>
                        <TableHead>Veterinarian</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Medication</TableHead>
                        <TableHead>mL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {healthRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {formatDate(record.record_date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.record_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.description || "—"}</TableCell>
                          <TableCell>{record.treatment || "—"}</TableCell>
                          <TableCell>{record.veterinarian || "—"}</TableCell>
                          <TableCell>{record.notes || "—"}</TableCell>
                          <TableCell>{record.medication || "—"}</TableCell>
                          <TableCell>{record.ml || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No health records found.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>General Notes</CardTitle>
              <CardDescription>
                Additional information and observations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editNotesOpen ? (
                <div className="space-y-4">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Enter notes about this animal..."
                    rows={6}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        setIsSaving(true);
                        try {
                          await updateAnimalNotes(animal.id, notesValue);
                          toast({
                            title: "Notes saved",
                            description:
                              "Animal notes have been updated successfully.",
                          });
                          setEditNotesOpen(false);
                        } catch (error) {
                          toast({
                            title: "Error",
                            description:
                              "Failed to save notes. Please try again.",
                            variant: "destructive",
                          });
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save Notes"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNotesValue(animal.notes || "");
                        setEditNotesOpen(false);
                      }}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {notesValue ? (
                    <div className="prose max-w-none">
                      <p className="text-foreground whitespace-pre-wrap">
                        {notesValue}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No notes available. Click "Edit Notes" to add some.
                    </p>
                  )}
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setEditNotesOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Notes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
