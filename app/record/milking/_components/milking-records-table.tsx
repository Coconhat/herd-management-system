"use client";

import { useState } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { deleteMilkingRecord } from "@/lib/actions/milking";
import { MilkingRecord } from "@/lib/types";
import { Animal } from "@/lib/actions/animals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MilkingRecordsTableProps {
  records: MilkingRecord[];
  animals: Animal[];
  viewMode?: "table" | "excel";
  onWeekChange?: (week: Date) => void;
  selectedWeek?: Date;
}

export function MilkingRecordsTable({
  records,
  animals,
  viewMode = "table",
  onWeekChange,
  selectedWeek: propSelectedWeek,
}: MilkingRecordsTableProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [internalSelectedWeek, setInternalSelectedWeek] = useState<Date>(
    new Date()
  );

  // Use prop if provided, otherwise use internal state
  const selectedWeek = propSelectedWeek || internalSelectedWeek;
  const setSelectedWeek = onWeekChange || setInternalSelectedWeek;

  // Helper function to find animal by ID
  const getAnimalName = (animalId: number) => {
    const animal = animals.find((a) => a.id === animalId);
    return animal
      ? `${animal.ear_tag} - ${animal.name || "Unnamed"}`
      : `ID: ${animalId}`;
  };

  // Excel-like view functions
  const getWeekDays = (date: Date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
    const end = endOfWeek(date, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const getMilkingForDay = (animalId: number, date: Date) => {
    const dayRecords = records.filter(
      (r) =>
        r.animal_id === animalId && isSameDay(new Date(r.milking_date), date)
    );
    return dayRecords.reduce((total, r) => total + (r.milk_yield || 0), 0);
  };

  const getWeekTotal = (animalId: number) => {
    const weekDays = getWeekDays(selectedWeek);
    return weekDays.reduce(
      (total, day) => total + getMilkingForDay(animalId, day),
      0
    );
  };

  const handleDelete = async (recordId: number) => {
    try {
      setIsDeleting(recordId);
      await deleteMilkingRecord(recordId);
      toast({
        title: "Record deleted",
        description: "Milking record has been deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete milking record",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (viewMode === "excel") {
    const weekDays = getWeekDays(selectedWeek);
    const milkingAnimals = animals.filter((animal) =>
      records.some((r) => r.animal_id === animal.id)
    );

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Milk Production - {format(selectedWeek, "MMM d, yyyy")}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedWeek(
                      new Date(selectedWeek.getTime() - 7 * 24 * 60 * 60 * 1000)
                    )
                  }
                >
                  Previous Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWeek(new Date())}
                >
                  Current Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectedWeek(
                      new Date(selectedWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
                    )
                  }
                >
                  Next Week
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px] sticky left-0 bg-background">
                      Animal
                    </TableHead>
                    {weekDays.map((day) => (
                      <TableHead
                        key={day.toISOString()}
                        className="text-center min-w-[100px]"
                      >
                        <div className="space-y-1">
                          <div className="font-medium">
                            {format(day, "EEE")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(day, "MM/dd")}
                          </div>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center min-w-[100px] bg-muted font-medium">
                      Week Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milkingAnimals.map((animal) => (
                    <TableRow key={animal.id}>
                      <TableCell className="font-medium sticky left-0 bg-background">
                        <div>
                          <div className="font-medium">{animal.ear_tag}</div>
                          <div className="text-sm text-muted-foreground">
                            {animal.name || "Unnamed"}
                          </div>
                        </div>
                      </TableCell>
                      {weekDays.map((day) => {
                        const yield_ = getMilkingForDay(animal.id, day);
                        return (
                          <TableCell
                            key={day.toISOString()}
                            className="text-center"
                          >
                            {yield_ > 0 ? (
                              <Badge variant="secondary">
                                {yield_.toFixed(1)}L
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center bg-muted">
                        <Badge variant="default" className=" font-bold">
                          {getWeekTotal(animal.id).toFixed(1)}L
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Daily totals row */}
                  <TableRow className="border-t-2 bg-muted/50">
                    <TableCell className="font-bold sticky left-0 bg-muted">
                      Daily Totals
                    </TableCell>
                    {weekDays.map((day) => {
                      const dayTotal = milkingAnimals.reduce(
                        (total, animal) =>
                          total + getMilkingForDay(animal.id, day),
                        0
                      );
                      return (
                        <TableCell
                          key={day.toISOString()}
                          className="text-center"
                        >
                          <Badge variant="outline" className=" font-bold">
                            {dayTotal.toFixed(1)}L
                          </Badge>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center bg-muted">
                      <Badge className=" font-bold text-lg">
                        {milkingAnimals
                          .reduce(
                            (total, animal) => total + getWeekTotal(animal.id),
                            0
                          )
                          .toFixed(1)}
                        L
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Standard table view
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Animal</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Milk Yield (L)</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={10}
                className="text-center py-6 text-muted-foreground"
              >
                No milking records found
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{getAnimalName(record.animal_id)}</TableCell>
                <TableCell>
                  {format(new Date(record.milking_date), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="text-right">
                  {record.milk_yield?.toFixed(1) || "-"}
                </TableCell>

                <TableCell className="max-w-[200px] truncate">
                  {record.notes || "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={isDeleting === record.id}
                        onClick={() => handleDelete(record.id)}
                        className="text-destructive"
                      >
                        {isDeleting === record.id ? (
                          <span>Deleting...</span>
                        ) : (
                          <>
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
