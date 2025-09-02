"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { deleteMilkingRecord } from "@/lib/actions/milking";
import { MilkingRecord } from "@/lib/types";
import { Animal } from "@/lib/actions/animals";

interface MilkingRecordsTableProps {
  records: MilkingRecord[];
  animals: Animal[];
}

export function MilkingRecordsTable({
  records,
  animals,
}: MilkingRecordsTableProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  // Helper function to find animal by ID
  const getAnimalName = (animalId: number) => {
    const animal = animals.find((a) => a.id === animalId);
    return animal
      ? `${animal.ear_tag} - ${animal.name || "Unnamed"}`
      : `ID: ${animalId}`;
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
