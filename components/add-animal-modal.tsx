"use client";

import type React from "react";
import { useEffect, useState } from "react";
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
import type { Animal } from "@/lib/actions/animals";
import { useModals } from "@/hooks/use-modals";

export function AddAnimalModal({
  open,
  onOpenChange,
  animals,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animals: Animal[];
}) {
  const {
    birthDate,
    setBirthDate,
    isPending,
    earTagError,
    validateEarTag,
    handleSubmit,
    femaleAnimals,
    maleAnimals,
    commonBreeds,
  } = useModals({ open, onOpenChange, animals });

  const [selectedSex, setSelectedSex] = useState<string | null>(null);
  const [farmSource, setFarmSource] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setSelectedSex(null);
      setFarmSource(undefined);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Animal</DialogTitle>
          <DialogDescription>
            Add a new animal to your herd. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ear_tag">Ear Tag *</Label>
              {/* validate on blur to avoid flickery errors while typing */}
              <Input
                id="ear_tag"
                name="ear_tag"
                placeholder="e.g., 181"
                required
                onBlur={(e) => validateEarTag(e.target.value)}
              />
              <p className="text-sm font-medium text-destructive">
                {earTagError}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g., Buttercup" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">Sex *</Label>
              {/* sex select now sets selectedSex */}
              <Select
                name="sex"
                onValueChange={(val) => setSelectedSex(val)}
                required
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
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                name="breed"
                list="breed-options"
                placeholder="Type or select breed"
                autoComplete="off"
              />
              <datalist id="breed-options">
                {commonBreeds.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="farm_source">Farm Source / Origin</Label>
              <Select
                name="farm_source"
                value={farmSource}
                onValueChange={setFarmSource}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select farm source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DH">DH</SelectItem>
                  <SelectItem value="Sam's">Sam's</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="status">Status</Label>
              {/* status select: female-only statuses are conditionally rendered inside SelectContent */}
              <Select name="status" defaultValue="Active">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {selectedSex === "Female" && (
                    <>
                      <SelectItem value="Fresh">Fresh</SelectItem>
                      <SelectItem value="Pregnant">Pregnant</SelectItem>
                      <SelectItem value="Empty">Empty</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                    </>
                  )}

                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                  <SelectItem value="Culled">Culled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dam_id">Dam (Mother)</Label>
              <Select name="dam_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select dam" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unknown</SelectItem>
                  {femaleAnimals.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      {`${a.ear_tag} - ${a.name || "Unnamed"}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sire_id">Sire (Father)</Label>
              <Select name="sire_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select sire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unknown</SelectItem>
                  {maleAnimals.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      {`${a.ear_tag} - ${a.name || "Unnamed"}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any additional notes about this animal..."
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
            <Button type="submit" disabled={isPending || !!earTagError}>
              {isPending ? "Adding..." : "Add Animal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
