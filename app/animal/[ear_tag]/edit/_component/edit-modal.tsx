"use client";

import type React from "react";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
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
import { updateAnimal } from "@/lib/actions/animals";
import { useToast } from "@/hooks/use-toast";
import type { Animal } from "@/lib/actions/animals";
import { Separator } from "@/components/ui/separator";
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
import { deleteAnimal } from "@/lib/actions/animals";

const commonBreeds = [
  "Holstein Friesian",
  "Jersey",
  "Kiwi Cross",
  "Sahiwal",
  "Gir",
  "Other",
];

interface EditAnimalFormProps {
  animal: Animal;
  allAnimals: Animal[];
}

export default function EditAnimalForm({
  animal,
  allAnimals,
}: EditAnimalFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [initialAnimal] = useState(animal); // Store the initial state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state for each editable field
  const [earTag, setEarTag] = useState(animal.ear_tag);
  const [name, setName] = useState(animal.name || "");
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    animal.birth_date ? parseISO(animal.birth_date) : undefined
  );
  const [sex, setSex] = useState(animal.sex);
  const [breed, setBreed] = useState(animal.breed || "");
  const [status, setStatus] = useState(animal.status);
  const [damId, setDamId] = useState(animal.dam_id?.toString() || "none");
  const [sireId, setSireId] = useState(animal.sire_id?.toString() || "none");
  const [farmSource, setFarmSource] = useState(animal.farm_source || "");
  const [notes, setNotes] = useState(animal.notes || "");
  const [health, setHealth] = useState(animal.health || "");

  // Create filtered lists for parent dropdowns, excluding the animal itself
  const potentialDams = allAnimals.filter(
    (a) => a.sex === "Female" && a.id !== animal.id
  );
  const potentialSires = allAnimals.filter(
    (a) => a.sex === "Male" && a.id !== animal.id
  );

  // Check if any form fields have changed from their initial values
  const isChanged =
    earTag !== initialAnimal.ear_tag ||
    name !== (initialAnimal.name || "") ||
    birthDate?.toISOString().split("T")[0] !==
      (initialAnimal.birth_date
        ? initialAnimal.birth_date.split("T")[0]
        : null) ||
    sex !== initialAnimal.sex ||
    breed !== (initialAnimal.breed || "") ||
    status !== initialAnimal.status ||
    damId !== (initialAnimal.dam_id?.toString() || "none") ||
    sireId !== (initialAnimal.sire_id?.toString() || "none") ||
    farmSource !== (initialAnimal.farm_source || "") ||
    notes !== (initialAnimal.notes || "") ||
    health !== (initialAnimal.health || "");

  // Check if the status change requires deletion
  const isTerminalStatus = ["Sold", "Deceased", "Culled"].includes(status);
  const wasTerminalStatus = ["Sold", "Deceased", "Culled"].includes(
    initialAnimal.status
  );
  const statusChangedToTerminal = isTerminalStatus && !wasTerminalStatus;

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus as typeof status);

    // If changing to a terminal status, show delete confirmation
    if (
      ["Sold", "Deceased", "Culled"].includes(newStatus) &&
      !["Sold", "Deceased", "Culled"].includes(initialAnimal.status)
    ) {
      setShowDeleteConfirm(true);
    }
  };

  const handleDeleteConfirm = () => {
    startTransition(async () => {
      try {
        await deleteAnimal(animal.id);
        toast({
          title: "Animal Removed",
          description: `${earTag} has been removed from the farm.`,
        });
        router.push("/inventory/animals");
        router.refresh();
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: "Could not remove animal. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("ear_tag", earTag);
    formData.append("name", name);
    if (birthDate)
      formData.append("birth_date", birthDate.toISOString().split("T")[0]);
    if (sex) formData.append("sex", sex);
    formData.append("breed", breed);
    formData.append("status", status);
    formData.append("dam_id", damId === "none" ? "" : damId);
    formData.append("sire_id", sireId === "none" ? "" : sireId);
    formData.append("farm_source", farmSource.trim());
    formData.append("notes", notes);
    formData.append("health", health.trim());

    startTransition(async () => {
      try {
        console.log("Submitting form with data:", Object.fromEntries(formData));
        await updateAnimal(animal.id, formData);
        toast({
          title: "Update Successful",
          description: `${earTag} has been updated successfully.`,
        });
        router.push(`/animal/${earTag}`);
        router.refresh(); // Important: tell Next.js to re-fetch data on the profile page
      } catch (error) {
        console.error("Failed to update animal:", error);
        toast({
          title: "Update Failed",
          description:
            error instanceof Error
              ? error.message
              : "Could not save changes. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-6 pt-6">
        {/* Vitals Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Vitals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ear_tag">Ear Tag *</Label>
              <Input
                id="ear_tag"
                value={earTag}
                onChange={(e) => setEarTag(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Birth Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !birthDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {birthDate ? format(birthDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={birthDate}
                    onSelect={setBirthDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sex">Sex</Label>
              <Select
                value={sex || ""}
                onValueChange={(value) => setSex(value as "Male" | "Female")}
              >
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
              <Label htmlFor="health">Health</Label>
              <Select
                value={health || ""}
                onValueChange={(value) =>
                  setHealth(value as "Healthy" | "Unhealthy")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select health" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Healthy">Healthy</SelectItem>
                  <SelectItem value="Unhealthy">Unhealthy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Pedigree & Status Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Pedigree & Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dam_id">Dam (Mother)</Label>
              <Select value={damId} onValueChange={setDamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unknown</SelectItem>
                  {potentialDams.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>{`${
                      a.ear_tag
                    } - ${a.name || "Unnamed"}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sire_id">Sire (Father)</Label>
              <Select value={sireId} onValueChange={setSireId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unknown</SelectItem>
                  {potentialSires.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>{`${
                      a.ear_tag
                    } - ${a.name || "Unnamed"}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Select value={breed} onValueChange={setBreed}>
                <SelectTrigger>
                  <SelectValue placeholder="Select breed" />
                </SelectTrigger>
                <SelectContent>
                  {commonBreeds.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                  <SelectItem value="Culled">Culled</SelectItem>
                  <SelectItem value="Fresh">Fresh</SelectItem>
                  <SelectItem value="Pregnant">Pregnant</SelectItem>
                  <SelectItem value="Dry">Dry</SelectItem>
                  <SelectItem value="Empty">Empty</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm_source">Farm Source / Origin</Label>
              <Input
                id="farm_source"
                value={farmSource}
                onChange={(e) => setFarmSource(e.target.value)}
                placeholder="e.g., DH, Sam's, Purchased"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Notes Section */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes about this animal..."
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !isChanged}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </CardFooter>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Animal from Farm?</AlertDialogTitle>
            <AlertDialogDescription>
              You've marked {earTag} ({name || "Unnamed"}) as{" "}
              {status.toLowerCase()}. This typically means the animal is no
              longer part of the active herd.
              <br />
              <br />
              <strong>
                Do you want to remove this animal from the farm records?
              </strong>
              <br />
              <br />
              <span className="text-sm text-muted-foreground">
                This action will permanently delete the animal and all
                associated records (calvings, breeding records, etc.). This
                cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                // Reset status back to original if user cancels
                setStatus(initialAnimal.status);
                setShowDeleteConfirm(false);
              }}
            >
              Keep in Records
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove from Farm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
