"use client";

import type React from "react";
import { useState, useTransition, useEffect } from "react";
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

const commonBreeds = [
  "Holstein Friesian",
  "Jersey",
  "Kiwi Cross",
  "Sahiwal",
  "Gir",
  "Other",
];

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
  const [earTagError, setEarTagError] = useState<string | null>(null);
  const { toast } = useToast();

  const femaleAnimals = animals.filter(
    (animal) => animal.sex === "Female" && animal.status === "Active"
  );
  const maleAnimals = animals.filter(
    (animal) => animal.sex === "Male" && animal.status === "Active"
  );

  const validateEarTag = (earTag: string) => {
    if (!earTag) {
      setEarTagError("Ear tag is required.");
      return;
    }
    const isDuplicate = animals.some(
      (animal) => animal.ear_tag.toLowerCase() === earTag.toLowerCase().trim()
    );
    if (isDuplicate) {
      setEarTagError("An animal with this ear tag already exists.");
    } else {
      setEarTagError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (earTagError) return;

    const formData = new FormData(e.currentTarget);
    if (birthDate) {
      formData.set("birth_date", birthDate.toISOString().split("T")[0]);
    }

    startTransition(async () => {
      try {
        await createAnimal(formData);
        const earTag = formData.get("ear_tag") as string;
        toast({
          title: "Animal Added Successfully",
          description: `Animal ${earTag} has been added to your herd.`,
        });
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to add animal.",
          variant: "destructive",
        });
      }
    });
  };

  useEffect(() => {
    if (!open) {
      setBirthDate(undefined);
      setEarTagError(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Animal</DialogTitle>
          <DialogDescription>
            Add a new animal to your herd. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ear_tag">Ear Tag *</Label>
              <Input
                id="ear_tag"
                name="ear_tag"
                placeholder="e.g., 181"
                required
                onChange={(e) => validateEarTag(e.target.value)}
              />
              <p className="text-sm font-medium text-destructive">
                {earTagError}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g., Buttercup" />
            </div>
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

            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Select name="breed">
                <SelectTrigger>
                  <SelectValue placeholder="Select breed" />
                </SelectTrigger>
                <SelectContent>
                  {commonBreeds.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dam_id">Dam (Mother)</Label>
              <Select name="dam_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select dam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unknown</SelectItem>
                  {femaleAnimals.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>{`${
                      a.ear_tag
                    } - ${a.name || "Unnamed"}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sire_id">Sire (Father)</Label>
              <Select name="sire_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select sire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unknown</SelectItem>
                  {maleAnimals.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>{`${
                      a.ear_tag
                    } - ${a.name || "Unnamed"}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional notes about this animal..."
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !!earTagError}>
              {isPending ? "Adding..." : "Add Animal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
