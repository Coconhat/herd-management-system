"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createBreedingRecord } from "@/lib/actions/breeding";
import { useToast } from "@/hooks/use-toast";
import type { Animal } from "@/lib/actions/animals";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { CalendarIcon } from "lucide-react";

// Shadcn UI Command (searchable dropdown)
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

interface RecordBreedingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  animals: Animal[]; // animals passed down should include status, ear_tag, name, id, sex
}

export function RecordBreedingModal({
  open,
  onOpenChange,
  animals,
}: RecordBreedingModalProps) {
  const [breedingDate, setBreedingDate] = useState<Date | undefined>();
  const [isPending, startTransition] = useTransition();
  const [selectedDam, setSelectedDam] = useState<Animal | null>(null);
  const [selectedSire, setSelectedSire] = useState<Animal | null>(null);
  const [damOpen, setDamOpen] = useState(false);
  const [sireOpen, setSireOpen] = useState(false);
  const [damSearchQuery, setDamSearchQuery] = useState("");
  const [sireSearchQuery, setSireSearchQuery] = useState("");
  const { toast } = useToast();

  // Helper function to sort animals by search relevance
  const sortByRelevance = (animals: Animal[], searchQuery: string) => {
    if (!searchQuery) return animals;

    const query = searchQuery.toLowerCase();
    return [...animals].sort((a, b) => {
      const aTag = (a.ear_tag || "").toLowerCase();
      const aName = (a.name || "").toLowerCase();
      const bTag = (b.ear_tag || "").toLowerCase();
      const bName = (b.name || "").toLowerCase();

      // Check for exact matches first
      if (aTag === query) return -1;
      if (bTag === query) return 1;

      // Then check if starts with query
      if (aTag.startsWith(query) && !bTag.startsWith(query)) return -1;
      if (bTag.startsWith(query) && !aTag.startsWith(query)) return 1;
      if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
      if (bName.startsWith(query) && !aName.startsWith(query)) return 1;

      // Finally sort by position of match (earlier is better)
      const aTagIndex = aTag.indexOf(query);
      const aNameIndex = aName.indexOf(query);
      const bTagIndex = bTag.indexOf(query);
      const bNameIndex = bName.indexOf(query);

      const aMinIndex = Math.min(
        aTagIndex >= 0 ? aTagIndex : Infinity,
        aNameIndex >= 0 ? aNameIndex : Infinity
      );
      const bMinIndex = Math.min(
        bTagIndex >= 0 ? bTagIndex : Infinity,
        bNameIndex >= 0 ? bNameIndex : Infinity
      );

      return aMinIndex - bMinIndex;
    });
  };

  // Only allow animals that are open for breeding. Accept both "Open" and "Active" statuses
  const openFemales = sortByRelevance(
    animals.filter(
      (a) =>
        a.sex === "Female" &&
        ((a.pregnancy_status || a.status) === "Open" ||
          (a.pregnancy_status || a.status) === "Active" ||
          (a.pregnancy_status || a.status) === "Empty")
    ),
    damSearchQuery
  );
  const activeSires = sortByRelevance(
    animals.filter((a) => a.sex === "Male"),
    sireSearchQuery
  );

  // preview pregnancy check date
  const pregnancyCheckDate = breedingDate ? addDays(breedingDate, 29) : null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!breedingDate) {
      toast({
        title: "Error",
        description: "Please select a breeding date.",
        variant: "destructive",
      });
      return;
    }

    // if no dam selected, abort (required)
    if (!selectedDam) {
      toast({
        title: "Error",
        description: "Please select a dam.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);

    // write hidden fields so server gets reliable values
    formData.set("animal_id", String(selectedDam.id));
    if (selectedSire) {
      formData.set("sire_ear_tag", selectedSire.ear_tag);
    } else {
      formData.delete("sire_ear_tag"); // ensure no empty string
    }

    // set breeding_date as YYYY-MM-DD for compatibility with date columns
    formData.set("breeding_date", breedingDate.toISOString().split("T")[0]);

    // optional: also send precomputed check/due dates (server will compute as well, but this is explicit)
    if (pregnancyCheckDate) {
      formData.set(
        "pregnancy_check_due_date",
        pregnancyCheckDate.toISOString().split("T")[0]
      );
    }

    startTransition(async () => {
      try {
        await createBreedingRecord(formData);
        toast({
          title: "Success",
          description:
            "Breeding event has been recorded. Reminders have been set.",
        });
        // reset local state
        setSelectedDam(null);
        setSelectedSire(null);
        setBreedingDate(undefined);
        onOpenChange(false);
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to record breeding event.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Record New Breeding</DialogTitle>
          <DialogDescription>
            Select the dam and (optional) sire, then choose the
            insemination/breeding date.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Dam */}
          <div className="space-y-2">
            <Label>
              Dam (Female) <span className="text-red-500">*</span>
            </Label>
            <Popover
              open={damOpen}
              onOpenChange={(open) => {
                setDamOpen(open);
                if (!open) setDamSearchQuery("");
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedDam
                    ? `${selectedDam.ear_tag} — ${selectedDam.name}`
                    : "Search or select an open female"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 max-h-[300px] overflow-y-auto">
                <Command className="[&_[cmdk-group]]:overflow-visible">
                  <CommandInput
                    placeholder="Search by ear tag or name..."
                    onValueChange={setDamSearchQuery}
                  />
                  <CommandEmpty>No female found.</CommandEmpty>
                  <CommandGroup>
                    {openFemales.map((a) => (
                      <CommandItem
                        key={a.id}
                        value={`${a.ear_tag} ${a.name || ""}`}
                        onSelect={() => {
                          setSelectedDam(a);
                          setDamOpen(false); // close after select
                        }}
                      >
                        {a.ear_tag}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <input
              type="hidden"
              name="animal_id"
              value={selectedDam?.id ?? ""}
              required
            />
          </div>

          {/* Sire (optional) */}
          <div className="space-y-2">
            <Label>
              Sire (Male){" "}
              <span className="text-muted-foreground text-sm">(optional)</span>
            </Label>
            <Popover
              open={sireOpen}
              onOpenChange={(open) => {
                setSireOpen(open);
                if (!open) setSireSearchQuery("");
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {selectedSire
                    ? `${selectedSire.ear_tag} — ${selectedSire.name}`
                    : "Leave blank or search sire"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 max-h-[300px] overflow-y-auto">
                <Command className="[&_[cmdk-group]]:overflow-visible">
                  <CommandInput
                    placeholder="Search by ear tag or name..."
                    onValueChange={setSireSearchQuery}
                  />
                  <CommandEmpty>No sire found.</CommandEmpty>
                  <CommandGroup>
                    {activeSires.map((a) => (
                      <CommandItem
                        key={a.id}
                        value={`${a.ear_tag} ${a.name || ""}`}
                        onSelect={() => {
                          setSelectedSire(a);
                          setSireOpen(false);
                        }}
                      >
                        {a.ear_tag} — {a.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            {/* store sire ear tag so downstream calving knows the father */}
            <input
              type="hidden"
              name="sire_ear_tag"
              value={selectedSire?.ear_tag ?? ""}
            />
          </div>

          {/* Breeding Date + Pregnancy check preview */}
          <div className="space-y-2">
            <Label>
              Breeding Date <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {breedingDate ? (
                    format(breedingDate, "PPP")
                  ) : (
                    <span>Select date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Calendar
                  mode="single"
                  selected={breedingDate}
                  onSelect={setBreedingDate}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>

            {/* read-only preview of the pregnancy check date */}
            <div className="text-sm text-muted-foreground">
              {pregnancyCheckDate ? (
                <>
                  Pregnancy check due:{" "}
                  <strong>{format(pregnancyCheckDate, "PPP")}</strong> (≈ 29
                  days)
                </>
              ) : (
                "Pregnancy check date will appear after selecting a breeding date."
              )}
            </div>
          </div>

          {/* Method */}
          <div className="space-y-2">
            <Label>Method</Label>
            <select
              name="breeding_method"
              className="w-full rounded border px-3 py-2"
            >
              <option value="">Select method</option>
              <option value="Natural">Natural</option>
              <option value="AI">AI</option>
            </select>
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!breedingDate || !selectedDam || isPending}
            >
              {isPending ? "Recording..." : "Record Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
