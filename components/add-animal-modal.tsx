"use client";

import type React from "react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createAnimal } from "@/lib/actions/animals";
import { useToast } from "@/hooks/use-toast";
import type { Animal } from "@/lib/actions/animals";

interface AddAnimalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animals: Animal[];
}

export function AddAnimalModal({
  open,
  onOpenChange,
  animals,
}: AddAnimalModalProps) {
  const [birthDate, setBirthDate] = useState<Date>();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const femaleAnimals = animals.filter(
    (animal) => animal.sex === "Female" && animal.status === "Active"
  );
  const maleAnimals = animals.filter(
    (animal) => animal.sex === "Male" && animal.status === "Active"
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    if (birthDate) {
      formData.set("birth_date", birthDate.toISOString().split("T")[0]);
    }

    startTransition(async () => {
      try {
        await createAnimal(formData);

        const earTag = formData.get("ear_tag") as string;
        const name = formData.get("name") as string;

        toast({
          title: "Animal Added Successfully",
          description: `${earTag} ${
            name ? `(${name})` : ""
          } has been added to your herd`,
        });

        // Reset form
        setBirthDate(undefined);
        onOpenChange(false);
        (e.target as HTMLFormElement).reset();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add animal. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleCancel = () => {
    setBirthDate(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Animal</DialogTitle>
          <DialogDescription>
            Add a new animal to your herd. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ear Tag */}
            <div className="space-y-2">
              <Label htmlFor="ear_tag">Ear Tag *</Label>
              <Input
                id="ear_tag"
                name="ear_tag"
                placeholder="e.g., 009"
                required
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g., Buttercup" />
            </div>

            {/* Sex */}
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Select name="sex">
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Birth Date */}
            <div className="space-y-2">
              <Label>Birth Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="Active">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                  <SelectItem value="Culled">Culled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dam (Mother) */}
            <div className="space-y-2">
              <Label htmlFor="dam_id">Dam (Mother)</Label>
              <Select name="dam_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select dam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No dam selected</SelectItem>
                  {femaleAnimals.map((animal) => (
                    <SelectItem key={animal.id} value={animal.id.toString()}>
                      {animal.ear_tag} - {animal.name || "Unnamed"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sire (Father) */}
            <div className="space-y-2">
              <Label htmlFor="sire_id">Sire (Father)</Label>
              <Select name="sire_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select sire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No sire selected</SelectItem>
                  {maleAnimals.map((animal) => (
                    <SelectItem key={animal.id} value={animal.id.toString()}>
                      {animal.ear_tag} - {animal.name || "Unnamed"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional notes about this animal..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {isPending ? "Adding..." : "Add Animal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
