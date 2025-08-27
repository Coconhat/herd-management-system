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
import { updateAnimal } from "@/lib/actions/animals"; // We use our server action
import { useToast } from "@/hooks/use-toast";
import type { Animal } from "@/lib/actions/animals";
import { Separator } from "@/components/ui/separator";

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
  const [notes, setNotes] = useState(animal.notes || "");

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
    notes !== (initialAnimal.notes || "");

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
    formData.append("dam_id", damId);
    formData.append("sire_id", sireId);
    formData.append("notes", notes);

    startTransition(async () => {
      try {
        await updateAnimal(animal.id, formData);
        toast({
          title: "Update Successful",
          description: `${earTag} has been updated.`,
        });
        router.push(`/animal/${animal.id}`);
        router.refresh(); // Important: tell Next.js to re-fetch data on the profile page
      } catch (error) {
        toast({
          title: "Update Failed",
          description: "Could not save changes. Please try again.",
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
              <Select value={sex || ""} onValueChange={setSex}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
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
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                </SelectContent>
              </Select>
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
    </form>
  );
}
