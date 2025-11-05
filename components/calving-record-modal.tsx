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
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { createCalvingFromPregnancy } from "@/lib/actions/calvings";
import { useToast } from "@/hooks/use-toast";
import type { Animal, BreedingRecord } from "@/lib/types";

// The Animal object passed in may include breeding_records
interface PregnantAnimal extends Animal {
  breeding_records?: BreedingRecord[];
}

interface CalvingRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Accept either a list of only pregnant animals, or the full animals list
  pregnantAnimals?: PregnantAnimal[] | null;
  animals?: PregnantAnimal[] | null;
}

export function CalvingRecordModal({
  open,
  onOpenChange,
  pregnantAnimals,
  animals,
}: CalvingRecordModalProps) {
  const [calvingDate, setCalvingDate] = useState<Date>();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Derive a safe array of pregnant animals:
  // Priority: use pregnantAnimals prop if provided, otherwise derive from 'animals' prop.
  const resolvedPregnant: PregnantAnimal[] =
    pregnantAnimals && Array.isArray(pregnantAnimals)
      ? pregnantAnimals
      : animals && Array.isArray(animals)
      ? animals.filter((a) =>
          (a.breeding_records || []).some((br) => br.pd_result === "Pregnant")
        )
      : [];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!calvingDate) {
      toast({
        title: "Error",
        description: "Please select the calving date.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("calving_date", calvingDate.toISOString().split("T")[0]);

    // The animal_id selected in the form is the Dam
    const selectedAnimalId = formData.get("animal_id")?.toString();
    const selectedAnimal = resolvedPregnant.find(
      (a) => a.id.toString() === selectedAnimalId
    );

    // Find the specific breeding record that resulted in this pregnancy
    const activeBreedingRecord = selectedAnimal?.breeding_records
      ?.filter((br) => br.pd_result === "Pregnant")
      .sort(
        (a, b) =>
          parseISO(b.breeding_date).getTime() -
          parseISO(a.breeding_date).getTime()
      )[0];

    if (!activeBreedingRecord) {
      toast({
        title: "Error",
        description:
          "Could not find the active pregnancy record for this animal.",
        variant: "destructive",
      });
      return;
    }

    // Add the breeding record ID to the form data to link the calving event to it
    formData.set("breeding_record_id", activeBreedingRecord.id.toString());
    // Also add the sire from the original breeding record if present
    if (activeBreedingRecord.sire_ear_tag) {
      formData.set("sire_ear_tag", activeBreedingRecord.sire_ear_tag);
    }

    startTransition(async () => {
      try {
        await createCalvingFromPregnancy(formData);
        toast({
          title: "Success!",
          description:
            "Calving recorded and new calf added to inventory. The Dam's status has been updated.",
        });
        // reset local state
        setCalvingDate(undefined);
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error Recording Calving",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirm Birth & Record Calving</DialogTitle>
          <DialogDescription>
            Select the dam that has given birth. This finalizes the pregnancy
            cycle and adds the new calf to your inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="animal_id">Pregnant Dam *</Label>
              <Select name="animal_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a confirmed pregnant animal" />
                </SelectTrigger>
                <SelectContent>
                  {resolvedPregnant.length === 0 ? (
                    <SelectItem disabled value="">
                      No confirmed pregnant animals
                    </SelectItem>
                  ) : (
                    resolvedPregnant.map((animal) => (
                      <SelectItem key={animal.id} value={animal.id.toString()}>
                        {animal.ear_tag} - {animal.name || "Unnamed"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Calving / Birth Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !calvingDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {calvingDate ? format(calvingDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={calvingDate}
                    onSelect={setCalvingDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Calf Information Section */}
            <div className="space-y-2">
              <Label htmlFor="calf_farm_source">Farm Source *</Label>
              <Select name="calf_farm_source" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select farm source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DH">DH</SelectItem>
                  <SelectItem value="Sam's">Sam's</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="calf_ear_tag">Calf Ear Tag *</Label>
              <Input
                id="calf_ear_tag"
                name="calf_ear_tag"
                placeholder="e.g., M201"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calf_name">Calf Name</Label>
              <Input
                id="calf_name"
                name="calf_name"
                placeholder="e.g., Junior"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calf_sex">Calf Sex *</Label>
              <Select name="calf_sex" required>
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
              <Label htmlFor="birth_weight">Birth Weight (kgs)</Label>
              <Input
                id="birth_weight"
                name="birth_weight"
                type="number"
                step="0.1"
                placeholder="e.g., 25.5"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="complications">Outcome & Complications</Label>
            <Select name="complications">
              <SelectTrigger>
                <SelectValue placeholder="Select outcome (default is Live Birth)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Live Birth">
                  Live Birth (No Complications)
                </SelectItem>
                <SelectItem value="Stillbirth">Stillbirth</SelectItem>
                <SelectItem value="Aborted">Aborted</SelectItem>
                <SelectItem value="Assisted">Live Birth (Assisted)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional observations..."
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
            <Button type="submit" disabled={!calvingDate || isPending}>
              {isPending ? "Completing Cycle..." : "Record Calving & Complete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
