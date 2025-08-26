"use client";
import { useState, useEffect } from "react";
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
import { formatWeight } from "@/lib/utils";

export function CalvingHistoryTable() {
  const [records, setRecords] = useState<CalvingWithDetails[]>([]);

  const [allAnimals, setAllAnimals] = useState<Animal[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [calvingModalOpen, setCalvingModalOpen] = useState(false);

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
