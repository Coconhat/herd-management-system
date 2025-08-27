"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Search, Plus } from "lucide-react";
import type { Animal } from "@/lib/actions/animals";
import { CalvingRecordModal } from "@/components/calving-record-modal";
import { AddAnimalModal } from "@/components/add-animal-modal";
import { useToast } from "@/hooks/use-toast";
import { formatAge } from "@/lib/utils";
import Link from "next/link";

interface DashboardContentProps {
  animals: Animal[];
}

export function DashboardContent({ animals }: DashboardContentProps) {
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

  function getClassification(animal: Animal) {
    if (animal.birth_date) {
      const birth = new Date(animal.birth_date);
      const today = new Date();
      const diffTime = today.getTime() - birth.getTime();
      const ageInDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (ageInDays >= 1 && ageInDays <= 90) return "Newly Calved";
      if (ageInDays >= 91 && ageInDays <= 180) return "Weaning";
      if (ageInDays >= 181 && ageInDays <= 360) return "Yearling";
      if (ageInDays >= 361 && ageInDays <= 450) return "Heifer";
      if (ageInDays >= 451 && ageInDays <= 540) return "Breedable Heifer";

      return "Fully Grown";
    }
    return "Unknown";
  }

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
                      {animal.birth_date ? (
                        <Badge variant="outline">
                          {getClassification(animal)}
                        </Badge>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell>{formatDate(animal.birth_date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          animal.status === "Active" ? "default" : "secondary"
                        }
                        className={
                          animal.status === "Active" ? "bg-primary" : ""
                        }
                      >
                        {animal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/animal/${animal.id}`}>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </Link>
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
