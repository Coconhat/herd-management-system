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
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Animal } from "@/lib/actions/animals";
import { useModals } from "@/hooks/use-modals";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function AddAnimalModal({
  open,
  onOpenChange,
  animals,
  onOptimisticAdd,
  onAddError,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animals: Animal[];
  onOptimisticAdd?: (animal: Animal) => void;
  onAddError?: (tempId: number) => void;
  onSuccess?: () => Promise<void> | void;
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
  } = useModals({
    open,
    onOpenChange,
    animals,
    onOptimisticAdd,
    onAddError,
    onSuccess,
  });

  const [selectedSex, setSelectedSex] = useState<string | null>(null);
  const [farmSource, setFarmSource] = useState<string | undefined>(undefined);
  const [damOpen, setDamOpen] = useState(false);
  const [sireOpen, setSireOpen] = useState(false);
  const [damValue, setDamValue] = useState("");
  const [sireValue, setSireValue] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedSex(null);
      setFarmSource(undefined);
      setDamValue("");
      setSireValue("");
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
                    captionLayout="dropdown"
                    fromYear={1990}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pregnancy_status">Pregnancy Status</Label>
              <Select
                name="pregnancy_status"
                defaultValue="Open"
                disabled={selectedSex !== "Female"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pregnancy status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">
                    Open (Ready for breeding)
                  </SelectItem>
                  <SelectItem value="Empty">Empty (Recovery period)</SelectItem>
                  <SelectItem value="Waiting for PD">Waiting for PD</SelectItem>
                  <SelectItem value="Pregnant">Pregnant</SelectItem>
                  <SelectItem value="Sold">Sold</SelectItem>
                  <SelectItem value="Deceased">Deceased</SelectItem>
                  <SelectItem value="Culled">Culled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="milking_status">Milking Status</Label>
              <Select
                name="milking_status"
                defaultValue="Milking"
                disabled={selectedSex !== "Female"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select milking status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Milking">
                    Milking (Can be milked)
                  </SelectItem>
                  <SelectItem value="Dry">Dry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dam_id">Dam (Mother)</Label>
              <input type="hidden" name="dam_id" value={damValue || "none"} />
              <Popover open={damOpen} onOpenChange={setDamOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={damOpen}
                    className="w-full justify-between"
                    type="button"
                  >
                    {damValue
                      ? femaleAnimals.find((a) => a.id.toString() === damValue)
                        ? `${
                            femaleAnimals.find(
                              (a) => a.id.toString() === damValue
                            )?.ear_tag
                          } - ${
                            femaleAnimals.find(
                              (a) => a.id.toString() === damValue
                            )?.name || "Unnamed"
                          }`
                        : "Unknown"
                      : "Select dam..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search by ear tag or name..." />
                    <CommandList>
                      <CommandEmpty>No animal found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setDamValue("");
                            setDamOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              damValue === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Unknown
                        </CommandItem>
                        {femaleAnimals.map((animal) => (
                          <CommandItem
                            key={animal.id}
                            value={`${animal.ear_tag} ${animal.name || ""}`}
                            onSelect={() => {
                              setDamValue(animal.id.toString());
                              setDamOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                damValue === animal.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {animal.ear_tag} - {animal.name || "Unnamed"}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sire_id">Sire (Father)</Label>
              <input type="hidden" name="sire_id" value={sireValue || "none"} />
              <Popover open={sireOpen} onOpenChange={setSireOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={sireOpen}
                    className="w-full justify-between"
                    type="button"
                  >
                    {sireValue
                      ? maleAnimals.find((a) => a.id.toString() === sireValue)
                        ? `${
                            maleAnimals.find(
                              (a) => a.id.toString() === sireValue
                            )?.ear_tag
                          } - ${
                            maleAnimals.find(
                              (a) => a.id.toString() === sireValue
                            )?.name || "Unnamed"
                          }`
                        : "Unknown"
                      : "Select sire..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search by ear tag or name..." />
                    <CommandList>
                      <CommandEmpty>No animal found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setSireValue("");
                            setSireOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              sireValue === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Unknown
                        </CommandItem>
                        {maleAnimals.map((animal) => (
                          <CommandItem
                            key={animal.id}
                            value={`${animal.ear_tag} ${animal.name || ""}`}
                            onSelect={() => {
                              setSireValue(animal.id.toString());
                              setSireOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                sireValue === animal.id.toString()
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {animal.ear_tag} - {animal.name || "Unnamed"}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
