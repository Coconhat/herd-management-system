"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { updateMilkingRecord } from "@/lib/actions/milking";
import { useEffect } from "react";
import { MilkingRecord } from "@/lib/types";
import { Animal } from "@/lib/actions/animals";

interface EditMilkingRecordModalProps {
  record: MilkingRecord;
  animals: Animal[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Define the form schema with zod
const formSchema = z
  .object({
    record_id: z.number(),
    animal_id: z.number(),
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

export function EditMilkingRecordModal({
  record,
  animals,
  open,
  onOpenChange,
}: EditMilkingRecordModalProps) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      record_id: record.id,
      animal_id: record.animal_id,
      milking_date: new Date(record.milking_date),
      milk_yield: record.milk_yield?.toString() || "",
      notes: record.notes || "",
    },
  });

  // Reset form when record changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        record_id: record.id,
        animal_id: record.animal_id,
        milking_date: new Date(record.milking_date),
        milk_yield: record.milk_yield?.toString() || "",
        notes: record.notes || "",
      });
    }
  }, [record, open, form]);

  async function onSubmit(values: FormValues) {
    try {
      const formData = new FormData();

      formData.append("record_id", values.record_id.toString());
      formData.append(
        "milking_date",
        format(values.milking_date, "yyyy-MM-dd")
      );

      // Add optional fields only if they have values
      if (values.milk_yield) {
        formData.append("milk_yield", values.milk_yield);
      }
      if (values.notes) {
        formData.append("notes", values.notes);
      }

      await updateMilkingRecord(formData);

      const selectedAnimal = animals.find((a) => a.id === values.animal_id);

      toast({
        title: "Record updated",
        description: `Successfully updated milk production for ${
          selectedAnimal?.name || selectedAnimal?.ear_tag || values.animal_id
        }`,
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update milking record",
        variant: "destructive",
      });
    }
  }

  const selectedAnimal = animals.find((a) => a.id === record.animal_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Milking Record</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {selectedAnimal?.ear_tag} - {selectedAnimal?.name || "Unnamed"}
          </p>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
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
                  <FormLabel>Milk Yield (Liters)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 25.5"
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
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes about this milking..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Update Record
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
