"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getMedicines,
  recordMedicineUsage,
  type Medicine,
} from "@/lib/actions/medicines";
import { useToast } from "@/components/ui/use-toast"; // Ensure correct import path
import { isBefore, parseISO, startOfToday } from "date-fns";

interface RecordMedicineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animalId: number;
  breedingRecordId?: number;
}

export function RecordMedicineModal({
  open,
  onOpenChange,
  animalId,
  breedingRecordId,
}: RecordMedicineModalProps) {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      getMedicines().then(setMedicines);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("animal_id", String(animalId));
    if (breedingRecordId) {
      formData.set("breeding_record_id", String(breedingRecordId));
    }

    startTransition(async () => {
      try {
        await recordMedicineUsage(formData);
        toast({
          title: "Success",
          description: "Medicine usage has been recorded.",
        });
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error",
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Medicine Administration</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="medicine_id">Medicine</Label>
            <Select name="medicine_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a medicine..." />
              </SelectTrigger>
              <SelectContent>
                {medicines.map((med) => {
                  const isExpired = med.expiration_date
                    ? isBefore(parseISO(med.expiration_date), startOfToday())
                    : false;
                  const expiryText = med.expiration_date
                    ? `(Expires: ${new Date(
                        med.expiration_date
                      ).toLocaleDateString()})`
                    : "(No Expiry)";

                  return (
                    <SelectItem
                      key={med.id}
                      value={String(med.id)}
                      disabled={isExpired}
                    >
                      {med.name} {expiryText}{" "}
                      {isExpired
                        ? " - EXPIRED"
                        : `(Stock: ${med.stock_quantity})`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="quantity_used">Quantity Used</Label>
            <Input
              type="number"
              name="quantity_used"
              id="quantity_used"
              step="0.1"
              required
            />
          </div>
          <div>
            <Label htmlFor="date_administered">Date Administered</Label>
            <Input
              type="date"
              name="date_administered"
              id="date_administered"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              name="reason"
              id="reason"
              placeholder="e.g., Post-PD vitamin protocol"
              defaultValue={breedingRecordId ? "Post-PD vitamin protocol" : ""}
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
            <Button type="submit" disabled={isPending}>
              {isPending ? "Recording..." : "Save Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
