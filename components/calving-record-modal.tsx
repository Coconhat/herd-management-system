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
import { Checkbox } from "@/components/ui/checkbox";
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
import { createCalving } from "@/lib/actions/calvings";
import { useToast } from "@/hooks/use-toast";
import { createAnimal, type Animal } from "@/lib/actions/animals";

interface CalvingRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animals: Animal[];
}

export function CalvingRecordModal({
  open,
  onOpenChange,
  animals,
}: CalvingRecordModalProps) {
  const [calvingDate, setCalvingDate] = useState<Date>();
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!calvingDate) {
      toast({
        title: "Error",
        description: "Please select a calving date",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("calving_date", calvingDate.toISOString().split("T")[0]);

    startTransition(async () => {
      try {
        await createCalving(formData);

        const animalId = Number.parseInt(formData.get("animal_id") as string);
        const animal = animals.find((a) => a.id === animalId);
        const animalName = animal
          ? `${animal.ear_tag} (${animal.name || "Unnamed"})`
          : `Animal ${animalId}`;

        toast({
          title: "Calving Recorded Successfully",
          description: `New calf added to inventory for ${animalName}.`,
        });

        // Reset form
        setCalvingDate(undefined);
        onOpenChange(false);
        (e.target as HTMLFormElement).reset();
      } catch (error) {
        toast({
          title: "Error",
          // Display the specific error message from the server if it exists
          description:
            error instanceof Error
              ? error.message
              : "Failed to record calving. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleCancel = () => {
    setCalvingDate(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record New Calving</DialogTitle>
          <DialogDescription>
            Record a new calving event for one of your animals. Fields marked
            with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Animal Selection */}
            <div className="space-y-2">
              <Label htmlFor="animal_id">Dam (Mother) *</Label>
              <Select name="animal_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a dam" />
                </SelectTrigger>
                <SelectContent>
                  {animals.map((animal) => (
                    <SelectItem key={animal.id} value={animal.id.toString()}>
                      {animal.ear_tag} - {animal.name || "Unnamed"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calving Date */}
            <div className="space-y-2">
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

            {/* Calf Ear Tag */}
            <div className="space-y-2">
              <Label htmlFor="calf_ear_tag">Calf Ear Tag</Label>
              <Input
                id="calf_ear_tag"
                name="calf_ear_tag"
                placeholder="e.g., 201"
              />
            </div>

            {/* ✨ ADDED: Calf Name Input */}
            <div className="space-y-2">
              <Label htmlFor="calf_name">Calf Name</Label>
              <Input
                id="calf_name"
                name="calf_name"
                placeholder="e.g., Sparky"
              />
            </div>

            {/* Calf Sex */}
            <div className="space-y-2">
              <Label htmlFor="calf_sex">Calf Sex</Label>
              <Select name="calf_sex">
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Birth Weight */}
            <div className="space-y-2">
              <Label htmlFor="birth_weight">Birth Weight (kgs)</Label>
              <Input
                id="birth_weight"
                name="birth_weight"
                type="number"
                step="0.1"
                placeholder="e.g., 35.5"
              />
            </div>
          </div>

          {/* Add to Inventory Checkbox */}
          <div className="md:col-span-2 space-y-2 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="add_to_inventory"
                name="add_to_inventory"
                defaultChecked
              />
              <Label htmlFor="add_to_inventory" className="font-semibold">
                Add calf to animal inventory
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Uncheck this if you do not want to create a new animal record for
              this calf automatically. A calf ear tag is required.
            </p>
          </div>

          {/* Complications */}
          <div className="space-y-2">
            <Label htmlFor="complications">Complications</Label>
            <Textarea
              id="complications"
              name="complications"
              placeholder="Describe any complications that occurred during calving..."
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional observations or notes..."
              rows={3}
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
              disabled={!calvingDate || isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {isPending ? "Recording..." : "Record Calving"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
