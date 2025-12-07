import { useEffect, useState, useTransition, useRef } from "react";
import { useToast } from "./use-toast";
import { Animal, createAnimal } from "@/lib/actions/animals";

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
  onOptimisticAdd?: (animal: Animal) => void;
  onAddError?: (tempId: number) => void;
  onSuccess?: () => Promise<void> | void;
}

export function useModals({
  open,
  onOpenChange,
  animals,
  onOptimisticAdd,
  onAddError,
  onSuccess,
}: AddAnimalModalProps) {
  const [birthDate, setBirthDate] = useState<Date>();
  const [isPending, startTransition] = useTransition();
  const [earTagError, setEarTagError] = useState<string | null>(null);
  const { toast } = useToast();
  const tempIdRef = useRef<number | null>(null);

  const femaleAnimals = animals.filter((animal) => animal.sex === "Female");
  const maleAnimals = animals.filter((animal) => animal.sex === "Male");

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

    const formData = new FormData(e.currentTarget);
    const earTag = (formData.get("ear_tag") as string)?.trim();

    // Validate ear tag before proceeding
    if (!earTag) {
      setEarTagError("Ear tag is required.");
      toast({
        title: "Validation Error",
        description: "Ear tag is required.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate ear tag
    const isDuplicate = animals.some(
      (animal) => animal.ear_tag.toLowerCase() === earTag.toLowerCase()
    );
    if (isDuplicate) {
      setEarTagError("An animal with this ear tag already exists.");
      toast({
        title: "Validation Error",
        description: "An animal with this ear tag already exists.",
        variant: "destructive",
      });
      return;
    }

    if (earTagError) return;

    formData.set("ear_tag", earTag);

    if (birthDate) {
      formData.set("birth_date", birthDate.toISOString().split("T")[0]);
    }

    // Create optimistic animal
    const tempId = -Date.now(); // Negative to avoid collision with real IDs
    tempIdRef.current = tempId;

    const optimisticAnimal: Animal = {
      id: tempId,
      ear_tag: earTag,
      name: (formData.get("name") as string) || undefined,
      birth_date: (formData.get("birth_date") as string) || undefined,
      weight: formData.get("weight")
        ? Number(formData.get("weight"))
        : undefined,
      health: "Healthy",
      sex: (formData.get("sex") as "Male" | "Female") || undefined,
      dam_id: formData.get("dam_id")
        ? Number(formData.get("dam_id"))
        : undefined,
      sire_id: formData.get("sire_id")
        ? Number(formData.get("sire_id"))
        : undefined,
      farm_source: (formData.get("farm_source") as string) || undefined,
      status: "Active",
      pregnancy_status: "Open",
      milking_status: undefined,
      notes: (formData.get("notes") as string) || undefined,
      user_id: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      breed: (formData.get("breed") as string) || "",
      calvings: [],
      breeding_records: [],
    };

    // Only do optimistic update if callbacks are provided
    if (onOptimisticAdd) {
      onOptimisticAdd(optimisticAnimal);
      onOpenChange(false);
    }

    startTransition(async () => {
      try {
        await createAnimal(formData);
        if (onSuccess) {
          await onSuccess();
        }
        tempIdRef.current = null;
        toast({
          title: "Animal Added Successfully",
          description: `Animal ${earTag} has been added to your herd.`,
        });
        // If no optimistic update, close modal after success
        if (!onOptimisticAdd) {
          onOpenChange(false);
        }
      } catch (error) {
        // Revert optimistic add on error
        if (tempIdRef.current && onAddError) {
          onAddError(tempIdRef.current);
        }
        tempIdRef.current = null;
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
  return {
    birthDate,
    setBirthDate,
    isPending,
    earTagError,
    validateEarTag,
    handleSubmit,
    femaleAnimals,
    maleAnimals,
    commonBreeds,
  };
}
