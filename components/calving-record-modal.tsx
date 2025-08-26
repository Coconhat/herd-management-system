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
import type { Animal } from "@/lib/actions/animals";

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

  const femaleAnimals = animals.filter(
    (animal) => animal.sex === "Female" && animal.status === "Active"
  );
  const maleAnimals = animals.filter(
    (animal) => animal.sex === "Male" && animal.status === "Active"
  );

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
        toast({
          title: "Success",
          description:
            "Calving event recorded and new calf added to inventory.",
        });
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to record calving.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record New Calving</DialogTitle>
          <DialogDescription>
            Record a new birth. This will create a calving event and add the new
            calf to the inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="animal_id">Dam (Mother) *</Label>
              <Select name="animal_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a dam" />
                </SelectTrigger>
                <SelectContent>
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
                  <SelectValue placeholder="Select a sire" />
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
            <div className="space-y-2">
              <Label htmlFor="calf_ear_tag">Calf Ear Tag *</Label>
              <Input
                id="calf_ear_tag"
                name="calf_ear_tag"
                placeholder="e.g., M172"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calf_name">Calf Name</Label>
              <Input
                id="calf_name"
                name="calf_name"
                placeholder="e.g., Sparky"
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
            <Label htmlFor="complications">Complications & Outcome</Label>
            <Textarea
              id="complications"
              name="complications"
              placeholder="describe any complications..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional observations about the calving..."
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
              {isPending ? "Recording..." : "Record Calving"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
