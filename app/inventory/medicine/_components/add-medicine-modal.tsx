"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMedicine } from "@/lib/actions/medicines";
import { useToast } from "@/components/ui/use-toast"; // Ensure correct import path
import { PlusCircle } from "lucide-react";

export function AddMedicineModal() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      try {
        await addMedicine(formData);
        toast({
          title: "Success",
          description: "Medicine added to inventory.",
        });
        setOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Could not add medicine.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Medicine
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Medicine to Inventory</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="name">Medicine Name</Label>
            <Input name="name" id="name" required />
          </div>
          <div>
            <Label htmlFor="stock_quantity">Stock Quantity</Label>
            <Input
              type="number"
              name="stock_quantity"
              id="stock_quantity"
              required
              step="0.1"
            />
          </div>
          <div>
            <Label htmlFor="unit">Unit (e.g., mL, dose)</Label>
            <Input name="unit" id="unit" required />
          </div>
          <div>
            <Label htmlFor="expiration_date">Expiration Date (Optional)</Label>
            <Input type="date" name="expiration_date" id="expiration_date" />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add to Inventory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
