"use client";

import React, { useState, useTransition } from "react";
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

interface HealthRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalId: number; // from URL params
  userId: string;
  onSubmit?: (formData: FormData) => Promise<void>;
}

export default function HealthRecordModal({
  open,
  onOpenChange,
  animalId,
  userId,
  onSubmit,
}: HealthRecordModalProps) {
  const [recordDate, setRecordDate] = useState<Date | undefined>();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    if (recordDate)
      fd.set("record_date", recordDate.toISOString().split("T")[0]);

    if (onSubmit) {
    } else {
      console.log("Health Record Payload:", Object.fromEntries(fd.entries()));
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Health Event</DialogTitle>
          <DialogDescription>
            Fill out this form to record a health event or treatment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Hidden system-required fields */}
          <input type="hidden" name="animal_id" value={animalId} />
          <input type="hidden" name="user_id" value={userId} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Record Date */}
            <div className="space-y-2">
              <Label>Record Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !recordDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {recordDate ? format(recordDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={recordDate}
                    onSelect={setRecordDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Record Type */}
            <div className="space-y-2">
              <Label htmlFor="record_type">Record Type *</Label>
              <Select name="record_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Vaccination">Vaccination</SelectItem>
                  <SelectItem value="Treatment">Treatment</SelectItem>
                  <SelectItem value="Checkup">Checkup</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Veterinarian */}
            <div className="space-y-2">
              <Label htmlFor="veterinarian">Veterinarian</Label>
              <Input id="veterinarian" name="veterinarian" />
            </div>

            {/* Treatment */}
            <div className="space-y-2">
              <Label htmlFor="treatment">Treatment</Label>
              <Input id="treatment" name="treatment" />
            </div>

            {/* Syringes Used */}
            <div className="space-y-2">
              <Label htmlFor="syringes_used">Syringes Used</Label>
              <Input
                id="syringes_used"
                name="syringes_used"
                type="number"
                defaultValue={0}
              />
            </div>

            {/* Syringe Type */}
            <div className="space-y-2">
              <Label htmlFor="syringe_type">Syringe Type</Label>
              <Input
                id="syringe_type"
                name="syringe_type"
                placeholder="e.g., 2ml, 5ml"
              />
            </div>

            {/* Description */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" />
            </div>

            {/* Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" />
            </div>

            {/* Cost */}
            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                step="0.01"
                placeholder="e.g., 150.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Recording..." : "Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
