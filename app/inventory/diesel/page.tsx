"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { addDiesel, Diesel, getDiesel } from "@/lib/actions/diesel";
import { FormEvent, useEffect, useState } from "react";

const historyColumns = ["Date", "Type", "Volume", "Reference", "Recorded By"];

export default function DieselInventoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [diesel, setDiesel] = useState<Diesel[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const overviewCards = [
    {
      title: "Current Volume",
      metric: `${
        diesel?.reduce((acc, curr) => acc + curr.volume_liters, 0) || 0
      } L`,
      description: "Diesel available across all storage.",
    },

    {
      title: "Average Daily Usage",
      metric: "-- L",
      description: "Based on recent consumption trends.",
    },
  ];

  useEffect(() => {
    async function fetchDiesel() {
      const res = await getDiesel();
      setDiesel(res);
    }
    fetchDiesel();
  }, []);

  const handleCreateDiesel = async (values: DieselModalFormValues) => {
    try {
      setIsSubmitting(true);
      await addDiesel(values);
      const refreshed = await getDiesel();
      setDiesel(refreshed);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPHDate = (iso: string) => {
    return new Intl.DateTimeFormat("en-PH", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  };
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
        {overviewCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-semibold tracking-tight text-foreground">
                {card.metric}
              </span>
            </CardContent>
          </Card>
        ))}
      </section>

      <div>
        <Button onClick={() => setIsModalOpen(!isModalOpen)}>
          Add Diesel Entry
        </Button>
      </div>

      <section className="rounded-xl border bg-card/40">
        <header className="flex items-center justify-between gap-4 border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Diesel Adjustment History
            </h2>
            <p className="text-muted-foreground text-sm">
              Review every addition, usage, or correction logged for diesel
              inventory.
            </p>
          </div>
        </header>
        <div className="px-6 py-4">
          <Table>
            <TableHeader>
              <TableRow>
                {historyColumns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {diesel?.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-muted-foreground">
                    {formatPHDate(entry.event_date)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.type}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.volume_liters} L
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.reference}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {entry.recorded_by}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {isModalOpen && (
        <DieselModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          submitting={isSubmitting}
          onSubmit={handleCreateDiesel}
        />
      )}
    </div>
  );
}

type DieselAdjustmentType = "addition" | "consumption" | "correction";

type DieselModalFormValues = {
  event_date: string;
  volume_liters: number;
  type: DieselAdjustmentType;
  reference?: string;
  recorded_by?: string;
};

type DieselModalProps = {
  open: boolean;
  mode?: "create" | "update";
  submitting?: boolean;
  initialValues?: Partial<DieselModalFormValues>;
  onClose?: () => void;
  onSubmit?: (values: DieselModalFormValues) => Promise<void> | void;
  onDelete?: () => void;
};

function DieselModal({
  open,
  mode = "create",
  submitting = false,
  initialValues,
  onClose,
  onSubmit,
  onDelete,
}: DieselModalProps) {
  if (!open) return null;

  const title = mode === "update" ? "Update Diesel Entry" : "Add Diesel Entry";
  const description =
    mode === "update"
      ? "Modify the recorded details for this diesel adjustment."
      : "Log a new diesel delivery, usage, or correction.";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload: DieselModalFormValues = {
      event_date: (formData.get("event_date") as string) || "",
      volume_liters: Number(formData.get("volume_liters")) || 0,
      type: (formData.get("type") as DieselAdjustmentType) || "addition",
      reference: (formData.get("reference") as string) || "",
      recorded_by: (formData.get("recorded_by") as string) || "",
    };

    await onSubmit?.(payload);

    if (mode === "create") {
      form.reset();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg rounded-2xl border bg-card p-6 shadow-2xl">
        <header className="mb-4 space-y-1">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
              Date
              <input
                name="event_date"
                type="date"
                required
                defaultValue={initialValues?.event_date}
                className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
              Volume (L)
              <input
                name="volume_liters"
                type="number"
                required
                step="0.01"
                min="0"
                defaultValue={
                  initialValues?.volume_liters !== undefined
                    ? String(initialValues.volume_liters)
                    : ""
                }
                className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
              Adjustment Type
              <select
                name="type"
                defaultValue={initialValues?.type || "addition"}
                className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="addition">Addition</option>
                <option value="consumption">Consumption</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
              Reference
              <input
                name="reference"
                placeholder="e.g. Delivery #1023"
                defaultValue={initialValues?.reference}
                className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
            Recorded By
            <input
              name="recorded_by"
              placeholder="Name of operator"
              defaultValue={initialValues?.recorded_by}
              className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </label>

          <footer className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {mode === "update" && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={submitting}
              >
                Delete Entry
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : mode === "update"
                  ? "Save Changes"
                  : "Create Entry"}
              </Button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
