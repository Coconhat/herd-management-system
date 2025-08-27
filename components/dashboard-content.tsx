"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
import { Search, Plus, Ellipsis } from "lucide-react";
import type { Animal } from "@/lib/actions/animals";
import { CalvingRecordModal } from "@/components/calving-record-modal";
import { AddAnimalModal } from "@/components/add-animal-modal";
import { useToast } from "@/hooks/use-toast";
import { formatAge } from "@/lib/utils";
import Link from "next/link";
import type { Calving } from "@/lib/types";
import { getPostPregnantStatus } from "@/lib/get-post-pregnant-status";
import { getClassification } from "@/lib/get-classification";

interface DashboardContentProps {
  animals: Animal[];
  calvings: Calving[];
}

export function DashboardContent({ animals, calvings }: DashboardContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [calvingModalOpen, setCalvingModalOpen] = useState(false);
  const [addAnimalModalOpen, setAddAnimalModalOpen] = useState(false);
  const { toast } = useToast();

  const filteredAnimals = animals.filter(
    (animal) =>
      animal.ear_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      {/* Action Buttons and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2">
          <Button
            className="bg-primary hover:bg-primary/90"
            onClick={() => setCalvingModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Record New Calving
          </Button>
          <Button variant="outline" onClick={() => setAddAnimalModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Animal
          </Button>
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search animals by tag or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Animals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Animal Inventory</CardTitle>
          <CardDescription>
            Showing {filteredAnimals.length} of {animals.length} animals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ear Tag</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Birth Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnimals.map((animal) => (
                  <TableRow key={animal.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {animal.ear_tag}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          animal.sex === "Female" ? "secondary" : "outline"
                        }
                      >
                        {animal.sex || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {animal.birth_date ? formatAge(animal.birth_date) : "N/A"}
                    </TableCell>
                    <TableCell>
                      {animal.birth_date
                        ? (() => {
                            const { label, variant } =
                              getClassification(animal);
                            return <Badge variant={variant}>{label}</Badge>;
                          })()
                        : "N/A"}
                    </TableCell>
                    <TableCell>{formatDate(animal.birth_date)}</TableCell>

                    {/* Status column now shows animal.status and postpartum/pregnancy badge for females */}
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {animal.sex === "Female"
                          ? (() => {
                              const { label, variant } = getPostPregnantStatus(
                                animal,
                                calvings
                                // , manualStatusIfAny <- if you store manual selection on animal, pass it here
                              );
                              return (
                                <Badge variant={variant} className="text-xs">
                                  {label}
                                </Badge>
                              );
                            })()
                          : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Ellipsis />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem asChild>
                            <Link href={`/animal/${animal.id}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/animal/${animal.id}/edit`}>Edit</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CalvingRecordModal
        open={calvingModalOpen}
        onOpenChange={setCalvingModalOpen}
        animals={animals}
      />
      <AddAnimalModal
        open={addAnimalModalOpen}
        onOpenChange={setAddAnimalModalOpen}
        animals={animals}
      />
    </>
  );
}
