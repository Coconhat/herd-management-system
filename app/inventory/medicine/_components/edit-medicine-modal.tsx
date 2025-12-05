"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// server actions
import {
  editMedicineQuantity,
  editMedicineExpiration,
  deleteMedicine,
} from "@/lib/actions/medicines";

export function EditMedicineModal({ medicineId }: { medicineId: number }) {
  const [mode, setMode] = useState<"quantity" | "expiration" | null>(null);
  const [open, setOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [newExpirationDate, setNewExpirationDate] = useState<Date | undefined>(
    addDays(new Date(), 1)
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!mode) return;

    startTransition(async () => {
      try {
        if (mode === "quantity") {
          const formData = new FormData();
          formData.append("stock_quantity", String(newQuantity));
          await editMedicineQuantity(medicineId, formData);
          toast({
            title: "Success",
            description: "Medicine quantity updated successfully",
          });
        }

        if (mode === "expiration" && newExpirationDate) {
          const formData = new FormData();
          formData.append("expiration_date", newExpirationDate.toISOString());
          await editMedicineExpiration(medicineId, formData);
          toast({
            title: "Success",
            description: "Expiration date updated successfully",
          });
        }

        setOpen(false);
        setMode(null);
        router.refresh();
      } catch (error) {
        console.error("Failed to update medicine:", error);
        toast({
          title: "Error",
          description: "Failed to update medicine. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        await deleteMedicine(medicineId);
        toast({
          title: "Success",
          description: "Medicine deleted successfully",
        });
        setShowDeleteDialog(false);
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error("Failed to delete medicine:", error);
        toast({
          title: "Error",
          description: "Failed to delete medicine. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Edit
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Medicine</DialogTitle>
          </DialogHeader>
          {/* MODE BUTTONS */}
          <div className="space-y-2 mt-2">
            <Button
              variant={mode === "quantity" ? "default" : "outline"}
              onClick={() => setMode("quantity")}
              className="w-full"
              disabled={isPending}
            >
              Edit Quantity
            </Button>

            <Button
              variant={mode === "expiration" ? "default" : "outline"}
              onClick={() => setMode("expiration")}
              className="w-full"
              disabled={isPending}
            >
              Edit Expiration Date
            </Button>

            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="w-full"
              disabled={isPending}
            >
              Delete Medicine
            </Button>
          </div>{" "}
          {/* FORM */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {mode === "quantity" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">New Quantity</label>
                <Input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Number(e.target.value))}
                  placeholder="Enter new quantity"
                  required
                  disabled={isPending}
                />

                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode(null)}
                    className="flex-1"
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isPending}>
                    {isPending ? "Saving..." : "Save Quantity"}
                  </Button>
                </div>
              </div>
            )}{" "}
            {mode === "expiration" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select New Expiration Date
                </label>

                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={newExpirationDate}
                    onSelect={setNewExpirationDate}
                    className="rounded-md border"
                    captionLayout="dropdown"
                    fromYear={new Date().getFullYear()}
                    toYear={new Date().getFullYear() + 10}
                    disabled={isPending}
                  />
                </div>

                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode(null)}
                    className="flex-1"
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={!newExpirationDate || isPending}
                  >
                    {isPending ? "Saving..." : "Save Expiration"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              medicine from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
