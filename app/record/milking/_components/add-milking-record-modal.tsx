"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { addMilkingRecord } from "@/lib/actions/milking";
import { useState, useEffect } from "react";
import {
  SelectContent,
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Animal } from "@/lib/actions/animals";
import { isDryAnimal } from "@/lib/status-helper";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddMilkingRecordModalProps {
  animals: Animal[];
}

// Define the form schema with zod
const formSchema = z
  .object({
    animal_id: z.string({
      required_error: "Animal ID is required",
    }),
    milking_date: z.date({
      required_error: "Milking date is required",
    }),
    milk_yield: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Milk yield must be provided
      return data.milk_yield !== undefined && data.milk_yield !== "";
    },
    {
      message: "Milk yield value must be provided",
      path: ["milk_yield"],
    }
  );

// Infer the form type from the schema
type FormValues = z.infer<typeof formSchema>;

export function AddMilkingRecordModal({ animals }: AddMilkingRecordModalProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // NEW: search state for filtering animals by ear_tag or name
  const [search, setSearch] = useState("");

  // Track selected animal for dry warning
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);

  // Clear search whenever the dialog opens (optional but nice UX)
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedAnimal(null);
    }
  }, [open]);

  // Handle animal selection and track for dry warning
  const handleAnimalSelect = (animalId: string) => {
    const animal = animals.find((a) => a.id.toString() === animalId);
    setSelectedAnimal(animal || null);
    return animalId;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      animal_id: "",
      milking_date: new Date(),
      milk_yield: "",
      notes: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        if (key === "milking_date") {
          formData.append(key, format(values.milking_date, "yyyy-MM-dd"));
        } else if (
          values[key as keyof FormValues] !== undefined &&
          values[key as keyof FormValues] !== ""
        ) {
          formData.append(key, values[key as keyof FormValues]!.toString());
        }
      });

      await addMilkingRecord(formData);

      const selectedAnimal = animals.find(
        (a) => a.id.toString() === values.animal_id
      );

      toast({
        title: "Milking record added",
        description: `Successfully recorded milk production for ${
          selectedAnimal?.name || selectedAnimal?.ear_tag || values.animal_id
        }`,
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add milking record",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Milking Record</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Milking Record</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="animal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Animal</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleAnimalSelect(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Animal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {/* NEW: Search input inside the dropdown */}
                      <div className="px-3 pt-2 pb-1">
                        <Input
                          placeholder="Search by ear tag or name..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          // small styling so it doesn't dominate the dropdown
                          className="mb-2"
                        />
                      </div>

                      {/* Filtered & sorted list */}
                      {animals
                        .filter((a) => {
                          const q = search.trim().toLowerCase();
                          if (!q) return true;
                          const ear = a.ear_tag.toLowerCase();
                          const name = (a.name || "").toLowerCase();
                          return ear.includes(q) || name.includes(q);
                        })
                        .sort((a, b) => a.ear_tag.localeCompare(b.ear_tag))
                        .map((animal) => (
                          <SelectItem
                            key={animal.id}
                            value={animal.id.toString()}
                          >
                            {animal.ear_tag} - {animal.name || "Unnamed"}
                          </SelectItem>
                        ))}

                      {/* Show a friendly empty state when nothing matches */}
                      {animals.filter((a) => {
                        const q = search.trim().toLowerCase();
                        if (!q) return true;
                        const ear = a.ear_tag.toLowerCase();
                        const name = (a.name || "").toLowerCase();
                        return ear.includes(q) || name.includes(q);
                      }).length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No animals found
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dry Animal Warning */}
            {selectedAnimal &&
              (() => {
                const dryInfo = isDryAnimal(selectedAnimal);
                if (dryInfo.isDry) {
                  return (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>Warning:</strong> {selectedAnimal.ear_tag} (
                        {selectedAnimal.name || "Unnamed"}) is currently dry (
                        {dryInfo.weeksPregnant} weeks pregnant). Dry cows
                        typically should not be milked. Are you sure you want to
                        continue?
                      </AlertDescription>
                    </Alert>
                  );
                }
                return null;
              })()}

            <FormField
              control={form.control}
              name="milking_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Milking Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="milk_yield"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Milk Yield (L)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Save Record
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
