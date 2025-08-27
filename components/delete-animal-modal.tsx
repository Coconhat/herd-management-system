// components/delete-animal-modal.tsx
"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Animal } from "@/lib/types"; // adjust path if needed
import { deleteAnimal } from "@/lib/actions/animals"; // server action

interface DeleteAnimalModalProps {
  animal: Animal | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteAnimalModal({
  animal,
  isOpen,
  onOpenChange,
}: DeleteAnimalModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!animal) return;
    startTransition(async () => {
      try {
        await deleteAnimal(animal.id); // server action
        toast({
          title: "Deleted",
          description: `${animal.ear_tag} has been deleted.`,
        });
        onOpenChange(false); // close modal
        router.refresh(); // refresh server components / data
      } catch (err: any) {
        console.error("deleteAnimal error:", err);
        toast({
          title: "Delete failed",
          description: err?.message || "Could not delete animal.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.{" "}
            <span className="font-semibold">
              {animal?.ear_tag ?? "Selected animal"}
            </span>{" "}
            and its related records will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={isPending || !animal}
          >
            {isPending ? "Deleting..." : "Delete Animal"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
