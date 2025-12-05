"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import { createHealthRecord } from "@/lib/actions/health-records";

export default function HealthRecordModal({ animal }: { animal: any }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  // form state
  const [recordDate, setRecordDate] = useState<Date | undefined>();
  const [recordType, setRecordType] = useState("");
  const [description, setDescription] = useState("");
  const [treatment, setTreatment] = useState("");
  const [veterinarian, setVeterinarian] = useState("");
  const [ml, setMl] = useState("");
  const [medication, setMedication] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setRecordDate(undefined);
    setRecordType("");
    setDescription("");
    setTreatment("");
    setVeterinarian("");
    setMl("");
    setMedication("");
    setNotes("");
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("animal_id", animal.id.toString());
    formData.append(
      "record_date",
      recordDate ? format(recordDate, "yyyy-MM-dd") : ""
    );
    formData.append("record_type", recordType);
    formData.append("description", description);
    formData.append("treatment", treatment);
    formData.append("veterinarian", veterinarian);
    formData.append("notes", notes);
    formData.append("ml", ml ? ml : "0");
    formData.append("medication", medication ? medication : "");

    startTransition(async () => {
      try {
        await createHealthRecord(formData);

        toast({
          title: "Success",
          description: "Health record created successfully",
        });

        resetForm();
        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error("Failed to create health record:", error);
        toast({
          title: "Error",
          description: "Failed to create health record. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Health Record</Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Health Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6">
          <Separator />

          {/* DATE */}
          <div className="space-y-2">
            <Label>Record Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start",
                    !recordDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {recordDate
                    ? format(recordDate, "yyyy-MM-dd")
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Calendar
                  mode="single"
                  selected={recordDate}
                  onSelect={setRecordDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* RECORD TYPE */}
          <div className="space-y-2">
            <Label>Record Type</Label>
            <Select value={recordType} onValueChange={setRecordType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Checkup">Checkup</SelectItem>
                <SelectItem value="Vaccination">Vaccination</SelectItem>
                <SelectItem value="Deworming">Deworming</SelectItem>
                <SelectItem value="Treatment">Treatment</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue or purpose of the visit..."
            />
          </div>

          {/* TREATMENT */}
          <div className="space-y-2">
            <Label>Treatment</Label>
            <Textarea
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              placeholder="Procedures, medicine, dosage..."
            />
          </div>

          {/* VETERINARIAN */}
          <div className="space-y-2">
            <Label>Veterinarian</Label>
            <Input
              value={veterinarian}
              onChange={(e) => setVeterinarian(e.target.value)}
              placeholder="Name of attending vet"
            />
          </div>

          {/* Medication */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>How many mL</Label>
              <Input
                type="number"
                min={0}
                value={ml}
                onChange={(e) => setMl(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Medication</Label>
              <Input
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                placeholder="Type of medication"
              />
            </div>
          </div>

          {/* NOTES */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional observations..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
