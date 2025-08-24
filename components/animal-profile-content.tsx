"use client";

import { useState, useEffect } from "react";
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
import { Calendar, Heart, Stethoscope, FileText, Edit } from "lucide-react";
import type { Animal } from "@/lib/actions/animals";
import type { Calving } from "@/lib/actions/calvings";
import type { HealthRecord } from "@/lib/actions/health-records";
import type { BreedingRecord } from "@/lib/actions/breeding-records";
import { getCalvingsByAnimalId } from "@/lib/actions/calvings";
import { getHealthRecordsByAnimalId } from "@/lib/actions/health-records";
import { getBreedingRecordsByAnimalId } from "@/lib/actions/breeding-records";
import { formatAge, formatWeight } from "@/lib/utils";

interface AnimalProfileContentProps {
  animal: Animal;
}

export function AnimalProfileContent({ animal }: AnimalProfileContentProps) {
  const [calvings, setCalvings] = useState<Calving[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [calvingsData, healthData, breedingData] = await Promise.all([
          getCalvingsByAnimalId(animal.id),
          getHealthRecordsByAnimalId(animal.id),
          getBreedingRecordsByAnimalId(animal.id),
        ]);

        setCalvings(calvingsData);
        setHealthRecords(healthData);
        setBreedingRecords(breedingData);
      } catch (error) {
        console.error("Error loading animal data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [animal.id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "N/A";
    return `$${amount.toFixed(2)}`;
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
              <label className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              <p className="text-lg font-semibold">{animal.name || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Breed
              </label>
              <p className="text-lg font-semibold">{animal.breed || "—"}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
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
              <label className="text-sm font-medium text-muted-foreground">
                Status
              </label>
              <Badge
                variant={animal.status === "Active" ? "default" : "secondary"}
                className={`mt-1 ${
                  animal.status === "Active" ? "bg-primary" : ""
                }`}
              >
                {animal.status}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Created
              </label>
              <p className="text-lg font-semibold">
                {formatDate(animal.created_at)}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calving" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Calving History
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Health Records
          </TabsTrigger>
          <TabsTrigger value="breeding" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Breeding Records
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
                        <TableHead>Calf Sex</TableHead>
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
                            {formatWeight(
                              calving.birth_weight?.toString() || ""
                            )}
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
              <CardDescription>
                {healthRecords.length} health records
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
                        <TableHead>Cost</TableHead>
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
                          <TableCell>{formatCurrency(record.cost)}</TableCell>
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

        {/* Breeding Records Tab */}
        <TabsContent value="breeding">
          <Card>
            <CardHeader>
              <CardTitle>Breeding Records</CardTitle>
              <CardDescription>
                {breedingRecords.length} breeding records
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
              ) : breedingRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Breeding Date</TableHead>
                        <TableHead>Sire Ear Tag</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Expected Calving</TableHead>
                        <TableHead>Confirmed Pregnant</TableHead>
                        <TableHead>Pregnancy Check</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {breedingRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {formatDate(record.breeding_date)}
                          </TableCell>
                          <TableCell className="font-medium">
                            {record.sire_ear_tag || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.breeding_method === "AI"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {record.breeding_method || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(record.expected_calving_date)}
                          </TableCell>
                          <TableCell>
                            {record.confirmed_pregnant !== undefined ? (
                              <Badge
                                variant={
                                  record.confirmed_pregnant
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {record.confirmed_pregnant ? "Yes" : "No"}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            {formatDate(record.pregnancy_check_date)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No breeding records found.
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
              {animal.notes ? (
                <div className="prose max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">
                    {animal.notes}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No notes available.
                </p>
              )}
              <div className="mt-6">
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Notes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
