import { useEffect, useState, useTransition } from "react";
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
}

export function useModals({
  open,
  onOpenChange,
  animals,
}: AddAnimalModalProps) {
  const [birthDate, setBirthDate] = useState<Date>();
  const [isPending, startTransition] = useTransition();
  const [earTagError, setEarTagError] = useState<string | null>(null);
  const { toast } = useToast();

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
