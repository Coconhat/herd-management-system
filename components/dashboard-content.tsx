"use client";

import { Suspense, useEffect, useState } from "react";
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
import { deleteAnimal, type Animal } from "@/lib/actions/animals";
import { CalvingRecordModal } from "@/components/calving-record-modal";
import { AddAnimalModal } from "@/components/add-animal-modal";
import { useToast } from "@/hooks/use-toast";
import { formatAge } from "@/lib/utils";
import Link from "next/link";
import type { Calving } from "@/lib/types";
import { getPostPregnantStatus } from "@/lib/get-post-pregnant-status";
import { getClassification } from "@/lib/get-classification";
import DeleteAnimalModal from "./delete-animal-modal";
import { getCombinedStatus } from "@/lib/status-helper";
import { cn } from "@/lib/utils";
import renderFarmSource from "./get-origin-color";

interface DashboardContentProps {
  animals: Animal[];
  calvings: Calving[];
  breedingRecords?: any[];
}

// NOTE: This responsive version keeps the same behavior + pagination but
// shows a compact card list on small screens and the full table on md+ screens.
export function DashboardContent({
  animals,
  calvings,
  breedingRecords,
}: DashboardContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [calvingModalOpen, setCalvingModalOpen] = useState(false);
  const [addAnimalModalOpen, setAddAnimalModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<string | number | null>(
    null
  );

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { toast } = useToast();

  const filteredAnimals = animals.filter(
    (animal) =>
      animal.ear_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset to first page when search or pageSize or animals change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize, animals.length]);

  const totalItems = filteredAnimals.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  // Clamp page if things shrink
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedAnimals = filteredAnimals.slice(startIndex, endIndex);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const pageSizes = [5, 10, 25, 50];

  // -- condensed pager helper --
  const getPaginationRange = (
    total: number,
    current: number,
    siblingCount = 1
  ): (number | "left-ellipsis" | "right-ellipsis")[] => {
    const totalNumbers = siblingCount * 2 + 5; // first,last,current,2*siblings,2 ellipses
    if (total <= totalNumbers) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const left = Math.max(2, current - siblingCount);
    const right = Math.min(total - 1, current + siblingCount);

    const showLeftEllipsis = left > 2;
    const showRightEllipsis = right < total - 1;

    const pages: (number | "left-ellipsis" | "right-ellipsis")[] = [1];

    if (showLeftEllipsis) pages.push("left-ellipsis");

    for (let i = left; i <= right; i++) pages.push(i);

    if (showRightEllipsis) pages.push("right-ellipsis");

    pages.push(total);

    return pages;
  };

  const paginationItems = getPaginationRange(totalPages, page, 1);

  // Small utility to render status safely
  const renderStatusBadge = (animal: Animal) => {
    const statusInfo = getCombinedStatus(animal);
    const safeVariant =
      statusInfo.variant === "success"
        ? "secondary"
        : statusInfo.variant === "warning"
        ? "outline"
        : statusInfo.variant;

    return <Badge variant={safeVariant}>{statusInfo.label}</Badge>;
  };

  return (
    <>
      {/* Action Buttons and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm border border-gray-300 rounded-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search animals by tag or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-0"
          />
        </div>

        {/* Page size selector */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Per page</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border rounded px-2 py-1 text-sm"
            aria-label="Select page size"
          >
            {pageSizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop / Tablet Table */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle>Animal Inventory</CardTitle>
            <CardDescription>
              Showing {startIndex + 1 <= endIndex ? startIndex + 1 : 0}-
              {endIndex} of {animals.length} animals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Origin</TableHead>
                    <TableHead>Ear Tag</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Sex</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Birth Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAnimals.map((animal) => (
                    <TableRow key={animal.id} className="hover:bg-muted/50">
                      <TableCell>
                        {renderFarmSource(animal.farm_source)}
                      </TableCell>

                      <TableCell className="font-medium">
                        {animal.ear_tag}
                      </TableCell>
                      <TableCell className="font-medium">
                        {animal.weight ? `${animal.weight} kg` : "N/A"}
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
                        {animal.birth_date
                          ? formatAge(animal.birth_date)
                          : "N/A"}
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
                      <TableCell>{renderStatusBadge(animal)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Ellipsis />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem asChild>
                              <Link href={`/animal/${animal.ear_tag}`}>
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/animal/${animal.ear_tag}/edit`}>
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => {
                                setDeleteModalOpen(true);
                                setSelectedAnimal(animal.id);
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {paginatedAnimals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No animals found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  aria-label="Go to first page"
                >
                  {"<<"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  Prev
                </Button>

                <div className="flex items-center gap-1 px-2">
                  {paginationItems.map((item, idx) =>
                    typeof item === "number" ? (
                      <Button
                        key={idx}
                        size="sm"
                        variant={item === page ? "secondary" : "ghost"}
                        onClick={() => setPage(item)}
                      >
                        {item}
                      </Button>
                    ) : (
                      <span key={idx} className="px-2 select-none">
                        …
                      </span>
                    )
                  )}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  Next
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  aria-label="Go to last page"
                >
                  {">>"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile list: show compact cards (md:hidden) */}
      <div className="md:hidden">
        <div className="flex flex-col gap-3">
          {paginatedAnimals.map((animal) => (
            <Card key={animal.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium truncate">
                        {animal.ear_tag}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {animal.name || "—"}
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-muted-foreground grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">Sex:</span>
                        <Badge
                          variant={
                            animal.sex === "Female" ? "secondary" : "outline"
                          }
                        >
                          {animal.sex || "—"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">Age:</span>
                        <span>
                          {animal.birth_date
                            ? formatAge(animal.birth_date)
                            : "N/A"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">DOB:</span>
                        <span>{formatDate(animal.birth_date)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">Origin:</span>
                        {renderFarmSource(animal.farm_source)}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap">Status:</span>
                        {renderStatusBadge(animal)}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Ellipsis />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <Link href={`/animal/${animal.ear_tag}`}>
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/animal/${animal.ear_tag}/edit`}>
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            setDeleteModalOpen(true);
                            setSelectedAnimal(animal.id);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {paginatedAnimals.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No animals found.
            </div>
          )}
        </div>

        {/* Mobile pagination - simplified */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage(1)}
              disabled={page === 1}
              aria-label="Go to first page"
            >
              {"<<"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              Next
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              aria-label="Go to last page"
            >
              {">>"}
            </Button>
          </div>
        </div>
      </div>

      <AddAnimalModal
        open={addAnimalModalOpen}
        onOpenChange={setAddAnimalModalOpen}
        animals={animals}
      />
      <DeleteAnimalModal
        animal={animals.find((a) => a.id === selectedAnimal) || null}
        isOpen={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
      />
    </>
  );
}

export default DashboardContent;
